import { nanoid } from 'nanoid';
import {
  demoCircleMembers,
  demoCircles,
  demoComments,
  demoLikes,
  demoPosts,
  demoUsers,
} from '../services/seedData.js';

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

export function createMemoryRepository() {
  const users = structuredClone(demoUsers);
  const posts = structuredClone(demoPosts);
  const comments = structuredClone(demoComments);
  const likes = structuredClone(demoLikes);
  const circles = structuredClone(demoCircles);
  const circleMembers = structuredClone(demoCircleMembers);

  return {
    async findUserById(id) {
      return publicUser(users.find((user) => user.id === id));
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
    async toggleLike(postId, userId) {
      const existing = likes.find((like) => like.post_id === postId && like.user_id === userId);
      if (existing) {
        likes.splice(likes.indexOf(existing), 1);
        return { liked: false };
      }

      likes.push({
        id: `l_${nanoid(10)}`,
        user_id: userId,
        post_id: postId,
        created_at: new Date().toISOString(),
      });
      return { liked: true };
    },
    async addComment(postId, userId, content) {
      const comment = {
        id: `co_${nanoid(10)}`,
        user_id: userId,
        post_id: postId,
        content,
        created_at: new Date().toISOString(),
      };
      comments.push(comment);
      return {
        ...comment,
        author: publicUser(users.find((user) => user.id === userId)),
      };
    },
    async listCircles(userId) {
      return circles.map((circle) => ({
        ...circle,
        membersCount: circleMembers.filter((member) => member.circle_id === circle.id).length,
        joined: userId
          ? circleMembers.some((member) => member.circle_id === circle.id && member.user_id === userId)
          : false,
      }));
    },
    async createCircle({ name, description, userId }) {
      const circle = {
        id: `c_${nanoid(10)}`,
        name,
        description,
        created_by: userId,
        created_at: new Date().toISOString(),
      };
      circles.unshift(circle);
      circleMembers.push({
        id: `cm_${nanoid(10)}`,
        user_id: userId,
        circle_id: circle.id,
        created_at: new Date().toISOString(),
      });
      return {
        ...circle,
        membersCount: 1,
        joined: true,
      };
    },
    async joinCircle(circleId, userId) {
      const existing = circleMembers.find((member) => member.circle_id === circleId && member.user_id === userId);
      if (!existing) {
        circleMembers.push({
          id: `cm_${nanoid(10)}`,
          user_id: userId,
          circle_id: circleId,
          created_at: new Date().toISOString(),
        });
      }

      return { joined: true };
    },
    async getCircle(circleId, userId) {
      const circle = circles.find((item) => item.id === circleId);
      if (!circle) return null;

      return {
        ...circle,
        membersCount: circleMembers.filter((member) => member.circle_id === circle.id).length,
        joined: userId
          ? circleMembers.some((member) => member.circle_id === circle.id && member.user_id === userId)
          : false,
      };
    },
  };
}

