import { create } from 'zustand';
import { api } from '../services/api.js';
import { getSocket } from '../services/socket.js';
import { clearQueuedMessages, enqueueMessage, getQueuedMessages, removeQueuedMessage } from '../services/chatQueue.js';

const typingThrottleState = new Map();
const typingStopTimers = new Map();

function buildOptimisticMessage(scope, targetId, user, payload) {
  const createdAt = new Date().toISOString();
  return {
    id: payload.client_id,
    client_id: payload.client_id,
    created_at: createdAt,
    content: payload.content || '',
    media_url: payload.media?.url || payload.media?.dataUrl || '',
    media_type: payload.media?.type || '',
    media_name: payload.media?.name || '',
    media_size: payload.media?.size || 0,
    author: user,
    reactions: [],
    status: 'sent',
    status_summary: { recipients: 0, deliveredCount: 0, readCount: 0, myStatus: null },
    pending: true,
    ...(scope === 'circle'
      ? { circle_id: targetId, user_id: user?.id }
      : { chat_id: targetId, sender_id: user?.id }),
  };
}

function mergeMessage(existing, incoming) {
  if (!incoming) return existing;
  return {
    ...existing,
    ...incoming,
    pending: false,
  };
}

function replacePendingMessage(messages, incoming) {
  if (!incoming?.client_id) return messages;
  return messages.map((message) => (
    message.client_id === incoming.client_id ? mergeMessage(message, incoming) : message
  ));
}

