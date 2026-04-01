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
      circles:circle_id ( id, name, description, is_private, invite_code, created_by, created_at ),
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

      const visibleComments = data.flatMap((post) => (post.comments || []).filter((comment) => !comment.deleted_at));
      const mentionedUserIds = Array.from(new Set(visibleComments.flatMap((comment) => comment.mentioned_users || [])));
      const { data: mentionedUsers } = mentionedUserIds.length
        ? await supabase.from('users').select('id, name').in('id', mentionedUserIds)
        : { data: [] };
      const mentionedUsersMap = new Map((mentionedUsers || []).map((user) => [user.id, user]));
      const postIds = data.map((post) => post.id);
      const commentIds = visibleComments.map((comment) => comment.id);
      const { data: postReactions } = postIds.length
        ? await supabase.from('reactions').select('id, user_id, type, reference_id').eq('reference_type', 'post').in('reference_id', postIds)
        : { data: [] };
      const { data: commentReactions } = commentIds.length
        ? await supabase.from('reactions').select('id, user_id, type, reference_id').eq('reference_type', 'comment').in('reference_id', commentIds)
        : { data: [] };
      const postReactionsMap = new Map(postIds.map((id) => [id, (postReactions || []).filter((reaction) => reaction.reference_id === id)]));
      const commentReactionsMap = new Map(commentIds.map((id) => [id, (commentReactions || []).filter((reaction) => reaction.reference_id === id)]));

    return data.map((post) => ({
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

      return {
        user,
        stats: profileStatsFromData(userId, postsData || [], likesData || [], membersData || []),
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
      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: userId,
          content,
          image_url: imageUrl,
          circle_id: circleId || null,
          scheduled_for: scheduledFor,
        });
      if (error) throw error;

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
          circles:circle_id ( id, name, description, is_private, invite_code, created_by, created_at ),
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
  };
}
