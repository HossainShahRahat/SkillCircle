import { create } from 'zustand';
import { api } from '../services/api.js';

export const useAppStore = create((set, get) => ({
  posts: [],
  circles: [],
  activeCircle: null,
  loadingFeed: false,
  loadingCircles: false,
  submitting: false,
  modalOpen: false,
  error: '',
  async loadFeed(circleId = null) {
    set({ loadingFeed: true, error: '' });
    try {
      const query = circleId ? `?circleId=${circleId}` : '';
      const data = await api.get(`/posts${query}`);
      set({ posts: data.posts, loadingFeed: false });
    } catch (error) {
      set({ error: error.message, loadingFeed: false });
    }
  },
  async loadCircles() {
    set({ loadingCircles: true });
    try {
      const data = await api.get('/circles');
      set({ circles: data.circles, loadingCircles: false });
    } catch (error) {
      set({ error: error.message, loadingCircles: false });
    }
  },
  async loadCircle(circleId) {
    set({ activeCircle: null });
    try {
      const [circleData, postsData] = await Promise.all([
        api.get(`/circles/${circleId}`),
        api.get(`/posts?circleId=${circleId}`),
      ]);
      set({ activeCircle: circleData.circle, posts: postsData.posts });
    } catch (error) {
      set({ error: error.message });
    }
  },
  async createPost(payload) {
    set({ submitting: true, error: '' });
    try {
      const data = await api.post('/posts', payload);
      set({ posts: [data.post, ...get().posts], submitting: false, modalOpen: false });
    } catch (error) {
      set({ error: error.message, submitting: false });
      throw error;
    }
  },
  async likePost(postId) {
    await api.post(`/posts/${postId}/like`, {});
    const posts = get().posts.map((post) =>
      post.id === postId
        ? {
            ...post,
            likedByMe: !post.likedByMe,
            likesCount: post.likedByMe ? post.likesCount - 1 : post.likesCount + 1,
          }
        : post,
    );
    set({ posts });
  },
  async commentOnPost(postId, content, author) {
    const data = await api.post(`/posts/${postId}/comments`, { content });
    const posts = get().posts.map((post) =>
      post.id === postId
        ? {
            ...post,
            comments: [...post.comments, { ...data.comment, author: data.comment.author || author }],
            commentsCount: post.commentsCount + 1,
          }
        : post,
    );
    set({ posts });
  },
  async createCircle(payload) {
    set({ submitting: true });
    try {
      const data = await api.post('/circles', payload);
      set({
        circles: [data.circle, ...get().circles],
        submitting: false,
      });
      return data.circle;
    } catch (error) {
      set({ error: error.message, submitting: false });
      throw error;
    }
  },
  async joinCircle(circleId) {
    await api.post(`/circles/${circleId}/join`, {});
    set({
      circles: get().circles.map((circle) =>
        circle.id === circleId
          ? { ...circle, joined: true, membersCount: circle.membersCount + 1 }
          : circle,
      ),
      activeCircle: get().activeCircle?.id === circleId
        ? {
            ...get().activeCircle,
            joined: true,
            membersCount: get().activeCircle.membersCount + 1,
          }
        : get().activeCircle,
    });
  },
  setModalOpen(modalOpen) {
    set({ modalOpen });
  },
}));

