import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';
import { buildMentionPayload } from '../services/mentionService.js';

function mapUser(user) {
  if (!user) return null;
  const { password_hash, ...rest } = user;
  return rest;
}

function normalizeCircle(circle, userId) {
  const membership = (circle.circle_members || []).find((member) => member.user_id === userId) || null;
  return {
    id: circle.id,
    name: circle.name,
    description: circle.description,
    is_private: circle.is_private,
    is_premium: circle.is_premium,
    premium_badge: circle.premium_badge,
    invite_code: membership?.role === 'admin' ? circle.invite_code : null,
    created_by: circle.created_by,
    created_at: circle.created_at,
    membersCount: (circle.circle_members || []).length,
    joined: Boolean(membership),
    myRole: membership?.role || null,
  };
}

function generateInviteCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function defaultSettings(userId) {
  return {
    user_id: userId,
    post_visibility: 'public',
    notify_likes: true,
    notify_comments: true,
    notify_mentions: true,
    notify_joins: true,
    weekly_digest: false,
  };
}

function profileStatsFromData(userId, posts, likes, circleMembers) {
  const userPosts = posts.filter((post) => post.user_id === userId);
  return {
    totalPosts: userPosts.length,
    totalLikesReceived: likes.filter((like) => userPosts.some((post) => post.id === like.post_id)).length,
    circlesJoined: circleMembers.filter((member) => member.user_id === userId).length,
  };
}

function summarizeReactions(reactions, currentUserId) {
  const counts = (reactions || []).reduce((accumulator, reaction) => {
    accumulator[reaction.type] = (accumulator[reaction.type] || 0) + 1;
    return accumulator;
  }, {});
  return {
    counts,
    total: (reactions || []).length,
    myReaction: currentUserId
      ? (reactions || []).find((reaction) => reaction.user_id === currentUserId)?.type || null
      : null,
  };
}

function getBadgeForStreak(currentStreak) {
  if (currentStreak >= 14) return { label: 'Momentum Master', tone: 'gold' };
  if (currentStreak >= 7) return { label: 'Consistency Builder', tone: 'accent' };
  if (currentStreak >= 3) return { label: 'On a Roll', tone: 'soft' };
  return { label: 'Starting Strong', tone: 'neutral' };
}

function buildWeeklyActivity(posts, currentDate = new Date()) {
  const series = [];
  for (let index = 6; index >= 0; index -= 1) {
    const bucket = new Date(currentDate);
    bucket.setUTCDate(bucket.getUTCDate() - index);
    const isoDay = bucket.toISOString().slice(0, 10);
    series.push({
      day: bucket.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
      date: isoDay,
      count: posts.filter((post) => post.created_at.slice(0, 10) === isoDay).length,
    });
  }
  return series;
}

function normalizeGoal(goal) {
  return {
    ...goal,
    progress_percent: goal.target_value > 0
      ? Math.min(100, Math.round(((goal.current_value || 0) / goal.target_value) * 100))
      : 0,
    is_complete: goal.status === 'completed' || (goal.current_value || 0) >= goal.target_value,
  };
}

function canViewSupabasePost(post, currentUserId, settingsMap, membershipMap, viewerCircleIds) {
  if (!post || post.deleted_at) return false;
  if (post.user_id === currentUserId) return true;

  const settings = settingsMap.get(post.user_id) || defaultSettings(post.user_id);
  if (settings.post_visibility === 'public') {
    return true;
  }

  if (!currentUserId) {
    return false;
  }

  if (post.circle_id) {
    return viewerCircleIds.has(post.circle_id);
  }

  const authorCircleIds = membershipMap.get(post.user_id) || [];
  return authorCircleIds.some((circleId) => viewerCircleIds.has(circleId));
}

