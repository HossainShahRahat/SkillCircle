import { nanoid } from 'nanoid';
import {
  demoCircleMembers,
  demoCircles,
  demoComments,
  demoGoals,
  demoLikes,
  demoMessages,
  demoNotifications,
  demoPosts,
  demoReactions,
  demoSkillProgress,
  demoStreaks,
  demoUserSettings,
  demoUsers,
} from '../services/seedData.js';
import { buildMentionPayload } from '../services/mentionService.js';

function publicUser(user) {
  if (!user) return null;
  const { password_hash, ...rest } = user;
  return rest;
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
    updated_at: new Date().toISOString(),
  };
}

function summarizeReactions(reactions, currentUserId, referenceType, referenceId) {
  const targetReactions = reactions.filter(
    (reaction) => reaction.reference_type === referenceType && reaction.reference_id === referenceId,
  );
  const counts = targetReactions.reduce((accumulator, reaction) => {
    accumulator[reaction.type] = (accumulator[reaction.type] || 0) + 1;
    return accumulator;
  }, {});

  return {
    counts,
    total: targetReactions.length,
    myReaction: currentUserId
      ? targetReactions.find((reaction) => reaction.user_id === currentUserId)?.type || null
      : null,
  };
}

function enrichPost(post, users, circles, comments, likes, reactions, currentUserId) {
  const author = publicUser(users.find((user) => user.id === post.user_id));
  const circle = circles.find((item) => item.id === post.circle_id) || null;
  const postComments = comments
    .filter((comment) => comment.post_id === post.id && !comment.deleted_at)
    .map((comment) => ({
      ...comment,
      author: publicUser(users.find((user) => user.id === comment.user_id)),
      mentionedUsers: buildMentionPayload(
        users.filter((user) => (comment.mentioned_users || []).includes(user.id)),
      ),
      reactions: summarizeReactions(reactions, currentUserId, 'comment', comment.id),
      isEdited: comment.updated_at && comment.updated_at !== comment.created_at,
    }))
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const postLikes = likes.filter((like) => like.post_id === post.id);

  return {
    ...post,
    author,
    circle,
    comments: postComments,
    commentsCount: postComments.length,
    likesCount: postLikes.length,
    likedByMe: currentUserId ? postLikes.some((like) => like.user_id === currentUserId) : false,
    reactions: summarizeReactions(reactions, currentUserId, 'post', post.id),
    isEdited: post.updated_at && post.updated_at !== post.created_at,
  };
}

function getMembership(circleMembers, circleId, userId) {
  return circleMembers.find((member) => member.circle_id === circleId && member.user_id === userId) || null;
}

function serializeCircle(circle, circleMembers, userId) {
  const membership = userId ? getMembership(circleMembers, circle.id, userId) : null;
  return {
    ...circle,
    membersCount: circleMembers.filter((member) => member.circle_id === circle.id).length,
    joined: Boolean(membership),
    myRole: membership?.role || null,
  };
}

function getUserSettingsRecord(userSettings, userId) {
  let settings = userSettings.find((item) => item.user_id === userId);
  if (!settings) {
    settings = defaultSettings(userId);
    userSettings.push(settings);
  }
  return settings;
}

function getSharedCircleIds(circleMembers, firstUserId, secondUserId) {
  const firstCircles = circleMembers
    .filter((member) => member.user_id === firstUserId)
    .map((member) => member.circle_id);
  return firstCircles.filter((circleId) => Boolean(getMembership(circleMembers, circleId, secondUserId)));
}

function canViewPost(post, viewerId, userSettings, circleMembers) {
  if (!post || post.deleted_at) return false;
  if (!viewerId) return !post.circle_id;
  if (post.user_id === viewerId) return true;

  const settings = getUserSettingsRecord(userSettings, post.user_id);
  if (settings.post_visibility === 'public') {
    return true;
  }

  if (post.circle_id) {
    return Boolean(getMembership(circleMembers, post.circle_id, viewerId));
  }

  return getSharedCircleIds(circleMembers, post.user_id, viewerId).length > 0;
}

