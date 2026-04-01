import { nanoid } from 'nanoid';
import {
  demoCircleMembers,
  demoCircles,
  demoComments,
  demoLikes,
  demoMessages,
  demoNotifications,
  demoPosts,
  demoUsers,
} from '../services/seedData.js';
import { buildMentionPayload } from '../services/mentionService.js';

function publicUser(user) {
  if (!user) return null;
  const { password_hash, ...rest } = user;
  return rest;
}

function enrichPost(post, users, circles, comments, likes, currentUserId) {
  const author = publicUser(users.find((user) => user.id === post.user_id));
  const circle = circles.find((item) => item.id === post.circle_id) || null;
  const postComments = comments
    .filter((comment) => comment.post_id === post.id)
    .map((comment) => ({
      ...comment,
      author: publicUser(users.find((user) => user.id === comment.user_id)),
      mentionedUsers: buildMentionPayload(
        users.filter((user) => (comment.mentioned_users || []).includes(user.id)),
      ),
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

function profileStats(userId, posts, likes, circleMembers) {
  const userPosts = posts.filter((post) => post.user_id === userId);
  return {
    totalPosts: userPosts.length,
    totalLikesReceived: likes.filter((like) => userPosts.some((post) => post.id === like.post_id)).length,
    circlesJoined: circleMembers.filter((member) => member.user_id === userId).length,
  };
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
  const circles = structuredClone(demoCircles);
  const circleMembers = structuredClone(demoCircleMembers);

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
        created_at: new Date().toISOString(),
      };
      users.unshift(user);
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
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .map((post) => enrichPost(post, users, circles, comments, likes, currentUserId));
    },
    async createPost({ userId, content, imageUrl, circleId }) {
      const post = {
        id: `p_${nanoid(10)}`,
        user_id: userId,
        circle_id: circleId || null,
        content,
        image_url: imageUrl || '',
        created_at: new Date().toISOString(),
      };
      posts.unshift(post);
      return enrichPost(post, users, circles, comments, likes, userId);
    },
    async getPostById(postId, currentUserId) {
      const post = posts.find((item) => item.id === postId);
      if (!post) return null;
      return enrichPost(post, users, circles, comments, likes, currentUserId);
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
        created_at: new Date().toISOString(),
      };
      comments.push(comment);
      return {
        ...comment,
        author: publicUser(users.find((user) => user.id === userId)),
        mentionedUsers: buildMentionPayload(
          users.filter((user) => mentionedUserIds.includes(user.id)),
        ),
        notificationTargetUserId: post && post.user_id !== userId ? post.user_id : null,
      };
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
  };
}