export function createSupabaseRepository() {
  const supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
    },
  });

  async function loadPosts(currentUserId, circleId = null) {
    if (circleId) {
      const { data: circleAccess, error: circleError } = await supabase
        .from('circles')
        .select(`
          id,
          is_private,
          circle_members ( user_id )
        `)
        .eq('id', circleId)
        .maybeSingle();
      if (circleError) throw circleError;
      if (!circleAccess) return [];

      const isMember = (circleAccess.circle_members || []).some((member) => member.user_id === currentUserId);
      if (circleAccess.is_private && !isMember) {
        return [];
      }
    }

    let query = supabase
    .from('posts')
    .select(`
      id,
      user_id,
      circle_id,
      content,
      image_url,
      scheduled_for,
      updated_at,
      deleted_at,
      created_at,
      users:user_id ( id, name, email, bio, avatar_url, skills, created_at ),
      circles:circle_id ( id, name, description, is_private, is_premium, premium_badge, invite_code, created_by, created_at ),
      comments (
        id,
        user_id,
        post_id,
        content,
        mentioned_users,
        updated_at,
        deleted_at,
        created_at,
        users:user_id ( id, name, email, bio, avatar_url, skills, created_at )
      ),
      likes ( id, user_id, post_id )
    `)
    .order('created_at', { ascending: false });

    if (circleId) {
      query = query.eq('circle_id', circleId);
    }
    query = query.is('deleted_at', null);

    const { data, error } = await query;
    if (error) throw error;

      const authorIds = Array.from(new Set(data.map((post) => post.user_id)));
      const { data: settingsRows } = authorIds.length
        ? await supabase.from('user_settings').select('user_id, post_visibility').in('user_id', authorIds)
        : { data: [] };
      const settingsMap = new Map((settingsRows || []).map((row) => [row.user_id, row]));
      const membershipUserIds = currentUserId
        ? Array.from(new Set([...authorIds, currentUserId]))
        : authorIds;
      const { data: membershipRows } = membershipUserIds.length
        ? await supabase.from('circle_members').select('user_id, circle_id').in('user_id', membershipUserIds)
        : { data: [] };
      const membershipMap = new Map();
      (membershipRows || []).forEach((row) => {
        membershipMap.set(row.user_id, [...(membershipMap.get(row.user_id) || []), row.circle_id]);
      });
      const viewerCircleIds = new Set(membershipMap.get(currentUserId) || []);
      const visiblePosts = data.filter((post) => canViewSupabasePost(
        post,
        currentUserId,
        settingsMap,
        membershipMap,
        viewerCircleIds,
      ));

      const visibleComments = visiblePosts.flatMap((post) => (post.comments || []).filter((comment) => !comment.deleted_at));
      const mentionedUserIds = Array.from(new Set(visibleComments.flatMap((comment) => comment.mentioned_users || [])));
      const { data: mentionedUsers } = mentionedUserIds.length
        ? await supabase.from('users').select('id, name').in('id', mentionedUserIds)
        : { data: [] };
      const mentionedUsersMap = new Map((mentionedUsers || []).map((user) => [user.id, user]));
      const postIds = visiblePosts.map((post) => post.id);
      const commentIds = visibleComments.map((comment) => comment.id);
      const { data: postReactions } = postIds.length
        ? await supabase.from('reactions').select('id, user_id, type, reference_id').eq('reference_type', 'post').in('reference_id', postIds)
        : { data: [] };
      const { data: commentReactions } = commentIds.length
        ? await supabase.from('reactions').select('id, user_id, type, reference_id').eq('reference_type', 'comment').in('reference_id', commentIds)
        : { data: [] };
      const postReactionsMap = new Map(postIds.map((id) => [id, (postReactions || []).filter((reaction) => reaction.reference_id === id)]));
      const commentReactionsMap = new Map(commentIds.map((id) => [id, (commentReactions || []).filter((reaction) => reaction.reference_id === id)]));

    return visiblePosts.map((post) => ({
      id: post.id,
      user_id: post.user_id,
      circle_id: post.circle_id,
      content: post.content,
      image_url: post.image_url,
      created_at: post.created_at,
      author: mapUser(post.users),
      circle: post.circles,
      comments: (post.comments || []).filter((comment) => !comment.deleted_at).map((comment) => ({
        ...comment,
        author: mapUser(comment.users),
        mentionedUsers: buildMentionPayload(
          (comment.mentioned_users || [])
            .map((mentionedUserId) => mentionedUsersMap.get(mentionedUserId))
            .filter(Boolean),
        ),
        reactions: summarizeReactions(commentReactionsMap.get(comment.id), currentUserId),
        isEdited: comment.updated_at && comment.updated_at !== comment.created_at,
      })),
      commentsCount: (post.comments || []).filter((comment) => !comment.deleted_at).length,
      likesCount: (post.likes || []).length,
      likedByMe: currentUserId
        ? (post.likes || []).some((like) => like.user_id === currentUserId)
        : false,
      reactions: summarizeReactions(postReactionsMap.get(post.id), currentUserId),
      isEdited: post.updated_at && post.updated_at !== post.created_at,
    }));
  }

  async function ensureUserSettings(userId) {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    if (data) return data;

    const { data: inserted, error: insertError } = await supabase
      .from('user_settings')
      .insert(defaultSettings(userId))
      .select('*')
      .single();
    if (insertError) throw insertError;
    return inserted;
  }

  async function ensureStreak(userId) {
    const { data, error } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    if (data) return data;

    const { data: inserted, error: insertError } = await supabase
      .from('streaks')
      .insert({ user_id: userId, current_streak: 0, last_posted_at: null })
      .select('*')
      .single();
    if (insertError) throw insertError;
    return inserted;
  }

  async function recordPostStreak(userId, postedAt) {
    const streak = await ensureStreak(userId);
    const normalizedTarget = new Date(postedAt);
    normalizedTarget.setUTCHours(0, 0, 0, 0);
    let nextStreak = streak.current_streak || 0;

    if (!streak.last_posted_at) {
      nextStreak = 1;
    } else {
      const previous = new Date(streak.last_posted_at);
      previous.setUTCHours(0, 0, 0, 0);
      const diffDays = Math.round((normalizedTarget - previous) / 86400000);
      if (diffDays === 1) {
        nextStreak += 1;
      } else if (diffDays > 1) {
        nextStreak = 1;
      }
    }

    const { data, error } = await supabase
      .from('streaks')
      .update({
        current_streak: nextStreak,
        last_posted_at: postedAt,
      })
      .eq('user_id', userId)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }

  async function listUserGoals(userId) {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(normalizeGoal);
  }

  async function listSkillProgress(userId) {
    const { data, error } = await supabase
      .from('skill_progress')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async function buildRetentionOverview(userId) {
    const [streak, goals, skillProgress, postsData] = await Promise.all([
      ensureStreak(userId),
      listUserGoals(userId),
      listSkillProgress(userId),
      supabase.from('posts').select('id, user_id, created_at, deleted_at').eq('user_id', userId),
    ]);

    const activeGoals = goals.filter((goal) => goal.status === 'active' && !goal.is_complete);
    const completedGoals = goals.filter((goal) => goal.is_complete);
    const averageProgress = skillProgress.length
      ? Math.round(skillProgress.reduce((total, entry) => total + (entry.progress_percent || 0), 0) / skillProgress.length)
      : 0;

    return {
      streak: {
        ...streak,
        badge: getBadgeForStreak(streak.current_streak || 0),
      },
      goals,
      skillProgress,
      summary: {
        activeGoals: activeGoals.length,
        completedGoals: completedGoals.length,
        averageSkillProgress: averageProgress,
        weeklyCheckins: buildWeeklyActivity((postsData.data || []).filter((post) => !post.deleted_at))
          .reduce((total, item) => total + item.count, 0),
      },
    };
  }

  return {
    async findUserById(id) {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, bio, avatar_url, skills, created_at')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    async getProfile(userId) {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, name, email, bio, avatar_url, skills, created_at')
        .eq('id', userId)
        .maybeSingle();
      if (userError) throw userError;
      if (!user) return null;

      const [{ data: postsData, error: postsError }, { data: likesData, error: likesError }, { data: membersData, error: membersError }] = await Promise.all([
        supabase.from('posts').select('id, user_id').eq('user_id', userId),
        supabase.from('likes').select('id, post_id'),
        supabase.from('circle_members').select('id, user_id').eq('user_id', userId),
      ]);
      if (postsError) throw postsError;
      if (likesError) throw likesError;
      if (membersError) throw membersError;

      const [settings, streak, retention] = await Promise.all([
        ensureUserSettings(userId),
        ensureStreak(userId),
        buildRetentionOverview(userId),
      ]);

      return {
        user,
        stats: profileStatsFromData(userId, postsData || [], likesData || [], membersData || []),
        settings,
        streak: {
          ...streak,
          badge: getBadgeForStreak(streak.current_streak || 0),
        },
        retention,
      };
    },
    async findUserWithPasswordByEmail(email) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    async createUser({ name, email, passwordHash }) {
      const { data, error } = await supabase
        .from('users')
        .insert({
          name,
          email,
          password_hash: passwordHash,
        })
        .select('id, name, email, bio, avatar_url, skills, created_at')
        .single();
      if (error) throw error;
      await Promise.all([
        supabase.from('user_settings').insert(defaultSettings(data.id)),
        supabase.from('streaks').insert({ user_id: data.id, current_streak: 0, last_posted_at: null }),
        supabase.from('goals').insert([]).select().limit(0).catch(() => null),
      ]);
      return data;
    },
    async updateProfile(userId, payload) {
      const { data, error } = await supabase
        .from('users')
        .update(payload)
        .eq('id', userId)
        .select('id, name, email, bio, avatar_url, skills, created_at')
        .single();
      if (error) throw error;
      return data;
    },
    async getFeed(currentUserId, circleId = null) {
      return loadPosts(currentUserId, circleId);
    },
    async createPost({ userId, content, imageUrl, circleId, scheduledFor = null }) {
      const createdAt = new Date().toISOString();
      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: userId,
          content,
          image_url: imageUrl,
          circle_id: circleId || null,
          scheduled_for: scheduledFor,
          created_at: createdAt,
          updated_at: createdAt,
        });
      if (error) throw error;

      await Promise.all([
        recordPostStreak(userId, createdAt),
        supabase.rpc('increment_user_total_posts', { target_user_id: userId }).catch(() => null),
      ]);

      const posts = await loadPosts(userId, circleId || null);
      return posts[0];
    },
    async getCommentById(commentId) {
      const { data, error } = await supabase
        .from('comments')
        .select('id, user_id, post_id, content, mentioned_users, updated_at, deleted_at, created_at')
        .eq('id', commentId)
        .maybeSingle();
      if (error) throw error;
      if (!data || data.deleted_at) return null;
      return data;
    },
    async getPostById(postId, currentUserId) {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          user_id,
          circle_id,
          content,
          image_url,
          scheduled_for,
          updated_at,
          deleted_at,
          created_at,
          users:user_id ( id, name, email, bio, avatar_url, skills, created_at ),
          circles:circle_id ( id, name, description, is_private, is_premium, premium_badge, invite_code, created_by, created_at ),
          comments (
            id,
            user_id,
            post_id,
            content,
            mentioned_users,
            updated_at,
            deleted_at,
            created_at,
            users:user_id ( id, name, email, bio, avatar_url, skills, created_at )
          ),
          likes ( id, user_id, post_id )
        `)
        .eq('id', postId)
        .maybeSingle();
      if (error) throw error;
      if (!data || data.deleted_at) return null;

      const [settingsRows, membershipRows] = await Promise.all([
        supabase.from('user_settings').select('user_id, post_visibility').eq('user_id', data.user_id),
        currentUserId
          ? supabase.from('circle_members').select('user_id, circle_id').in('user_id', [data.user_id, currentUserId])
          : Promise.resolve({ data: [] }),
      ]);
      const settingsMap = new Map((settingsRows.data || []).map((row) => [row.user_id, row]));
      const membershipMap = new Map();
      (membershipRows.data || []).forEach((row) => {
        membershipMap.set(row.user_id, [...(membershipMap.get(row.user_id) || []), row.circle_id]);
      });
      const viewerCircleIds = new Set(membershipMap.get(currentUserId) || []);
      if (!canViewSupabasePost(data, currentUserId, settingsMap, membershipMap, viewerCircleIds)) {
        return null;
      }

      const mentionedUserIds = Array.from(
        new Set((data.comments || []).filter((comment) => !comment.deleted_at).flatMap((comment) => comment.mentioned_users || [])),
      );
      const { data: mentionedUsers } = mentionedUserIds.length
        ? await supabase.from('users').select('id, name').in('id', mentionedUserIds)
        : { data: [] };
      const mentionedUsersMap = new Map((mentionedUsers || []).map((user) => [user.id, user]));
      const commentIds = (data.comments || []).filter((comment) => !comment.deleted_at).map((comment) => comment.id);
      const { data: postReactions } = await supabase
        .from('reactions')
        .select('id, user_id, type, reference_id')
        .eq('reference_type', 'post')
        .eq('reference_id', data.id);
      const { data: commentReactions } = commentIds.length
        ? await supabase.from('reactions').select('id, user_id, type, reference_id').eq('reference_type', 'comment').in('reference_id', commentIds)
        : { data: [] };
      const commentReactionsMap = new Map(commentIds.map((id) => [id, (commentReactions || []).filter((reaction) => reaction.reference_id === id)]));

      return {
        id: data.id,
        user_id: data.user_id,
        circle_id: data.circle_id,
        content: data.content,
        image_url: data.image_url,
        created_at: data.created_at,
        author: mapUser(data.users),
        circle: data.circles,
        comments: (data.comments || []).filter((comment) => !comment.deleted_at).map((comment) => ({
          ...comment,
          author: mapUser(comment.users),
          mentionedUsers: buildMentionPayload(
            (comment.mentioned_users || [])
              .map((mentionedUserId) => mentionedUsersMap.get(mentionedUserId))
              .filter(Boolean),
          ),
          reactions: summarizeReactions(commentReactionsMap.get(comment.id), currentUserId),
          isEdited: comment.updated_at && comment.updated_at !== comment.created_at,
        })),
        commentsCount: (data.comments || []).filter((comment) => !comment.deleted_at).length,
        likesCount: (data.likes || []).length,
        likedByMe: currentUserId
          ? (data.likes || []).some((like) => like.user_id === currentUserId)
          : false,
        reactions: summarizeReactions(postReactions, currentUserId),
        isEdited: data.updated_at && data.updated_at !== data.created_at,
      };
    },
    async toggleLike(postId, userId) {
      const { data: post, error: postError } = await supabase
        .from('posts')
        .select('id, user_id')
        .eq('id', postId)
        .maybeSingle();
      if (postError) throw postError;

      const { data: existing, error: existingError } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .maybeSingle();
      if (existingError) throw existingError;

      if (existing) {
        const { error } = await supabase.from('likes').delete().eq('id', existing.id);
        if (error) throw error;
        return { liked: false, notificationTargetUserId: null };
      }

      const { error } = await supabase.from('likes').insert({ post_id: postId, user_id: userId });
      if (error) throw error;
      return {
        liked: true,
        notificationTargetUserId: post && post.user_id !== userId ? post.user_id : null,
      };
    },
    async addComment(postId, userId, content, mentionedUserIds = []) {
      const { data: post, error: postError } = await supabase
        .from('posts')
        .select('id, user_id')
        .eq('id', postId)
        .maybeSingle();
      if (postError) throw postError;

      const { data, error } = await supabase
        .from('comments')
        .insert({ post_id: postId, user_id: userId, content, mentioned_users: mentionedUserIds })
        .select(`
          id,
          user_id,
          post_id,
          content,
          mentioned_users,
          updated_at,
          deleted_at,
          created_at,
          users:user_id ( id, name, email, bio, avatar_url, skills, created_at )
        `)
        .single();
      if (error) throw error;
      return {
        ...data,
        author: mapUser(data.users),
        mentionedUsers: buildMentionPayload(
          (await Promise.all(
            mentionedUserIds.map(async (mentionedUserId) => {
              const { data: mentionedUser } = await supabase
                .from('users')
                .select('id, name')
                .eq('id', mentionedUserId)
                .maybeSingle();
              return mentionedUser;
            }),
          )).filter(Boolean),
        ),
        reactions: summarizeReactions([], userId),
        notificationTargetUserId: post && post.user_id !== userId ? post.user_id : null,
      };
    },
    async toggleReaction({ userId, referenceType, referenceId, reactionType }) {
      const { data: existing, error: existingError } = await supabase
        .from('reactions')
        .select('id, type')
        .eq('user_id', userId)
        .eq('reference_type', referenceType)
        .eq('reference_id', referenceId)
        .maybeSingle();
      if (existingError) throw existingError;

      if (existing && existing.type === reactionType) {
        const { error } = await supabase.from('reactions').delete().eq('id', existing.id);
        if (error) throw error;
      } else if (existing) {
        const { error } = await supabase.from('reactions').update({ type: reactionType }).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('reactions').insert({
          user_id: userId,
          reference_type: referenceType,
          reference_id: referenceId,
          type: reactionType,
        });
        if (error) throw error;
      }

      const { data, error } = await supabase
        .from('reactions')
        .select('id, user_id, type')
        .eq('reference_type', referenceType)
        .eq('reference_id', referenceId);
      if (error) throw error;
      return summarizeReactions(data, userId);
    },
    async listCircles(userId) {
      const { data, error } = await supabase
        .from('circles')
        .select(`
          id,
          name,
          description,
          is_private,
          is_premium,
          premium_badge,
          invite_code,
          created_by,
          created_at,
          circle_members ( user_id, role )
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;

      return data.map((circle) => normalizeCircle(circle, userId));
    },
    async createCircle({ name, description, isPrivate, userId }) {
      let circleData = null;
      let lastError = null;

      for (let attempt = 0; attempt < 5; attempt += 1) {
        const inviteCode = isPrivate ? generateInviteCode() : null;
        const { data, error } = await supabase
          .from('circles')
          .insert({
            name,
            description,
            is_private: Boolean(isPrivate),
            invite_code: inviteCode,
            created_by: userId,
          })
          .select('*')
          .single();
        if (!error) {
          circleData = data;
          lastError = null;
          break;
        }
        lastError = error;
      }

      if (lastError) throw lastError;

      const { error: memberError } = await supabase.from('circle_members').insert({
        user_id: userId,
        circle_id: circleData.id,
        role: 'admin',
      });
      if (memberError) throw memberError;

      return {
        ...circleData,
        membersCount: 1,
        joined: true,
        myRole: 'admin',
      };
    },
    async joinCircle(circleId, userId) {
      const { data: circle, error: circleError } = await supabase
        .from('circles')
        .select('id, is_private, created_by')
        .eq('id', circleId)
        .maybeSingle();
      if (circleError) throw circleError;
      if (!circle) {
        const error = new Error('Circle not found.');
        error.status = 404;
        throw error;
      }
      if (circle.is_private) {
        const error = new Error('This private circle requires an invite code.');
        error.status = 400;
        throw error;
      }

      const { error } = await supabase.from('circle_members').upsert(
        {
          user_id: userId,
          circle_id: circleId,
          role: 'member',
        },
        { onConflict: 'user_id,circle_id', ignoreDuplicates: true },
      );
      if (error) throw error;
      return {
        joined: true,
        notificationTargetUserId: circle.created_by !== userId ? circle.created_by : null,
      };
    },
    async joinCircleByCode(code, userId) {
      const normalizedCode = code?.trim().toUpperCase();
      const { data: circle, error: circleError } = await supabase
        .from('circles')
        .select(`
          id,
          name,
          description,
          is_private,
          is_premium,
          premium_badge,
          invite_code,
          created_by,
          created_at,
          circle_members ( user_id, role )
        `)
        .eq('invite_code', normalizedCode)
        .maybeSingle();
      if (circleError) throw circleError;
      if (!circle || !circle.is_private) {
        const error = new Error('Invalid invite code.');
        error.status = 400;
        throw error;
      }

      const { error } = await supabase.from('circle_members').upsert(
        {
          user_id: userId,
          circle_id: circle.id,
          role: 'member',
        },
        { onConflict: 'user_id,circle_id', ignoreDuplicates: true },
      );
      if (error) throw error;

      const { data: updatedCircle, error: updatedCircleError } = await supabase
        .from('circles')
        .select(`
          id,
          name,
          description,
          is_private,
          is_premium,
          premium_badge,
          invite_code,
          created_by,
          created_at,
          circle_members ( user_id, role )
        `)
        .eq('id', circle.id)
        .single();
      if (updatedCircleError) throw updatedCircleError;

      return {
        joined: true,
        circle: normalizeCircle(updatedCircle, userId),
        notificationTargetUserId: circle.created_by !== userId ? circle.created_by : null,
      };
    },
    async leaveCircle(circleId, userId) {
      const { data: membership, error: membershipError } = await supabase
        .from('circle_members')
        .select('id, role')
        .eq('circle_id', circleId)
        .eq('user_id', userId)
        .maybeSingle();
      if (membershipError) throw membershipError;
      if (!membership) {
        const error = new Error('You are not a member of this circle.');
        error.status = 400;
        throw error;
      }
      if (membership.role === 'admin') {
        const error = new Error('Admins cannot leave their own circle.');
        error.status = 400;
        throw error;
      }

      const { error } = await supabase.from('circle_members').delete().eq('id', membership.id);
      if (error) throw error;
      return { left: true };
    },
    async getCircle(circleId, userId) {
      const { data, error } = await supabase
        .from('circles')
        .select(`
          id,
          name,
          description,
          is_private,
          is_premium,
          premium_badge,
          invite_code,
          created_by,
          created_at,
          circle_members (
            user_id,
            role,
            users:user_id ( id, name, email, bio, avatar_url, skills, created_at )
          )
        `)
        .eq('id', circleId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;

      const normalizedCircle = normalizeCircle(data, userId);
      const membership = (data.circle_members || []).find((member) => member.user_id === userId) || null;

      return {
        ...normalizedCircle,
        members: membership
          ? (data.circle_members || []).map((member) => ({
            ...mapUser(member.users),
            role: member.role,
          }))
          : [],
      };
    },
    async getDashboard(userId) {
      const { data: memberships, error: membershipError } = await supabase
        .from('circle_members')
        .select('circle_id')
        .eq('user_id', userId);
      if (membershipError) throw membershipError;

      const joinedCircleIds = (memberships || []).map((member) => member.circle_id);
      const [feed, notifications, streak, retention] = await Promise.all([
        joinedCircleIds.length ? loadPosts(userId) : loadPosts(userId),
        this.listNotifications(userId),
        ensureStreak(userId),
        buildRetentionOverview(userId),
      ]);

      return {
        feed: joinedCircleIds.length
          ? feed.filter((post) => post.circle_id && joinedCircleIds.includes(post.circle_id))
          : feed,
        highlights: notifications.slice(0, 5),
        streak: {
          ...streak,
          badge: getBadgeForStreak(streak.current_streak || 0),
        },
        insights: {
          joinedCircles: joinedCircleIds.length,
          totalPosts: feed.filter((post) => post.author?.id === userId).length,
          activeCircleCount: new Set(feed.filter((post) => post.author?.id === userId && post.circle_id).map((post) => post.circle_id)).size,
        },
        retention,
      };
    },
    async searchCircle(circleId, query, userId) {
      const [posts, members] = await Promise.all([
        loadPosts(userId, circleId),
        this.listCircleMembers(circleId, userId),
      ]);
      const normalizedQuery = query.toLowerCase();
      return {
        posts: posts.filter((post) => post.content.toLowerCase().includes(normalizedQuery)),
        members: members.filter((member) => member.name.toLowerCase().includes(normalizedQuery)),
      };
    },
    async createNotification({ userId, type, referenceId, triggeredBy }) {
      if (!userId || userId === triggeredBy) return null;
      let postCircleId = null;
      if (['like', 'comment', 'mention'].includes(type)) {
        const { data: post } = await supabase
          .from('posts')
          .select('id, circle_id')
          .eq('id', referenceId)
          .maybeSingle();
        postCircleId = post?.circle_id || null;
      }
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          reference_id: referenceId,
          triggered_by: triggeredBy,
        })
        .select(`
          id,
          user_id,
          type,
          reference_id,
          triggered_by,
          is_read,
          created_at,
          users:triggered_by ( id, name, email, bio, avatar_url, skills, created_at )
        `)
        .single();
      if (error) throw error;
      return {
        ...data,
        actor: mapUser(data.users),
        post_id: ['like', 'comment', 'mention'].includes(type) ? referenceId : null,
        circle_id: type === 'join' ? referenceId : postCircleId,
      };
    },
    async listNotifications(userId) {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          id,
          user_id,
          type,
          reference_id,
          triggered_by,
          is_read,
          created_at,
          users:triggered_by ( id, name, email, bio, avatar_url, skills, created_at )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const postIds = data
        .filter((notification) => ['like', 'comment', 'mention'].includes(notification.type))
        .map((notification) => notification.reference_id);
      const { data: relatedPosts } = postIds.length
        ? await supabase.from('posts').select('id, circle_id').in('id', postIds)
        : { data: [] };
      const postCircleMap = new Map((relatedPosts || []).map((post) => [post.id, post.circle_id]));

      return data.map((notification) => ({
        ...notification,
        actor: mapUser(notification.users),
        post_id: ['like', 'comment', 'mention'].includes(notification.type) ? notification.reference_id : null,
        circle_id: notification.type === 'join'
          ? notification.reference_id
          : postCircleMap.get(notification.reference_id) || null,
      }));
    },
    async markNotificationRead(notificationId, userId) {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', userId)
        .select(`
          id,
          user_id,
          type,
          reference_id,
          triggered_by,
          is_read,
          created_at,
          users:triggered_by ( id, name, email, bio, avatar_url, skills, created_at )
        `)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        const notFound = new Error('Notification not found.');
        notFound.status = 404;
        throw notFound;
      }

      let postCircleId = null;
      if (['like', 'comment', 'mention'].includes(data.type)) {
        const { data: post } = await supabase
          .from('posts')
          .select('id, circle_id')
          .eq('id', data.reference_id)
          .maybeSingle();
        postCircleId = post?.circle_id || null;
      }

      return {
        ...data,
        actor: mapUser(data.users),
        post_id: ['like', 'comment', 'mention'].includes(data.type) ? data.reference_id : null,
        circle_id: data.type === 'join' ? data.reference_id : postCircleId,
      };
    },
    async search(query, userId) {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, email, bio, avatar_url, skills, created_at')
        .ilike('name', `%${query}%`)
        .limit(6);
      if (usersError) throw usersError;

      const { data: circlesData, error: circlesError } = await supabase
        .from('circles')
        .select(`
          id,
          name,
          description,
          is_private,
          is_premium,
          premium_badge,
          invite_code,
          created_by,
          created_at,
          circle_members ( user_id, role )
        `)
        .ilike('name', `%${query}%`)
        .limit(6);
      if (circlesError) throw circlesError;

      return {
        users: usersData || [],
        circles: (circlesData || [])
          .filter((circle) => !circle.is_private || (circle.circle_members || []).some((member) => member.user_id === userId))
          .map((circle) => normalizeCircle(circle, userId)),
      };
    },
    async listMessages(circleId, userId) {
      const { data: circleAccess, error: circleError } = await supabase
        .from('circles')
        .select(`
          id,
          is_private,
          circle_members ( user_id )
        `)
        .eq('id', circleId)
        .maybeSingle();
      if (circleError) throw circleError;
      if (!circleAccess) return [];

      const isMember = (circleAccess.circle_members || []).some((member) => member.user_id === userId);
      if (circleAccess.is_private && !isMember) {
        return [];
      }

      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          circle_id,
          user_id,
          content,
          created_at,
          users:user_id ( id, name, email, bio, avatar_url, skills, created_at )
        `)
        .eq('circle_id', circleId)
        .order('created_at', { ascending: true });
      if (error) throw error;

      return (data || []).map((message) => ({
        id: message.id,
        circle_id: message.circle_id,
        user_id: message.user_id,
        content: message.content,
        created_at: message.created_at,
        author: mapUser(message.users),
      }));
    },
    async createMessage({ circleId, userId, content }) {
      const { data: membership, error: membershipError } = await supabase
        .from('circle_members')
        .select('id')
        .eq('circle_id', circleId)
        .eq('user_id', userId)
        .maybeSingle();
      if (membershipError) throw membershipError;
      if (!membership) {
        const error = new Error('Join the circle before sending messages.');
        error.status = 403;
        throw error;
      }

      const { data, error } = await supabase
        .from('messages')
        .insert({ circle_id: circleId, user_id: userId, content })
        .select(`
          id,
          circle_id,
          user_id,
          content,
          created_at,
          users:user_id ( id, name, email, bio, avatar_url, skills, created_at )
        `)
        .single();
      if (error) throw error;

      return {
        id: data.id,
        circle_id: data.circle_id,
        user_id: data.user_id,
        content: data.content,
        created_at: data.created_at,
        author: mapUser(data.users),
      };
    },
    async listCircleMembers(circleId, userId) {
      const { data: circleAccess, error: circleError } = await supabase
        .from('circles')
        .select(`
          id,
          is_private,
          circle_members (
            role,
            users:user_id ( id, name, email, bio, avatar_url, skills, created_at )
          )
        `)
        .eq('id', circleId)
        .maybeSingle();
      if (circleError) throw circleError;
      if (!circleAccess) return [];

      const members = (circleAccess.circle_members || []).map((member) => ({
        ...mapUser(member.users),
        role: member.role,
      }));
      const isMember = members.some((member) => member.id === userId);
      if (circleAccess.is_private && !isMember) {
        return [];
      }

      return members;
    },
    async getCircleRole(circleId, userId) {
      const { data, error } = await supabase
        .from('circle_members')
        .select('role')
        .eq('circle_id', circleId)
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return data?.role || null;
    },
    async updateCircleMemberRole(circleId, targetUserId, role, actingUserId) {
      const actingRole = await this.getCircleRole(circleId, actingUserId);
      if (actingRole !== 'admin') {
        const permissionError = new Error('Only admins can manage member roles.');
        permissionError.status = 403;
        throw permissionError;
      }
      if (targetUserId === actingUserId) {
        const selfError = new Error('Admins cannot change their own role.');
        selfError.status = 400;
        throw selfError;
      }

      const { data, error } = await supabase
        .from('circle_members')
        .update({ role })
        .eq('circle_id', circleId)
        .eq('user_id', targetUserId)
        .select(`
          role,
          users:user_id ( id, name, email, bio, avatar_url, skills, created_at )
        `)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        const notFound = new Error('Member not found.');
        notFound.status = 404;
        throw notFound;
      }
      return {
        ...mapUser(data.users),
        role: data.role,
      };
    },
    async updatePost(postId, userId, content) {
      const { data, error } = await supabase
        .from('posts')
        .update({ content, updated_at: new Date().toISOString() })
        .eq('id', postId)
        .select('id')
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return this.getPostById(postId, userId);
    },
    async softDeletePost(postId) {
      const { data, error } = await supabase
        .from('posts')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', postId)
        .select('id, circle_id')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    async updateComment(commentId, userId, content, mentionedUserIds = []) {
      const { data, error } = await supabase
        .from('comments')
        .update({
          content,
          mentioned_users: mentionedUserIds,
          updated_at: new Date().toISOString(),
        })
        .eq('id', commentId)
        .select(`
          id,
          user_id,
          post_id,
          content,
          mentioned_users,
          updated_at,
          deleted_at,
          created_at,
          users:user_id ( id, name, email, bio, avatar_url, skills, created_at )
        `)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;

      const { data: mentionedUsers } = mentionedUserIds.length
        ? await supabase.from('users').select('id, name').in('id', mentionedUserIds)
        : { data: [] };
      const { data: reactionRows } = await supabase
        .from('reactions')
        .select('id, user_id, type')
        .eq('reference_type', 'comment')
        .eq('reference_id', commentId);

      return {
        ...data,
        author: mapUser(data.users),
        mentionedUsers: buildMentionPayload(mentionedUsers || []),
        reactions: summarizeReactions(reactionRows, userId),
        isEdited: true,
      };
    },
    async softDeleteComment(commentId) {
      const { data, error } = await supabase
        .from('comments')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', commentId)
        .select('id, post_id')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    async canModerateCircleContent(circleId, userId) {
      const role = await this.getCircleRole(circleId, userId);
      return ['admin', 'moderator'].includes(role);
    },
    async getUserSettings(userId) {
      return ensureUserSettings(userId);
    },
    async updateUserSettings(userId, payload) {
      await ensureUserSettings(userId);
      const { data, error } = await supabase
        .from('user_settings')
        .update({
          ...payload,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    async getUserAnalytics(userId) {
      const [profile, streak, postsData, memberships, retention] = await Promise.all([
        this.getProfile(userId),
        ensureStreak(userId),
        supabase.from('posts').select('id, circle_id, created_at, deleted_at').eq('user_id', userId),
        supabase.from('circle_members').select('circle_id').eq('user_id', userId),
        buildRetentionOverview(userId),
      ]);

      const visiblePosts = (postsData.data || []).filter((post) => !post.deleted_at);
      const topCircleId = visiblePosts
        .reduce((accumulator, post) => {
          if (!post.circle_id) return accumulator;
          accumulator[post.circle_id] = (accumulator[post.circle_id] || 0) + 1;
          return accumulator;
        }, {});
      const topCircleEntry = Object.entries(topCircleId).sort((left, right) => right[1] - left[1])[0];
      const topCircle = topCircleEntry
        ? (await supabase.from('circles').select('id, name, description, is_private, is_premium, premium_badge').eq('id', topCircleEntry[0]).maybeSingle()).data
        : null;

      return {
        totals: {
          posts: profile?.stats?.totalPosts || 0,
          reactionsReceived: profile?.user?.total_reactions || profile?.stats?.totalLikesReceived || 0,
          activeCircles: (memberships.data || []).length,
        },
        streak: {
          ...streak,
          badge: getBadgeForStreak(streak.current_streak || 0),
        },
        weeklyActivity: buildWeeklyActivity(visiblePosts),
        topCircle,
        retention,
      };
    },
    async getRetentionOverview(userId) {
      return buildRetentionOverview(userId);
    },
    async createGoal(userId, payload) {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('goals')
        .insert({
          user_id: userId,
          title: payload.title,
          description: payload.description || '',
          target_value: payload.targetValue,
          current_value: Math.min(payload.currentValue ?? 0, payload.targetValue),
          unit: payload.unit,
          cadence: payload.cadence,
          status: (payload.currentValue ?? 0) >= payload.targetValue ? 'completed' : 'active',
          due_date: payload.dueDate || null,
          created_at: now,
          updated_at: now,
        })
        .select('*')
        .single();
      if (error) throw error;
      return normalizeGoal(data);
    },
    async updateGoal(userId, goalId, payload) {
      const updates = {
        ...(payload.title !== undefined ? { title: payload.title } : {}),
        ...(payload.description !== undefined ? { description: payload.description } : {}),
        ...(payload.targetValue !== undefined ? { target_value: payload.targetValue } : {}),
        ...(payload.currentValue !== undefined ? { current_value: payload.currentValue } : {}),
        ...(payload.unit !== undefined ? { unit: payload.unit } : {}),
        ...(payload.cadence !== undefined ? { cadence: payload.cadence } : {}),
        ...(payload.dueDate !== undefined ? { due_date: payload.dueDate } : {}),
        updated_at: new Date().toISOString(),
      };

      const { data: existing, error: existingError } = await supabase
        .from('goals')
        .select('*')
        .eq('id', goalId)
        .eq('user_id', userId)
        .maybeSingle();
      if (existingError) throw existingError;
      if (!existing) {
        const notFound = new Error('Goal not found.');
        notFound.status = 404;
        throw notFound;
      }

      const targetValue = updates.target_value ?? existing.target_value;
      const currentValue = Math.max(0, Math.min(updates.current_value ?? existing.current_value, targetValue));
      updates.current_value = currentValue;
      updates.status = payload.status || (currentValue >= targetValue ? 'completed' : 'active');

      const { data, error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', goalId)
        .eq('user_id', userId)
        .select('*')
        .single();
      if (error) throw error;
      return normalizeGoal(data);
    },
    async deleteGoal(userId, goalId) {
      const { data, error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId)
        .eq('user_id', userId)
        .select('id')
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        const notFound = new Error('Goal not found.');
        notFound.status = 404;
        throw notFound;
      }
      return { deleted: true };
    },
    async upsertSkillProgress(userId, payload) {
      const now = new Date().toISOString();
      const { data: existing, error: existingError } = await supabase
        .from('skill_progress')
        .select('*')
        .eq('user_id', userId)
        .ilike('skill_name', payload.skillName)
        .maybeSingle();
      if (existingError) throw existingError;

      if (existing) {
        const { data, error } = await supabase
          .from('skill_progress')
          .update({
            skill_name: payload.skillName,
            progress_percent: payload.progressPercent,
            current_level: payload.currentLevel || '',
            target_level: payload.targetLevel || '',
            notes: payload.notes || '',
            updated_at: now,
          })
          .eq('id', existing.id)
          .select('*')
          .single();
        if (error) throw error;
        return data;
      }

      const { data, error } = await supabase
        .from('skill_progress')
        .insert({
          user_id: userId,
          skill_name: payload.skillName,
          progress_percent: payload.progressPercent,
          current_level: payload.currentLevel || '',
          target_level: payload.targetLevel || '',
          notes: payload.notes || '',
          created_at: now,
          updated_at: now,
        })
        .select('*')
        .single();
      if (error) throw error;
      return data;
    },
    async getCircleAnalytics(circleId, userId) {
      const [circle, role, feed, members, messagesData] = await Promise.all([
        this.getCircle(circleId, userId),
        this.getCircleRole(circleId, userId),
        loadPosts(userId, circleId),
        this.listCircleMembers(circleId, userId),
        supabase.from('messages').select('id, user_id, created_at').eq('circle_id', circleId),
      ]);
      if (!circle) return null;
      if (circle.is_private && !role) return null;

      const leaderboard = await Promise.all(
        members.slice(0, 8).map(async (member) => {
          const streak = await ensureStreak(member.id);
          return {
            ...member,
            totalPosts: feed.filter((post) => post.author?.id === member.id).length,
            streak: streak.current_streak || 0,
            badge: getBadgeForStreak(streak.current_streak || 0),
          };
        }),
      );

      return {
        circle,
        totals: {
          posts: feed.length,
          activeMembers: new Set(feed.filter((post) => {
            const age = Date.now() - new Date(post.created_at).getTime();
            return age <= 7 * 24 * 60 * 60 * 1000;
          }).map((post) => post.author?.id)).size,
          messages: (messagesData.data || []).length,
        },
        weeklyActivity: buildWeeklyActivity(feed),
        leaderboard: leaderboard.sort((left, right) => right.streak - left.streak || right.totalPosts - left.totalPosts).slice(0, 5),
        premium: {
          enabled: Boolean(circle.is_premium),
          badge: circle.premium_badge || 'core',
        },
      };
    },
  };
}