function generateInviteCode(existingCircles) {
  let code = '';
  do {
    code = Math.random().toString(36).slice(2, 8).toUpperCase();
  } while (existingCircles.some((circle) => circle.invite_code === code));
  return code;
}

function serializeNotification(notification, users, posts, circles) {
  const actor = publicUser(users.find((user) => user.id === notification.triggered_by));
  const post = posts.find((item) => item.id === notification.reference_id) || null;
  const circle = circles.find((item) => item.id === notification.reference_id) || null;

  return {
    ...notification,
    actor,
    post_id: post?.id || null,
    circle_id: circle?.id || post?.circle_id || null,
  };
}

function serializeCircleMember(member, users) {
  const user = users.find((item) => item.id === member.user_id);
  if (!user) return null;
  return {
    ...publicUser(user),
    role: member.role,
  };
}

function roleRank(role) {
  return { member: 1, moderator: 2, admin: 3 }[role] || 0;
}

function profileStats(userId, posts, likes, circleMembers) {
  const userPosts = posts.filter((post) => post.user_id === userId);
  return {
    totalPosts: userPosts.length,
    totalLikesReceived: likes.filter((like) => userPosts.some((post) => post.id === like.post_id)).length,
    circlesJoined: circleMembers.filter((member) => member.user_id === userId).length,
  };
}

function getStreakRecord(streaks, userId) {
  let streak = streaks.find((item) => item.user_id === userId);
  if (!streak) {
    streak = {
      user_id: userId,
      current_streak: 0,
      last_posted_at: null,
    };
    streaks.push(streak);
  }
  return streak;
}

function startOfDay(date) {
  const normalized = new Date(date);
  normalized.setUTCHours(0, 0, 0, 0);
  return normalized;
}

function updateStreak(streak, postedAt) {
  const targetDate = startOfDay(postedAt);
  if (!streak.last_posted_at) {
    streak.current_streak = 1;
    streak.last_posted_at = postedAt;
    return streak;
  }

  const lastDate = startOfDay(streak.last_posted_at);
  const diffDays = Math.round((targetDate - lastDate) / 86400000);
  if (diffDays <= 0) {
    streak.last_posted_at = postedAt;
    return streak;
  }
  if (diffDays === 1) {
    streak.current_streak += 1;
  } else {
    streak.current_streak = 1;
  }
  streak.last_posted_at = postedAt;
  return streak;
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
      ? Math.min(100, Math.round((goal.current_value / goal.target_value) * 100))
      : 0,
    is_complete: goal.status === 'completed' || goal.current_value >= goal.target_value,
  };
}

function getUserGoals(goals, userId) {
  return goals
    .filter((goal) => goal.user_id === userId)
    .sort((left, right) => new Date(right.updated_at || right.created_at) - new Date(left.updated_at || left.created_at))
    .map(normalizeGoal);
}

function getSkillProgressEntries(skillProgress, userId) {
  return skillProgress
    .filter((entry) => entry.user_id === userId)
    .sort((left, right) => new Date(right.updated_at || right.created_at) - new Date(left.updated_at || left.created_at));
}

function buildRetentionOverview({ userId, streaks, goals, skillProgress, posts }) {
  const streak = getStreakRecord(streaks, userId);
  const goalEntries = getUserGoals(goals, userId);
  const progressEntries = getSkillProgressEntries(skillProgress, userId);
  const activeGoals = goalEntries.filter((goal) => goal.status === 'active' && !goal.is_complete);
  const completedGoals = goalEntries.filter((goal) => goal.is_complete);
  const averageProgress = progressEntries.length
    ? Math.round(progressEntries.reduce((total, entry) => total + (entry.progress_percent || 0), 0) / progressEntries.length)
    : 0;

  return {
    streak: {
      ...streak,
      badge: getBadgeForStreak(streak.current_streak),
    },
    goals: goalEntries,
    skillProgress: progressEntries,
    summary: {
      activeGoals: activeGoals.length,
      completedGoals: completedGoals.length,
      averageSkillProgress: averageProgress,
      weeklyCheckins: buildWeeklyActivity(posts.filter((post) => post.user_id === userId && !post.deleted_at))
        .reduce((total, item) => total + item.count, 0),
    },
  };
}