export const useAppStore = create((set, get) => ({
  posts: [],
  circles: [],
  activeCircle: null,
  dashboard: {
    feed: [],
    highlights: [],
    streak: null,
    insights: null,
  },
  userAnalytics: null,
  circleAnalytics: null,
  settings: null,
  loadingFeed: false,
  loadingCircles: false,
  loadingDashboard: false,
  loadingAnalytics: false,
  loadingSettings: false,
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
  directChats: [],
  activeDirectChatId: null,
  directMessagesByChat: {},
  directMessagesLoading: false,
  typingState: {
    circle: {},
    direct: {},
  },
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
  async loadDashboard() {
    set({ loadingDashboard: true, error: '' });
    try {
      const data = await api.get('/dashboard');
      set({
        dashboard: data,
        posts: data.feed || [],
        loadingDashboard: false,
      });
    } catch (error) {
      set({ error: error.message, loadingDashboard: false });
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
      const currentDashboard = get().dashboard;
      set({
        posts: [data.post, ...get().posts],
        dashboard: {
          ...currentDashboard,
          feed: [data.post, ...(currentDashboard.feed || [])],
          streak: data.streak || currentDashboard.streak,
          insights: data.insights || currentDashboard.insights,
        },
        submitting: false,
        modalOpen: false,
      });
    } catch (error) {
      set({ error: error.message, submitting: false });
      throw error;
    }
  },
  async loadSettings() {
    set({ loadingSettings: true, error: '' });
    try {
      const data = await api.get('/settings');
      set({ settings: data.settings, loadingSettings: false });
      return data.settings;
    } catch (error) {
      set({ error: error.message, loadingSettings: false });
      throw error;
    }
  },
  async updateSettings(payload) {
    set({ loadingSettings: true, error: '' });
    try {
      const data = await api.put('/settings', payload);
      set({ settings: data.settings, loadingSettings: false });
      get().showToast('Settings updated.');
      return data.settings;
    } catch (error) {
      set({ error: error.message, loadingSettings: false });
      throw error;
    }
  },
  async loadUserAnalytics() {
    set({ loadingAnalytics: true, error: '' });
    try {
      const data = await api.get('/analytics/user');
      set({ userAnalytics: data, loadingAnalytics: false });
      return data;
    } catch (error) {
      set({ error: error.message, loadingAnalytics: false });
      throw error;
    }
  },
  async loadCircleAnalytics(circleId) {
    set({ loadingAnalytics: true, error: '' });
    try {
      const data = await api.get(`/analytics/circles/${circleId}`);
      set({ circleAnalytics: data, loadingAnalytics: false });
      return data;
    } catch (error) {
      set({ error: error.message, loadingAnalytics: false });
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
      const data = await api.get(`/messages/circles/${circleId}`);
      set({ messages: data.messages, messagesLoading: false });
    } catch (error) {
      set({ messagesLoading: false, error: error.message });
    }
  },
  async uploadChatMedia(attachment) {
    if (!attachment) return null;
    const data = await api.post('/messages/media', {
      fileName: attachment.name,
      contentType: attachment.type,
      size: attachment.size,
      dataUrl: attachment.dataUrl,
    });
    return data.media;
  },
  async sendMessage(circleId, { content, attachment }, currentUser) {
    const clientId = `offline-circle-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    let media = null;
    if (attachment) {
      media = navigator.onLine ? await get().uploadChatMedia(attachment) : attachment;
    }

    if (!navigator.onLine) {
      const queued = {
        scope: 'circle',
        targetId: circleId,
        content,
        media,
        client_id: clientId,
      };
      enqueueMessage(queued);
      set({ messages: [...get().messages, buildOptimisticMessage('circle', circleId, currentUser, queued)] });
      return queued;
    }

    const data = await api.post(`/messages/circles/${circleId}`, { content, media, client_id: clientId });
    const currentMessages = replacePendingMessage(get().messages, data.message);
    if (!currentMessages.some((message) => message.id === data.message.id)) {
      currentMessages.push(data.message);
    }
    set({ messages: currentMessages });
    return data.message;
  },
  async markCircleMessages(circleId, status = 'read') {
    const data = await api.patch(`/messages/circles/${circleId}/status`, { status });
    const updates = new Map((data.messages || []).map((message) => [message.id, message]));
    set({
      messages: get().messages.map((message) => updates.get(message.id) || message),
    });
    return data.messages;
  },
  async reactToCircleMessage(messageId, emoji) {
    const data = await api.post(`/messages/circle-messages/${messageId}/reactions`, { emoji });
    get().ingestRealtimeMessageReaction(data.message);
    return data.message;
  },
  async loadDirectChats() {
    const data = await api.get('/messages/direct-chats');
    set({
      directChats: data.chats,
      activeDirectChatId: get().activeDirectChatId || data.chats[0]?.id || null,
    });
    return data.chats;
  },
  setActiveDirectChat(chatId) {
    set({ activeDirectChatId: chatId });
  },
  async createDirectChat(participantId) {
    const data = await api.post('/messages/direct-chats', { participantId });
    set({
      directChats: [data.chat, ...get().directChats.filter((chat) => chat.id !== data.chat.id)],
      activeDirectChatId: data.chat.id,
    });
    return data.chat;
  },
  async loadDirectMessages(chatId) {
    set({ directMessagesLoading: true });
    try {
      const data = await api.get(`/messages/direct-chats/${chatId}/messages`);
      set({
        directMessagesByChat: {
          ...get().directMessagesByChat,
          [chatId]: data.messages,
        },
        directMessagesLoading: false,
      });
      return data.messages;
    } catch (error) {
      set({ directMessagesLoading: false, error: error.message });
      throw error;
    }
  },
  async sendDirectMessage(chatId, { content, attachment }, currentUser) {
    const clientId = `offline-direct-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    let media = null;
    if (attachment) {
      media = navigator.onLine ? await get().uploadChatMedia(attachment) : attachment;
    }

    if (!navigator.onLine) {
      const queued = {
        scope: 'direct',
        targetId: chatId,
        content,
        media,
        client_id: clientId,
      };
      enqueueMessage(queued);
      const optimistic = buildOptimisticMessage('direct', chatId, currentUser, queued);
      set({
        directMessagesByChat: {
          ...get().directMessagesByChat,
          [chatId]: [...(get().directMessagesByChat[chatId] || []), optimistic],
        },
        directChats: [
          ...(get().directChats.filter((chat) => chat.id === chatId).map((chat) => ({ ...chat, last_message: optimistic }))),
          ...get().directChats.filter((chat) => chat.id !== chatId),
        ],
      });
      return queued;
    }

    const data = await api.post(`/messages/direct-chats/${chatId}/messages`, { content, media, client_id: clientId });
    const nextMessages = replacePendingMessage(get().directMessagesByChat[chatId] || [], data.message);
    if (!nextMessages.some((message) => message.id === data.message.id)) {
      nextMessages.push(data.message);
    }
    set({
      directMessagesByChat: {
        ...get().directMessagesByChat,
        [chatId]: nextMessages,
      },
      directChats: [
        ...(get().directChats.filter((chat) => chat.id === chatId).map((chat) => ({ ...chat, last_message: data.message }))),
        ...get().directChats.filter((chat) => chat.id !== chatId),
      ],
    });
    return data.message;
  },
  async markDirectMessages(chatId, status = 'read') {
    const data = await api.patch(`/messages/direct-chats/${chatId}/status`, { status });
    const updates = new Map((data.messages || []).map((message) => [message.id, message]));
    set({
      directMessagesByChat: {
        ...get().directMessagesByChat,
        [chatId]: (get().directMessagesByChat[chatId] || []).map((message) => updates.get(message.id) || message),
      },
      directChats: get().directChats.map((chat) => (
        chat.id === chatId ? { ...chat, unread_count: 0 } : chat
      )),
    });
    return data.messages;
  },
  async reactToDirectMessage(messageId, emoji) {
    const data = await api.post(`/messages/direct-messages/${messageId}/reactions`, { emoji });
    get().ingestRealtimeMessageReaction(data.message);
    return data.message;
  },
  async flushOfflineMessages(currentUser) {
    if (!navigator.onLine) return;
    const queue = getQueuedMessages();
    if (!queue.length) return;

    for (const item of queue) {
      try {
        const payload = { content: item.content, media: item.media, client_id: item.client_id };
        if (item.scope === 'circle') {
          const data = await api.post(`/messages/circles/${item.targetId}`, payload);
          set({ messages: replacePendingMessage(get().messages, data.message) });
        } else {
          const data = await api.post(`/messages/direct-chats/${item.targetId}/messages`, payload);
          set({
            directMessagesByChat: {
              ...get().directMessagesByChat,
              [item.targetId]: replacePendingMessage(get().directMessagesByChat[item.targetId] || [], data.message),
            },
          });
        }
        removeQueuedMessage(item.client_id);
      } catch (_error) {
        return;
      }
    }

    clearQueuedMessages();
    if (currentUser) {
      get().showToast('Queued messages synced.');
    }
  },
  ingestRealtimePost(post) {
    const activeCircleId = get().activeCircle?.id || null;
    const shouldInclude = !activeCircleId || post.circle_id === activeCircleId;
    if (!shouldInclude) return;
    if (get().posts.some((item) => item.id === post.id)) return;
    set({
      posts: [post, ...get().posts],
      dashboard: {
        ...get().dashboard,
        feed: [post, ...(get().dashboard.feed || []).filter((item) => item.id !== post.id)],
      },
    });
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
      dashboard: {
        ...get().dashboard,
        feed: (get().dashboard.feed || []).map((item) => (item.id === post.id ? post : item)),
      },
    });
  },
  ingestRealtimePostDeletion(postId) {
    set({
      posts: get().posts.filter((item) => item.id !== postId),
      dashboard: {
        ...get().dashboard,
        feed: (get().dashboard.feed || []).filter((item) => item.id !== postId),
      },
    });
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
  ingestRealtimeMessage(event) {
    const { scope, targetId, message } = event || {};
    if (!message) return;

    if (scope === 'direct') {
      const current = get().directMessagesByChat[targetId] || [];
      const replaced = replacePendingMessage(current, message);
      const nextMessages = replaced.some((item) => item.id === message.id)
        ? replaced
        : [...replaced, message];
      const updatedChats = get().directChats.map((chat) => (
        chat.id === targetId
          ? {
              ...chat,
              last_message: message,
              unread_count: chat.id === get().activeDirectChatId ? 0 : Math.max(1, chat.unread_count || 0),
            }
          : chat
      ));
      const promoted = updatedChats.find((chat) => chat.id === targetId);
      set({
        directMessagesByChat: {
          ...get().directMessagesByChat,
          [targetId]: nextMessages,
        },
        directChats: promoted
          ? [promoted, ...updatedChats.filter((chat) => chat.id !== targetId)]
          : updatedChats,
      });
      return;
    }

    const replaced = replacePendingMessage(get().messages, message);
    const nextMessages = replaced.some((item) => item.id === message.id) ? replaced : [...replaced, message];
    set({ messages: nextMessages });
  },
  ingestRealtimeMessageStatus(event) {
    const { scope, targetId, message } = event || {};
    if (!message) return;

    if (scope === 'direct') {
      set({
        directMessagesByChat: {
          ...get().directMessagesByChat,
          [targetId]: (get().directMessagesByChat[targetId] || []).map((item) => (
            item.id === message.id ? { ...item, ...message } : item
          )),
        },
      });
      return;
    }

    set({
      messages: get().messages.map((item) => (item.id === message.id ? { ...item, ...message } : item)),
    });
  },
  ingestRealtimeMessageReaction(message) {
    if (!message) return;
    if (message.chat_id) {
      set({
        directMessagesByChat: {
          ...get().directMessagesByChat,
          [message.chat_id]: (get().directMessagesByChat[message.chat_id] || []).map((item) => (
            item.id === message.id ? { ...item, ...message } : item
          )),
        },
      });
      return;
    }

    set({
      messages: get().messages.map((item) => (item.id === message.id ? { ...item, ...message } : item)),
    });
  },
  ingestTyping({ scope, targetId, user, isTyping }) {
    if (!scope || !targetId || !user) return;
    const next = (get().typingState[scope]?.[targetId] || []).filter((entry) => entry.user.id !== user.id);
    const scopedTyping = isTyping ? [...next, { user, updatedAt: Date.now() }] : next;
    set({
      typingState: {
        ...get().typingState,
        [scope]: {
          ...get().typingState[scope],
          [targetId]: scopedTyping,
        },
      },
    });
    if (isTyping) {
      setTimeout(() => {
        const latest = (get().typingState[scope]?.[targetId] || []).filter((entry) => entry.user.id !== user.id);
        set({
          typingState: {
            ...get().typingState,
            [scope]: {
              ...get().typingState[scope],
              [targetId]: latest,
            },
          },
        });
      }, 2200);
    }
  },
  setTyping(scope, targetId, isTyping) {
    const token = localStorage.getItem('skillcircle-token');
    const socket = getSocket(token);
    if (!socket || !scope || !targetId) return;

    const key = `${scope}:${targetId}`;
    const now = Date.now();
    const lastSent = typingThrottleState.get(key) || 0;

    if (!isTyping) {
      if (typingStopTimers.has(key)) {
        clearTimeout(typingStopTimers.get(key));
        typingStopTimers.delete(key);
      }
      socket.emit('typing', { scope, targetId, isTyping: false });
      typingThrottleState.delete(key);
      return;
    }

    if (now - lastSent >= 900) {
      socket.emit('typing', { scope, targetId, isTyping: true });
      typingThrottleState.set(key, now);
    }

    if (typingStopTimers.has(key)) {
      clearTimeout(typingStopTimers.get(key));
    }
    typingStopTimers.set(key, setTimeout(() => {
      socket.emit('typing', { scope, targetId, isTyping: false });
      typingStopTimers.delete(key);
      typingThrottleState.delete(key);
    }, 1400));
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
