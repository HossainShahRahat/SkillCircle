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
  toasts: [],
  notifications: [],
  notificationsLoading: false,
  searchResults: { users: [], circles: [] },
  searchLoading: false,
  circleSearchResults: { posts: [], members: [] },
  circleSearchLoading: false,
  messages: [],
  messagesLoading: false,
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
  async toggleReaction(referenceType, referenceId, reactionType) {
    const data = await api.post('/reactions', { referenceType, referenceId, reactionType });
    get().applyReactionSummary(referenceType, referenceId, data.reactions);
    return data.reactions;
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
    const result = await api.post(`/circles/${circleId}/join`, {});
    set({
      circles: get().circles.map((circle) =>
        circle.id === circleId
          ? {
              ...circle,
              joined: true,
              myRole: circle.myRole || 'member',
              membersCount: circle.joined ? circle.membersCount : circle.membersCount + 1,
            }
          : circle,
      ),
      activeCircle: get().activeCircle?.id === circleId
        ? {
            ...get().activeCircle,
            joined: true,
            myRole: get().activeCircle.myRole || 'member',
            membersCount: get().activeCircle.joined
              ? get().activeCircle.membersCount
              : get().activeCircle.membersCount + 1,
          }
        : get().activeCircle,
    });
    get().showToast('Joined circle successfully.');
    return result;
  },
  async joinCircleByCode(code) {
    const data = await api.post('/circles/join-by-code', { code });
    const joinedCircle = data.circle;
    set({
      circles: get().circles.map((circle) => (
        circle.id === joinedCircle.id ? { ...circle, ...joinedCircle } : circle
      )),
      activeCircle: get().activeCircle?.id === joinedCircle.id ? joinedCircle : get().activeCircle,
    });
    get().showToast('Joined private circle successfully.');
    return joinedCircle;
  },
  async leaveCircle(circleId) {
    const activeCircle = get().activeCircle;
    const result = await api.delete(`/circles/${circleId}/leave`);
    set({
      circles: get().circles.map((circle) =>
        circle.id === circleId
          ? {
              ...circle,
              joined: false,
              myRole: null,
              membersCount: Math.max(0, circle.membersCount - 1),
            }
          : circle,
      ),
      activeCircle: get().activeCircle?.id === circleId
        ? {
            ...get().activeCircle,
            joined: false,
            myRole: null,
            membersCount: Math.max(0, get().activeCircle.membersCount - 1),
            invite_code: null,
          }
        : get().activeCircle,
      posts: activeCircle?.id === circleId && activeCircle?.is_private ? [] : get().posts,
    });
    get().showToast('Left circle successfully.');
    return result;
  },
  async loadNotifications() {
    set({ notificationsLoading: true });
    try {
      const data = await api.get('/notifications');
      set({ notifications: data.notifications, notificationsLoading: false });
    } catch (error) {
      set({ notificationsLoading: false, error: error.message });
    }
  },
  async markNotificationRead(notificationId) {
    const data = await api.patch(`/notifications/${notificationId}/read`, {});
    set({
      notifications: get().notifications.map((notification) =>
        notification.id === notificationId ? { ...notification, ...data.notification } : notification,
      ),
    });
    return data.notification;
  },
  async search(keyword) {
    if (!keyword.trim()) {
      set({ searchResults: { users: [], circles: [] }, searchLoading: false });
      return { users: [], circles: [] };
    }
    set({ searchLoading: true });
    try {
      const data = await api.get(`/search?q=${encodeURIComponent(keyword)}`);
      set({ searchResults: data, searchLoading: false });
      return data;
    } catch (error) {
      set({ searchLoading: false, error: error.message });
      return { users: [], circles: [] };
    }
  },
  clearSearch() {
    set({ searchResults: { users: [], circles: [] }, searchLoading: false });
  },
  async searchCircle(circleId, keyword) {
    if (!keyword.trim()) {
      set({ circleSearchResults: { posts: [], members: [] }, circleSearchLoading: false });
      return;
    }
    set({ circleSearchLoading: true });
    try {
      const data = await api.get(`/circles/${circleId}/search?q=${encodeURIComponent(keyword)}`);
      set({ circleSearchResults: data, circleSearchLoading: false });
    } catch (error) {
      set({ circleSearchLoading: false, error: error.message });
    }
  },
  clearCircleSearch() {
    set({ circleSearchResults: { posts: [], members: [] }, circleSearchLoading: false });
  },
  async loadMessages(circleId) {
    set({ messagesLoading: true });
    try {
      const data = await api.get(`/messages/${circleId}`);
      set({ messages: data.messages, messagesLoading: false });
    } catch (error) {
      set({ messagesLoading: false, error: error.message });
    }
  },
  async sendMessage(circleId, content) {
    const data = await api.post('/messages', { circleId, content });
    if (!get().messages.some((message) => message.id === data.message.id)) {
      set({ messages: [...get().messages, data.message] });
    }
    return data.message;
  },
  ingestRealtimePost(post) {
    const activeCircleId = get().activeCircle?.id || null;
    const shouldInclude = !activeCircleId || post.circle_id === activeCircleId;
    if (!shouldInclude) return;
    if (get().posts.some((item) => item.id === post.id)) return;
    set({ posts: [post, ...get().posts] });
  },
  ingestRealtimeComment(postId, comment) {
    set({
      posts: get().posts.map((post) => {
        if (post.id !== postId) return post;
        if (post.comments.some((item) => item.id === comment.id)) return post;
        return {
          ...post,
          comments: [...post.comments, comment],
          commentsCount: post.commentsCount + 1,
        };
      }),
    });
  },
  ingestRealtimePostUpdate(post) {
    set({
      posts: get().posts.map((item) => (item.id === post.id ? post : item)),
    });
  },
  ingestRealtimePostDeletion(postId) {
    set({ posts: get().posts.filter((item) => item.id !== postId) });
  },
  ingestRealtimeCommentUpdate(postId, comment) {
    set({
      posts: get().posts.map((post) => (
        post.id === postId
          ? {
              ...post,
              comments: post.comments.map((item) => (item.id === comment.id ? comment : item)),
            }
          : post
      )),
    });
  },
  ingestRealtimeCommentDeletion(postId, commentId) {
    set({
      posts: get().posts.map((post) => (
        post.id === postId
          ? {
              ...post,
              comments: post.comments.filter((item) => item.id !== commentId),
              commentsCount: Math.max(0, post.commentsCount - 1),
            }
          : post
      )),
    });
  },
  applyReactionSummary(referenceType, referenceId, reactions) {
    set({
      posts: get().posts.map((post) => {
        if (referenceType === 'post' && post.id === referenceId) {
          return { ...post, reactions };
        }
        if (referenceType === 'comment') {
          return {
            ...post,
            comments: post.comments.map((comment) => (
              comment.id === referenceId ? { ...comment, reactions } : comment
            )),
          };
        }
        return post;
      }),
    });
  },
  async updatePost(postId, content) {
    const data = await api.patch(`/posts/${postId}`, { content });
    get().ingestRealtimePostUpdate(data.post);
    get().showToast('Post updated.');
    return data.post;
  },
  async deletePost(postId) {
    await api.delete(`/posts/${postId}`);
    get().ingestRealtimePostDeletion(postId);
    get().showToast('Post deleted.');
  },
  async updateComment(commentId, content) {
    const data = await api.patch(`/posts/comments/${commentId}`, { content });
    get().posts.forEach((post) => {
      if (post.comments.some((comment) => comment.id === commentId)) {
        get().ingestRealtimeCommentUpdate(post.id, data.comment);
      }
    });
    get().showToast('Comment updated.');
    return data.comment;
  },
  async deleteComment(commentId) {
    const owningPost = get().posts.find((post) => post.comments.some((comment) => comment.id === commentId));
    await api.delete(`/posts/comments/${commentId}`);
    if (owningPost) {
      get().ingestRealtimeCommentDeletion(owningPost.id, commentId);
    }
    get().showToast('Comment deleted.');
  },
  async updateCircleMemberRole(circleId, userId, role) {
    const data = await api.patch(`/circles/${circleId}/members/${userId}/role`, { role });
    set({
      activeCircle: get().activeCircle
        ? {
            ...get().activeCircle,
            members: (get().activeCircle.members || []).map((member) => (
              member.id === userId ? { ...member, ...data.member } : member
            )),
          }
        : get().activeCircle,
    });
    get().showToast('Member role updated.');
    return data.member;
  },
  ingestRealtimeNotification(notification) {
    if (!notification) return;
    if (get().notifications.some((item) => item.id === notification.id)) return;
    set({ notifications: [notification, ...get().notifications] });
    get().showToast('New activity just came in.');
  },
  ingestRealtimeMessage(message) {
    if (!message) return;
    if (get().messages.some((item) => item.id === message.id)) return;
    set({ messages: [...get().messages, message] });
  },
  clearMessages() {
    set({ messages: [], messagesLoading: false });
  },
  setModalOpen(modalOpen) {
    set({ modalOpen });
  },
  showToast(message, type = 'success') {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    set({ toasts: [...get().toasts, { id, message, type }] });
    setTimeout(() => {
      get().dismissToast(id);
    }, 3200);
  },
  dismissToast(id) {
    set({ toasts: get().toasts.filter((toast) => toast.id !== id) });
  },
}));