function buildLeaderboard(circleId, circleMembers, posts, streaks, users) {
  return circleMembers
    .filter((member) => member.circle_id === circleId)
    .map((member) => {
      const memberPosts = posts.filter((post) => post.circle_id === circleId && post.user_id === member.user_id && !post.deleted_at);
      const streak = getStreakRecord(streaks, member.user_id);
      return {
        ...serializeCircleMember(member, users),
        totalPosts: memberPosts.length,
        streak: streak.current_streak,
        badge: getBadgeForStreak(streak.current_streak),
      };
    })
    .filter(Boolean)
    .sort((left, right) => right.streak - left.streak || right.totalPosts - left.totalPosts)
    .slice(0, 5);
}

function serializeMessage(message, users) {
  return {
    ...message,
    author: publicUser(users.find((user) => user.id === message.user_id)),
  };
}

export function createMemoryRepository() {
  const users = structuredClone(demoUsers);
  const posts = structuredClone(demoPosts);
  const comments = structuredClone(demoComments);
  const likes = structuredClone(demoLikes);
  const messages = structuredClone(demoMessages);
  const notifications = structuredClone(demoNotifications);
  const reactions = structuredClone(demoReactions);
  const circles = structuredClone(demoCircles);
  const circleMembers = structuredClone(demoCircleMembers);
  const streaks = structuredClone(demoStreaks);
  const goals = structuredClone(demoGoals);
  const skillProgress = structuredClone(demoSkillProgress);
  const userSettings = structuredClone(demoUserSettings);

  return {
    async findUserById(id) {
      return publicUser(users.find((user) => user.id === id));
    },
    async getProfile(userId) {
      const user = users.find((item) => item.id === userId);
      if (!user) return null;

      return {
        user: publicUser(user),
        stats: profileStats(userId, posts, likes, circleMembers),
        settings: getUserSettingsRecord(userSettings, userId),
        streak: {
          ...getStreakRecord(streaks, userId),
          badge: getBadgeForStreak(getStreakRecord(streaks, userId).current_streak),
        },
        retention: buildRetentionOverview({ userId, streaks, goals, skillProgress, posts }),
      };
    },
    async findUserWithPasswordByEmail(email) {
      return users.find((user) => user.email.toLowerCase() === email.toLowerCase()) || null;
    },
    async createUser({ name, email, passwordHash }) {
      const user = {
        id: `u_${nanoid(10)}`,
        name,
        email,
        password_hash: passwordHash,
        bio: '',
        avatar_url: '',
        skills: [],
        total_posts: 0,
        total_reactions: 0,
        created_at: new Date().toISOString(),
      };
      users.unshift(user);
      userSettings.push(defaultSettings(user.id));
      streaks.push({ user_id: user.id, current_streak: 0, last_posted_at: null });
      return publicUser(user);
    },
    async updateProfile(userId, payload) {
      const user = users.find((item) => item.id === userId);
      Object.assign(user, payload);
      return publicUser(user);
    },
    async getFeed(currentUserId, circleId = null) {
      const targetCircle = circleId ? circles.find((circle) => circle.id === circleId) : null;
      const canAccessCircle = !targetCircle
        || !targetCircle.is_private
        || Boolean(getMembership(circleMembers, circleId, currentUserId));

      if (circleId && !canAccessCircle) {
        return [];
      }

      return posts
        .filter((post) => (circleId ? post.circle_id === circleId : true))
        .filter((post) => canViewPost(post, currentUserId, userSettings, circleMembers))
        .filter((post) => !post.deleted_at)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .map((post) => enrichPost(post, users, circles, comments, likes, reactions, currentUserId));
    },
    async createPost({ userId, content, imageUrl, circleId, scheduledFor = null }) {
      const createdAt = new Date().toISOString();
      const post = {
        id: `p_${nanoid(10)}`,
        user_id: userId,
        circle_id: circleId || null,
        content,
        image_url: imageUrl || '',
        scheduled_for: scheduledFor,
        updated_at: createdAt,
        deleted_at: null,
        created_at: createdAt,
      };
      posts.unshift(post);
      const user = users.find((item) => item.id === userId);
      if (user) {
        user.total_posts = (user.total_posts || 0) + 1;
      }
      updateStreak(getStreakRecord(streaks, userId), createdAt);
      return enrichPost(post, users, circles, comments, likes, reactions, userId);
    },
    async getPostById(postId, currentUserId) {
      const post = posts.find((item) => item.id === postId && !item.deleted_at);
      if (!post) return null;
      return enrichPost(post, users, circles, comments, likes, reactions, currentUserId);
    },
    async getCommentById(commentId) {
      return comments.find((item) => item.id === commentId && !item.deleted_at) || null;
    },
    async listCircleMembers(circleId, userId) {
      const circle = circles.find((item) => item.id === circleId);
      if (!circle) return [];
      const isMember = Boolean(getMembership(circleMembers, circleId, userId));
      if (circle.is_private && !isMember) {
        return [];
      }

      return circleMembers
        .filter((member) => member.circle_id === circleId)
        .map((member) => serializeCircleMember(member, users))
        .filter(Boolean);
    },
    async getCircleRole(circleId, userId) {
      return getMembership(circleMembers, circleId, userId)?.role || null;
    },
    async updateCircleMemberRole(circleId, targetUserId, role, actingUserId) {
      const actingRole = getMembership(circleMembers, circleId, actingUserId)?.role;
      if (actingRole !== 'admin') {
        const error = new Error('Only admins can manage member roles.');
        error.status = 403;
        throw error;
      }

      const targetMembership = getMembership(circleMembers, circleId, targetUserId);
      if (!targetMembership) {
        const error = new Error('Member not found.');
        error.status = 404;
        throw error;
      }
      if (targetUserId === actingUserId) {
        const error = new Error('Admins cannot change their own role.');
        error.status = 400;
        throw error;
      }
      if (roleRank(targetMembership.role) === roleRank('admin') && role !== 'admin') {
        const admins = circleMembers.filter((member) => member.circle_id === circleId && member.role === 'admin');
        if (admins.length === 1) {
          const error = new Error('Each circle must keep at least one admin.');
          error.status = 400;
          throw error;
        }
      }

      targetMembership.role = role;
      return serializeCircleMember(targetMembership, users);
    },
    async toggleLike(postId, userId) {
      const post = posts.find((item) => item.id === postId);
      const existing = likes.find((like) => like.post_id === postId && like.user_id === userId);
      if (existing) {
        likes.splice(likes.indexOf(existing), 1);
        return { liked: false, notificationTargetUserId: null };
      }

      likes.push({
        id: `l_${nanoid(10)}`,
        user_id: userId,
        post_id: postId,
        created_at: new Date().toISOString(),
      });
      return {
        liked: true,
        notificationTargetUserId: post && post.user_id !== userId ? post.user_id : null,
      };
    },
    async addComment(postId, userId, content, mentionedUserIds = []) {
      const post = posts.find((item) => item.id === postId);
      const comment = {
        id: `co_${nanoid(10)}`,
        user_id: userId,
        post_id: postId,
        content,
        mentioned_users: mentionedUserIds,
        updated_at: new Date().toISOString(),
        deleted_at: null,
        created_at: new Date().toISOString(),
      };
      comments.push(comment);
      return {
        ...comment,
        author: publicUser(users.find((user) => user.id === userId)),
        mentionedUsers: buildMentionPayload(
          users.filter((user) => mentionedUserIds.includes(user.id)),
        ),
        reactions: summarizeReactions(reactions, userId, 'comment', comment.id),
        notificationTargetUserId: post && post.user_id !== userId ? post.user_id : null,
      };
    },
    async toggleReaction({ userId, referenceType, referenceId, reactionType }) {
      const existing = reactions.find(
        (reaction) => reaction.user_id === userId
          && reaction.reference_type === referenceType
          && reaction.reference_id === referenceId,
      );
      if (existing && existing.type === reactionType) {
        reactions.splice(reactions.indexOf(existing), 1);
      } else if (existing) {
        existing.type = reactionType;
      } else {
        reactions.push({
          id: `r_${nanoid(10)}`,
          user_id: userId,
          reference_type: referenceType,
          reference_id: referenceId,
          type: reactionType,
          created_at: new Date().toISOString(),
        });
      }

      if (referenceType === 'post') {
        const post = posts.find((item) => item.id === referenceId);
        const owner = post ? users.find((item) => item.id === post.user_id) : null;
        if (owner) {
          owner.total_reactions = reactions.filter(
            (reaction) => reaction.reference_type === 'post'
              && posts.some((item) => item.id === reaction.reference_id && item.user_id === owner.id),
          ).length;
        }
      }

      return summarizeReactions(reactions, userId, referenceType, referenceId);
    },
    async listCircles(userId) {
      return circles.map((circle) => serializeCircle(circle, circleMembers, userId));
    },
    async createCircle({ name, description, isPrivate, userId }) {
      const circle = {
        id: `c_${nanoid(10)}`,
        name,
        description,
        is_private: Boolean(isPrivate),
        invite_code: isPrivate ? generateInviteCode(circles) : null,
        created_by: userId,
        created_at: new Date().toISOString(),
      };
      circles.unshift(circle);
      circleMembers.push({
        id: `cm_${nanoid(10)}`,
        user_id: userId,
        circle_id: circle.id,
        role: 'admin',
        created_at: new Date().toISOString(),
      });
      return serializeCircle(circle, circleMembers, userId);
    },
    async joinCircle(circleId, userId) {
      const circle = circles.find((item) => item.id === circleId);
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

      const existing = circleMembers.find((member) => member.circle_id === circleId && member.user_id === userId);
      if (!existing) {
        circleMembers.push({
          id: `cm_${nanoid(10)}`,
          user_id: userId,
          circle_id: circleId,
          role: 'member',
          created_at: new Date().toISOString(),
        });
      }

      return {
        joined: true,
        notificationTargetUserId: circle.created_by !== userId ? circle.created_by : null,
      };
    },
    async joinCircleByCode(code, userId) {
      const circle = circles.find((item) => item.invite_code === code?.trim().toUpperCase());
      if (!circle || !circle.is_private) {
        const error = new Error('Invalid invite code.');
        error.status = 400;
        throw error;
      }

      const existing = getMembership(circleMembers, circle.id, userId);
      if (!existing) {
        circleMembers.push({
          id: `cm_${nanoid(10)}`,
          user_id: userId,
          circle_id: circle.id,
          role: 'member',
          created_at: new Date().toISOString(),
        });
      }

      return {
        joined: true,
        circle: serializeCircle(circle, circleMembers, userId),
        notificationTargetUserId: circle.created_by !== userId ? circle.created_by : null,
      };
    },
    async leaveCircle(circleId, userId) {
      const membership = getMembership(circleMembers, circleId, userId);
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

      circleMembers.splice(circleMembers.indexOf(membership), 1);
      return { left: true };
    },
    async getCircle(circleId, userId) {
      const circle = circles.find((item) => item.id === circleId);
      if (!circle) return null;
      const membership = userId ? getMembership(circleMembers, circle.id, userId) : null;

      if (circle.is_private && !membership) {
        return {
          ...serializeCircle(circle, circleMembers, userId),
          invite_code: null,
          members: [],
        };
      }

      return {
        ...serializeCircle(circle, circleMembers, userId),
        invite_code: membership?.role === 'admin' ? circle.invite_code : null,
        members: membership
          ? circleMembers
            .filter((member) => member.circle_id === circle.id)
            .map((member) => serializeCircleMember(member, users))
            .filter(Boolean)
          : [],
      };
    },
    async getDashboard(userId) {
      const joinedCircleIds = circleMembers
        .filter((member) => member.user_id === userId)
        .map((member) => member.circle_id);
      const personalizedFeed = posts
        .filter((post) => !post.deleted_at)
        .filter((post) => joinedCircleIds.length ? joinedCircleIds.includes(post.circle_id) : canViewPost(post, userId, userSettings, circleMembers))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .map((post) => enrichPost(post, users, circles, comments, likes, reactions, userId))
        .slice(0, 20);
      const highlights = notifications
        .filter((notification) => notification.user_id === userId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)
        .map((notification) => serializeNotification(notification, users, posts, circles));
      const streak = getStreakRecord(streaks, userId);
      const myPosts = posts.filter((post) => post.user_id === userId && !post.deleted_at);

      return {
        feed: personalizedFeed,
        highlights,
        streak: {
          ...streak,
          badge: getBadgeForStreak(streak.current_streak),
        },
        insights: {
          joinedCircles: joinedCircleIds.length,
          totalPosts: myPosts.length,
          activeCircleCount: new Set(myPosts.filter((post) => post.circle_id).map((post) => post.circle_id)).size,
        },
        retention: buildRetentionOverview({ userId, streaks, goals, skillProgress, posts }),
      };
    },
    async searchCircle(circleId, query, userId) {
      const circle = circles.find((item) => item.id === circleId);
      if (!circle) return { posts: [], members: [] };
      const normalizedQuery = query.toLowerCase();
      const isMember = Boolean(getMembership(circleMembers, circleId, userId));
      if (circle.is_private && !isMember) {
        return { posts: [], members: [] };
      }

      return {
        posts: posts
          .filter((post) => post.circle_id === circleId && !post.deleted_at)
          .filter((post) => post.content.toLowerCase().includes(normalizedQuery))
          .map((post) => enrichPost(post, users, circles, comments, likes, reactions, userId)),
        members: circleMembers
          .filter((member) => member.circle_id === circleId)
          .map((member) => serializeCircleMember(member, users))
          .filter(Boolean)
          .filter((member) => member.name.toLowerCase().includes(normalizedQuery)),
      };
    },
    async createNotification({ userId, type, referenceId, triggeredBy }) {
      if (!userId || userId === triggeredBy) return null;
      const notification = {
        id: `n_${nanoid(10)}`,
        user_id: userId,
        type,
        reference_id: referenceId,
        triggered_by: triggeredBy,
        is_read: false,
        created_at: new Date().toISOString(),
      };
      notifications.unshift(notification);
      return serializeNotification(notification, users, posts, circles);
    },
    async listNotifications(userId) {
      return notifications
        .filter((notification) => notification.user_id === userId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .map((notification) => serializeNotification(notification, users, posts, circles));
    },
    async markNotificationRead(notificationId, userId) {
      const notification = notifications.find((item) => item.id === notificationId && item.user_id === userId);
      if (!notification) {
        const error = new Error('Notification not found.');
        error.status = 404;
        throw error;
      }
      notification.is_read = true;
      return serializeNotification(notification, users, posts, circles);
    },
    async search(query, userId) {
      const normalizedQuery = query.toLowerCase();
      const matchedUsers = users
        .filter((user) => user.name.toLowerCase().includes(normalizedQuery))
        .slice(0, 6)
        .map((user) => publicUser(user));
      const matchedCircles = circles
        .filter((circle) => circle.name.toLowerCase().includes(normalizedQuery))
        .filter((circle) => !circle.is_private || Boolean(getMembership(circleMembers, circle.id, userId)))
        .slice(0, 6)
        .map((circle) => serializeCircle(circle, circleMembers, userId));

      return {
        users: matchedUsers,
        circles: matchedCircles,
      };
    },
    async listMessages(circleId, userId) {
      const circle = circles.find((item) => item.id === circleId);
      if (!circle) return [];
      const isMember = Boolean(getMembership(circleMembers, circleId, userId));
      if (circle.is_private && !isMember) {
        return [];
      }

      return messages
        .filter((message) => message.circle_id === circleId)
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        .map((message) => serializeMessage(message, users));
    },
    async createMessage({ circleId, userId, content }) {
      const circle = circles.find((item) => item.id === circleId);
      if (!circle) {
        const error = new Error('Circle not found.');
        error.status = 404;
        throw error;
      }
      if (!getMembership(circleMembers, circleId, userId)) {
        const error = new Error('Join the circle before sending messages.');
        error.status = 403;
        throw error;
      }

      const message = {
        id: `m_${nanoid(10)}`,
        circle_id: circleId,
        user_id: userId,
        content,
        created_at: new Date().toISOString(),
      };
      messages.push(message);
      return serializeMessage(message, users);
    },
    async updatePost(postId, userId, content) {
      const post = posts.find((item) => item.id === postId && !item.deleted_at);
      if (!post) return null;
      post.content = content;
      post.updated_at = new Date().toISOString();
      return enrichPost(post, users, circles, comments, likes, reactions, userId);
    },
    async softDeletePost(postId) {
      const post = posts.find((item) => item.id === postId && !item.deleted_at);
      if (!post) return null;
      post.deleted_at = new Date().toISOString();
      const user = users.find((item) => item.id === post.user_id);
      if (user) {
        user.total_posts = Math.max(0, (user.total_posts || 0) - 1);
      }
      return { id: postId, circle_id: post.circle_id };
    },
    async updateComment(commentId, userId, content, mentionedUserIds = []) {
      const comment = comments.find((item) => item.id === commentId && !item.deleted_at);
      if (!comment) return null;
      comment.content = content;
      comment.mentioned_users = mentionedUserIds;
      comment.updated_at = new Date().toISOString();
      return {
        ...comment,
        author: publicUser(users.find((user) => user.id === comment.user_id)),
        mentionedUsers: buildMentionPayload(users.filter((user) => mentionedUserIds.includes(user.id))),
        reactions: summarizeReactions(reactions, userId, 'comment', comment.id),
        isEdited: true,
      };
    },
    async softDeleteComment(commentId) {
      const comment = comments.find((item) => item.id === commentId && !item.deleted_at);
      if (!comment) return null;
      comment.deleted_at = new Date().toISOString();
      return { id: commentId, post_id: comment.post_id };
    },
    canModerateCircleContent(circleId, userId) {
      const role = getMembership(circleMembers, circleId, userId)?.role;
      return ['admin', 'moderator'].includes(role);
    },
    async getUserSettings(userId) {
      return getUserSettingsRecord(userSettings, userId);
    },
    async updateUserSettings(userId, payload) {
      const settings = getUserSettingsRecord(userSettings, userId);
      Object.assign(settings, payload, { updated_at: new Date().toISOString() });
      return settings;
    },
    async getUserAnalytics(userId) {
      const myPosts = posts.filter((post) => post.user_id === userId && !post.deleted_at);
      const streak = getStreakRecord(streaks, userId);
      const activeCircleIds = Array.from(new Set(myPosts.map((post) => post.circle_id).filter(Boolean)));
      const topCircleId = activeCircleIds.sort((left, right) => (
        myPosts.filter((post) => post.circle_id === right).length
        - myPosts.filter((post) => post.circle_id === left).length
      ))[0] || null;

      return {
        totals: {
          posts: myPosts.length,
          reactionsReceived: reactions.filter(
            (reaction) => reaction.reference_type === 'post'
              && myPosts.some((post) => post.id === reaction.reference_id),
          ).length,
          activeCircles: circleMembers.filter((member) => member.user_id === userId).length,
        },
        streak: {
          ...streak,
          badge: getBadgeForStreak(streak.current_streak),
        },
        weeklyActivity: buildWeeklyActivity(myPosts),
        topCircle: topCircleId ? circles.find((circle) => circle.id === topCircleId) || null : null,
        retention: buildRetentionOverview({ userId, streaks, goals, skillProgress, posts }),
      };
    },
    async getRetentionOverview(userId) {
      return buildRetentionOverview({ userId, streaks, goals, skillProgress, posts });
    },
    async createGoal(userId, payload) {
      const now = new Date().toISOString();
      const goal = {
        id: `g_${nanoid(10)}`,
        user_id: userId,
        title: payload.title,
        description: payload.description || '',
        target_value: payload.targetValue,
        current_value: Math.min(payload.currentValue ?? 0, payload.targetValue),
        unit: payload.unit,
        cadence: payload.cadence,
        status: payload.currentValue >= payload.targetValue ? 'completed' : 'active',
        due_date: payload.dueDate || null,
        created_at: now,
        updated_at: now,
      };
      goals.unshift(goal);
      return normalizeGoal(goal);
    },
    async updateGoal(userId, goalId, payload) {
      const goal = goals.find((item) => item.id === goalId && item.user_id === userId);
      if (!goal) {
        const error = new Error('Goal not found.');
        error.status = 404;
        throw error;
      }

      Object.assign(goal, {
        ...(payload.title !== undefined ? { title: payload.title } : {}),
        ...(payload.description !== undefined ? { description: payload.description } : {}),
        ...(payload.targetValue !== undefined ? { target_value: payload.targetValue } : {}),
        ...(payload.currentValue !== undefined ? { current_value: payload.currentValue } : {}),
        ...(payload.unit !== undefined ? { unit: payload.unit } : {}),
        ...(payload.cadence !== undefined ? { cadence: payload.cadence } : {}),
        ...(payload.dueDate !== undefined ? { due_date: payload.dueDate } : {}),
        updated_at: new Date().toISOString(),
      });
      goal.current_value = Math.max(0, Math.min(goal.current_value, goal.target_value));
      goal.status = payload.status || (goal.current_value >= goal.target_value ? 'completed' : 'active');
      return normalizeGoal(goal);
    },
    async deleteGoal(userId, goalId) {
      const goal = goals.find((item) => item.id === goalId && item.user_id === userId);
      if (!goal) {
        const error = new Error('Goal not found.');
        error.status = 404;
        throw error;
      }
      goals.splice(goals.indexOf(goal), 1);
      return { deleted: true };
    },
    async upsertSkillProgress(userId, payload) {
      const now = new Date().toISOString();
      let entry = skillProgress.find(
        (item) => item.user_id === userId && item.skill_name.toLowerCase() === payload.skillName.toLowerCase(),
      );

      if (!entry) {
        entry = {
          id: `sp_${nanoid(10)}`,
          user_id: userId,
          skill_name: payload.skillName,
          progress_percent: payload.progressPercent,
          current_level: payload.currentLevel || '',
          target_level: payload.targetLevel || '',
          notes: payload.notes || '',
          created_at: now,
          updated_at: now,
        };
        skillProgress.unshift(entry);
      } else {
        Object.assign(entry, {
          skill_name: payload.skillName,
          progress_percent: payload.progressPercent,
          current_level: payload.currentLevel || '',
          target_level: payload.targetLevel || '',
          notes: payload.notes || '',
          updated_at: now,
        });
      }

      return entry;
    },
    async getCircleAnalytics(circleId, userId) {
      const circle = circles.find((item) => item.id === circleId);
      if (!circle) return null;
      if (circle.is_private && !getMembership(circleMembers, circleId, userId)) {
        return null;
      }

      const circlePosts = posts.filter((post) => post.circle_id === circleId && !post.deleted_at);
      const memberIds = circleMembers.filter((member) => member.circle_id === circleId).map((member) => member.user_id);
      const activeWindow = Date.now() - (7 * 24 * 60 * 60 * 1000);

      return {
        circle: serializeCircle(circle, circleMembers, userId),
        totals: {
          posts: circlePosts.length,
          activeMembers: new Set(
            circlePosts
              .filter((post) => new Date(post.created_at).getTime() >= activeWindow)
              .map((post) => post.user_id),
          ).size,
          messages: messages.filter((message) => message.circle_id === circleId).length,
        },
        weeklyActivity: buildWeeklyActivity(circlePosts),
        leaderboard: buildLeaderboard(circleId, circleMembers, posts, streaks, users),
        premium: {
          enabled: Boolean(circle.is_premium),
          badge: circle.premium_badge || 'core',
        },
        members: memberIds.length,
      };
    },
  };
}
