import { nanoid } from 'nanoid';
import { createClient } from '@supabase/supabase-js';
import { config, useSupabaseRepository } from '../config.js';
import { repository } from './repository.js';
import { demoMessages } from '../services/seedData.js';

function mapUser(user) {
  if (!user) return null;
  const { password_hash, ...rest } = user;
  return rest;
}

function createError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function summarizeMessageReactions(reactions = [], userId) {
  return reactions
    .map((reaction) => ({
      emoji: reaction.emoji,
      count: (reaction.user_ids || []).length,
      reactedByMe: Boolean(userId && (reaction.user_ids || []).includes(userId)),
    }))
    .filter((reaction) => reaction.count > 0)
    .sort((left, right) => right.count - left.count || left.emoji.localeCompare(right.emoji));
}

function normalizeMessageStatuses(messageStatuses = []) {
  return messageStatuses.map((status) => ({
    user_id: status.user_id,
    status: status.status || 'sent',
    delivered_at: status.delivered_at || null,
    read_at: status.read_at || null,
  }));
}

function summarizeMessageStatuses(messageStatuses = [], currentUserId) {
  const normalized = normalizeMessageStatuses(messageStatuses);
  const deliveredCount = normalized.filter((status) => ['delivered', 'read'].includes(status.status)).length;
  const readCount = normalized.filter((status) => status.status === 'read').length;
  return {
    recipients: normalized.length,
    deliveredCount,
    readCount,
    myStatus: currentUserId
      ? normalized.find((status) => status.user_id === currentUserId)?.status || null
      : null,
  };
}

function toggleReactionSet(reactions = [], userId, emoji) {
  const next = reactions.map((reaction) => ({
    emoji: reaction.emoji,
    user_ids: [...(reaction.user_ids || [])],
  }));
  const target = next.find((reaction) => reaction.emoji === emoji);

  if (!target) {
    next.push({ emoji, user_ids: [userId] });
    return next;
  }

  if (target.user_ids.includes(userId)) {
    target.user_ids = target.user_ids.filter((id) => id !== userId);
  } else {
    target.user_ids.push(userId);
  }

  return next.filter((reaction) => reaction.user_ids.length);
}

async function hydrateAuthors(messages, key) {
  const authorIds = Array.from(new Set(messages.map((message) => message[key]).filter(Boolean)));
  const authors = await Promise.all(authorIds.map((authorId) => repository.findUserById(authorId)));
  const authorMap = new Map(authors.filter(Boolean).map((author) => [author.id, author]));

  return messages.map((message) => ({
    ...message,
    author: authorMap.get(message[key]) || null,
    reactions: summarizeMessageReactions(message.reactions, null),
  }));
}

async function ensureCircleAccess(circleId, userId) {
  const circle = await repository.getCircle(circleId, userId);
  if (!circle) {
    throw createError('Circle not found.', 404);
  }
  if (!circle.joined) {
    throw createError('Join the circle before accessing chat.', 403);
  }
  return circle;
}

function normalizeChatPair(firstUserId, secondUserId) {
  return [firstUserId, secondUserId].sort((left, right) => left.localeCompare(right));
}

async function ensureDirectChatParticipant(chat, userId) {
  if (!chat || ![chat.user1_id, chat.user2_id].includes(userId)) {
    throw createError('Direct chat not found.', 404);
  }
}

class MemoryChatRepository {
  constructor() {
    this.circleMessages = structuredClone(demoMessages).map((message) => ({
      ...message,
      media_url: '',
      media_type: '',
      media_name: '',
      media_size: 0,
      reactions: [],
      message_status: [],
      client_id: null,
    }));
    this.directChats = [];
    this.directMessages = [];
  }

  async serializeCircleMessage(message, currentUserId) {
    const author = await repository.findUserById(message.user_id);
    return {
      ...message,
      author,
      reactions: summarizeMessageReactions(message.reactions, currentUserId),
      status_summary: summarizeMessageStatuses(message.message_status, currentUserId),
    };
  }

  async serializeDirectMessage(message, currentUserId) {
    const author = await repository.findUserById(message.sender_id);
    return {
      ...message,
      author,
      reactions: summarizeMessageReactions(message.reactions, currentUserId),
      status_summary: summarizeMessageStatuses(message.message_status, currentUserId),
    };
  }

  async listCircleMessages(circleId, userId) {
    await ensureCircleAccess(circleId, userId);
    const messages = this.circleMessages
      .filter((message) => message.circle_id === circleId)
      .sort((left, right) => new Date(left.created_at) - new Date(right.created_at));
    return Promise.all(messages.map((message) => this.serializeCircleMessage(message, userId)));
  }

  async createCircleMessage({ circleId, userId, content, media = null, clientId = null }) {
    const circle = await ensureCircleAccess(circleId, userId);
    const members = circle.members || [];
    const recipients = members
      .filter((member) => member.id !== userId)
      .map((member) => ({
        user_id: member.id,
        status: 'sent',
        delivered_at: null,
        read_at: null,
      }));

    const message = {
      id: `m_${nanoid(10)}`,
      circle_id: circleId,
      user_id: userId,
      content: content || '',
      media_url: media?.url || '',
      media_type: media?.type || '',
      media_name: media?.name || '',
      media_size: media?.size || 0,
      reactions: [],
      message_status: recipients,
      created_at: new Date().toISOString(),
      client_id: clientId,
    };

    this.circleMessages.push(message);
    return this.serializeCircleMessage(message, userId);
  }

  async updateCircleMessageStatus(circleId, userId, status) {
    await ensureCircleAccess(circleId, userId);
    const updatedAt = new Date().toISOString();
    const updated = [];

    for (const message of this.circleMessages) {
      if (message.circle_id !== circleId || message.user_id === userId) continue;
      const existing = message.message_status.find((entry) => entry.user_id === userId);
      if (!existing) continue;
      const nextStatus = status === 'read' || existing.status === 'read' ? 'read' : 'delivered';
      if (existing.status === nextStatus) continue;
      existing.status = nextStatus;
      if (!existing.delivered_at) {
        existing.delivered_at = updatedAt;
      }
      if (nextStatus === 'read') {
        existing.read_at = updatedAt;
      }
      updated.push(await this.serializeCircleMessage(message, userId));
    }

    return updated;
  }

  async toggleCircleMessageReaction(messageId, userId, emoji) {
    const message = this.circleMessages.find((entry) => entry.id === messageId);
    if (!message) {
      throw createError('Message not found.', 404);
    }
    await ensureCircleAccess(message.circle_id, userId);
    message.reactions = toggleReactionSet(message.reactions, userId, emoji);
    return this.serializeCircleMessage(message, userId);
  }

  async searchCircleMessages(circleId, userId, query) {
    const messages = await this.listCircleMessages(circleId, userId);
    const normalized = query.toLowerCase();
    return messages.filter((message) => message.content.toLowerCase().includes(normalized));
  }

  async listDirectChats(userId) {
    const chats = this.directChats
      .filter((chat) => chat.user1_id === userId || chat.user2_id === userId)
      .sort((left, right) => new Date(right.updated_at || right.created_at) - new Date(left.updated_at || left.created_at));

    return Promise.all(chats.map(async (chat) => {
      const participantId = chat.user1_id === userId ? chat.user2_id : chat.user1_id;
      const participant = await repository.findUserById(participantId);
      const chatMessages = this.directMessages
        .filter((message) => message.chat_id === chat.id)
        .sort((left, right) => new Date(right.created_at) - new Date(left.created_at));
      const lastMessage = chatMessages[0] ? await this.serializeDirectMessage(chatMessages[0], userId) : null;
      const unreadCount = chatMessages.filter((message) => message.sender_id !== userId)
        .filter((message) => message.message_status.some((entry) => entry.user_id === userId && entry.status !== 'read'))
        .length;

      return {
        ...chat,
        participant,
        last_message: lastMessage,
        unread_count: unreadCount,
      };
    }));
  }

  async getOrCreateDirectChat(userId, participantId) {
    if (!participantId || participantId === userId) {
      throw createError('Select another user to start a chat.');
    }
    const participant = await repository.findUserById(participantId);
    if (!participant) {
      throw createError('User not found.', 404);
    }

    const [user1Id, user2Id] = normalizeChatPair(userId, participantId);
    let chat = this.directChats.find((entry) => entry.user1_id === user1Id && entry.user2_id === user2Id);
    if (!chat) {
      chat = {
        id: `dc_${nanoid(10)}`,
        user1_id: user1Id,
        user2_id: user2Id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.directChats.unshift(chat);
    }

    return {
      ...chat,
      participant: user1Id === userId ? await repository.findUserById(user2Id) : await repository.findUserById(user1Id),
    };
  }

  async listDirectMessages(chatId, userId) {
    const chat = this.directChats.find((entry) => entry.id === chatId);
    await ensureDirectChatParticipant(chat, userId);

    const messages = this.directMessages
      .filter((message) => message.chat_id === chatId)
      .sort((left, right) => new Date(left.created_at) - new Date(right.created_at));
    return Promise.all(messages.map((message) => this.serializeDirectMessage(message, userId)));
  }

  async createDirectMessage({ chatId, senderId, content, media = null, clientId = null }) {
    const chat = this.directChats.find((entry) => entry.id === chatId);
    await ensureDirectChatParticipant(chat, senderId);
    const recipientId = chat.user1_id === senderId ? chat.user2_id : chat.user1_id;

    const message = {
      id: `dm_${nanoid(10)}`,
      chat_id: chatId,
      sender_id: senderId,
      content: content || '',
      media_url: media?.url || '',
      media_type: media?.type || '',
      media_name: media?.name || '',
      media_size: media?.size || 0,
      status: 'sent',
      reactions: [],
      message_status: [{
        user_id: recipientId,
        status: 'sent',
        delivered_at: null,
        read_at: null,
      }],
      created_at: new Date().toISOString(),
      client_id: clientId,
    };

    chat.updated_at = new Date().toISOString();
    this.directMessages.push(message);
    return this.serializeDirectMessage(message, senderId);
  }

  async updateDirectMessageStatus(chatId, userId, status) {
    const chat = this.directChats.find((entry) => entry.id === chatId);
    await ensureDirectChatParticipant(chat, userId);
    const updatedAt = new Date().toISOString();
    const updated = [];

    for (const message of this.directMessages) {
      if (message.chat_id !== chatId || message.sender_id === userId) continue;
      const entry = message.message_status.find((item) => item.user_id === userId);
      if (!entry) continue;
      const nextStatus = status === 'read' || entry.status === 'read' ? 'read' : 'delivered';
      if (entry.status === nextStatus) continue;
      entry.status = nextStatus;
      entry.delivered_at ||= updatedAt;
      if (nextStatus === 'read') {
        entry.read_at = updatedAt;
      }
      message.status = nextStatus;
      updated.push(await this.serializeDirectMessage(message, userId));
    }

    return updated;
  }

  async toggleDirectMessageReaction(messageId, userId, emoji) {
    const message = this.directMessages.find((entry) => entry.id === messageId);
    if (!message) {
      throw createError('Message not found.', 404);
    }
    const chat = this.directChats.find((entry) => entry.id === message.chat_id);
    await ensureDirectChatParticipant(chat, userId);
    message.reactions = toggleReactionSet(message.reactions, userId, emoji);
    return this.serializeDirectMessage(message, userId);
  }

  async searchDirectMessages(chatId, userId, query) {
    const messages = await this.listDirectMessages(chatId, userId);
    const normalized = query.toLowerCase();
    return messages.filter((message) => message.content.toLowerCase().includes(normalized));
  }

  async canAccessDirectChat(chatId, userId) {
    const chat = this.directChats.find((entry) => entry.id === chatId);
    return Boolean(chat && [chat.user1_id, chat.user2_id].includes(userId));
  }
}

class SupabaseChatRepository {
  constructor() {
    this.supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
      auth: { persistSession: false },
    });
  }

  serializeCircleMessage(message, currentUserId) {
    return {
      id: message.id,
      circle_id: message.circle_id,
      user_id: message.user_id,
      content: message.content || '',
      media_url: message.media_url || '',
      media_type: message.media_type || '',
      media_name: message.media_name || '',
      media_size: message.media_size || 0,
      reactions: summarizeMessageReactions(message.reactions || [], currentUserId),
      message_status: normalizeMessageStatuses(message.message_status || []),
      status_summary: summarizeMessageStatuses(message.message_status || [], currentUserId),
      created_at: message.created_at,
      client_id: message.client_id || null,
      author: mapUser(message.users),
    };
  }

  serializeDirectMessage(message, currentUserId) {
    return {
      id: message.id,
      chat_id: message.chat_id,
      sender_id: message.sender_id,
      content: message.content || '',
      media_url: message.media_url || '',
      media_type: message.media_type || '',
      media_name: message.media_name || '',
      media_size: message.media_size || 0,
      status: message.status || 'sent',
      reactions: summarizeMessageReactions(message.reactions || [], currentUserId),
      message_status: normalizeMessageStatuses(message.message_status || []),
      status_summary: summarizeMessageStatuses(message.message_status || [], currentUserId),
      created_at: message.created_at,
      client_id: message.client_id || null,
      author: mapUser(message.users),
    };
  }

  async listCircleMessages(circleId, userId) {
    await ensureCircleAccess(circleId, userId);
    const { data, error } = await this.supabase
      .from('messages')
      .select(`
        id,
        circle_id,
        user_id,
        content,
        media_url,
        media_type,
        media_name,
        media_size,
        reactions,
        message_status,
        created_at,
        client_id,
        users:user_id ( id, name, email, bio, avatar_url, skills, created_at )
      `)
      .eq('circle_id', circleId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map((message) => this.serializeCircleMessage(message, userId));
  }

  async createCircleMessage({ circleId, userId, content, media = null, clientId = null }) {
    const circle = await ensureCircleAccess(circleId, userId);
    const recipients = (circle.members || [])
      .filter((member) => member.id !== userId)
      .map((member) => ({
        user_id: member.id,
        status: 'sent',
        delivered_at: null,
        read_at: null,
      }));

    const { data, error } = await this.supabase
      .from('messages')
      .insert({
        circle_id: circleId,
        user_id: userId,
        content: content || '',
        media_url: media?.url || '',
        media_type: media?.type || '',
        media_name: media?.name || '',
        media_size: media?.size || 0,
        reactions: [],
        message_status: recipients,
        client_id: clientId,
      })
      .select(`
        id,
        circle_id,
        user_id,
        content,
        media_url,
        media_type,
        media_name,
        media_size,
        reactions,
        message_status,
        created_at,
        client_id,
        users:user_id ( id, name, email, bio, avatar_url, skills, created_at )
      `)
      .single();
    if (error) throw error;
    return this.serializeCircleMessage(data, userId);
  }

  async updateCircleMessageStatus(circleId, userId, status) {
    await ensureCircleAccess(circleId, userId);
    const messages = await this.listCircleMessages(circleId, userId);
    const changedMessages = [];

    for (const message of messages.filter((entry) => entry.user_id !== userId)) {
      const nextStatuses = normalizeMessageStatuses(message.message_status).map((entry) => {
        if (entry.user_id !== userId) return entry;
        const nextStatus = status === 'read' || entry.status === 'read' ? 'read' : 'delivered';
        if (entry.status === nextStatus) return entry;
        return {
          ...entry,
          status: nextStatus,
          delivered_at: entry.delivered_at || new Date().toISOString(),
          read_at: nextStatus === 'read' ? new Date().toISOString() : entry.read_at,
        };
      });

      if (JSON.stringify(nextStatuses) === JSON.stringify(message.message_status || [])) {
        continue;
      }

      const { data, error } = await this.supabase
        .from('messages')
        .update({ message_status: nextStatuses })
        .eq('id', message.id)
        .select(`
          id,
          circle_id,
          user_id,
          content,
          media_url,
          media_type,
          media_name,
          media_size,
          reactions,
          message_status,
          created_at,
          client_id,
          users:user_id ( id, name, email, bio, avatar_url, skills, created_at )
        `)
        .single();
      if (error) throw error;
      changedMessages.push(this.serializeCircleMessage(data, userId));
    }

    return changedMessages;
  }

  async toggleCircleMessageReaction(messageId, userId, emoji) {
    const { data: existing, error: existingError } = await this.supabase
      .from('messages')
      .select(`
        id,
        circle_id,
        user_id,
        content,
        media_url,
        media_type,
        media_name,
        media_size,
        reactions,
        message_status,
        created_at,
        client_id,
        users:user_id ( id, name, email, bio, avatar_url, skills, created_at )
      `)
      .eq('id', messageId)
      .maybeSingle();
    if (existingError) throw existingError;
    if (!existing) {
      throw createError('Message not found.', 404);
    }
    await ensureCircleAccess(existing.circle_id, userId);

    const nextReactions = toggleReactionSet(existing.reactions || [], userId, emoji);
    const { data, error } = await this.supabase
      .from('messages')
      .update({ reactions: nextReactions })
      .eq('id', messageId)
      .select(`
        id,
        circle_id,
        user_id,
        content,
        media_url,
        media_type,
        media_name,
        media_size,
        reactions,
        message_status,
        created_at,
        client_id,
        users:user_id ( id, name, email, bio, avatar_url, skills, created_at )
      `)
      .single();
    if (error) throw error;
    return this.serializeCircleMessage(data, userId);
  }

  async searchCircleMessages(circleId, userId, query) {
    const { data, error } = await this.supabase
      .from('messages')
      .select(`
        id,
        circle_id,
        user_id,
        content,
        media_url,
        media_type,
        media_name,
        media_size,
        reactions,
        message_status,
        created_at,
        client_id,
        users:user_id ( id, name, email, bio, avatar_url, skills, created_at )
      `)
      .eq('circle_id', circleId)
      .ilike('content', `%${query}%`)
      .order('created_at', { ascending: true });
    if (error) throw error;
    await ensureCircleAccess(circleId, userId);
    return (data || []).map((message) => this.serializeCircleMessage(message, userId));
  }

  async listDirectChats(userId) {
    const { data: chats, error } = await this.supabase
      .from('direct_chats')
      .select('id, user1_id, user2_id, created_at, updated_at')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('updated_at', { ascending: false });
    if (error) throw error;

    const chatIds = (chats || []).map((chat) => chat.id);
    const { data: messages } = chatIds.length
      ? await this.supabase
        .from('direct_messages')
        .select(`
          id,
          chat_id,
          sender_id,
          content,
          media_url,
          media_type,
          media_name,
          media_size,
          status,
          reactions,
          message_status,
          created_at,
          client_id,
          users:sender_id ( id, name, email, bio, avatar_url, skills, created_at )
        `)
        .in('chat_id', chatIds)
        .order('created_at', { ascending: false })
      : { data: [] };

    const groupedMessages = new Map();
    (messages || []).forEach((message) => {
      groupedMessages.set(message.chat_id, [...(groupedMessages.get(message.chat_id) || []), message]);
    });

    return Promise.all((chats || []).map(async (chat) => {
      const participantId = chat.user1_id === userId ? chat.user2_id : chat.user1_id;
      const participant = await repository.findUserById(participantId);
      const chatMessages = groupedMessages.get(chat.id) || [];
      const lastMessage = chatMessages[0] ? this.serializeDirectMessage(chatMessages[0], userId) : null;
      const unreadCount = chatMessages
        .filter((message) => message.sender_id !== userId)
        .filter((message) => normalizeMessageStatuses(message.message_status || []).some((entry) => entry.user_id === userId && entry.status !== 'read'))
        .length;
      return {
        ...chat,
        participant,
        last_message: lastMessage,
        unread_count: unreadCount,
      };
    }));
  }

  async getOrCreateDirectChat(userId, participantId) {
    if (!participantId || participantId === userId) {
      throw createError('Select another user to start a chat.');
    }
    const participant = await repository.findUserById(participantId);
    if (!participant) {
      throw createError('User not found.', 404);
    }

    const [user1Id, user2Id] = normalizeChatPair(userId, participantId);
    const { data: existing, error: existingError } = await this.supabase
      .from('direct_chats')
      .select('id, user1_id, user2_id, created_at, updated_at')
      .eq('user1_id', user1Id)
      .eq('user2_id', user2Id)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing) {
      return {
        ...existing,
        participant,
      };
    }

    const { data, error } = await this.supabase
      .from('direct_chats')
      .insert({
        user1_id: user1Id,
        user2_id: user2Id,
      })
      .select('id, user1_id, user2_id, created_at, updated_at')
      .single();
    if (error) throw error;
    return {
      ...data,
      participant,
    };
  }

  async listDirectMessages(chatId, userId) {
    const { data: chat, error: chatError } = await this.supabase
      .from('direct_chats')
      .select('id, user1_id, user2_id, created_at, updated_at')
      .eq('id', chatId)
      .maybeSingle();
    if (chatError) throw chatError;
    await ensureDirectChatParticipant(chat, userId);

    const { data, error } = await this.supabase
      .from('direct_messages')
      .select(`
        id,
        chat_id,
        sender_id,
        content,
        media_url,
        media_type,
        media_name,
        media_size,
        status,
        reactions,
        message_status,
        created_at,
        client_id,
        users:sender_id ( id, name, email, bio, avatar_url, skills, created_at )
      `)
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map((message) => this.serializeDirectMessage(message, userId));
  }

  async createDirectMessage({ chatId, senderId, content, media = null, clientId = null }) {
    const { data: chat, error: chatError } = await this.supabase
      .from('direct_chats')
      .select('id, user1_id, user2_id, created_at, updated_at')
      .eq('id', chatId)
      .maybeSingle();
    if (chatError) throw chatError;
    await ensureDirectChatParticipant(chat, senderId);
    const recipientId = chat.user1_id === senderId ? chat.user2_id : chat.user1_id;

    const { data, error } = await this.supabase
      .from('direct_messages')
      .insert({
        chat_id: chatId,
        sender_id: senderId,
        content: content || '',
        media_url: media?.url || '',
        media_type: media?.type || '',
        media_name: media?.name || '',
        media_size: media?.size || 0,
        status: 'sent',
        reactions: [],
        message_status: [{
          user_id: recipientId,
          status: 'sent',
          delivered_at: null,
          read_at: null,
        }],
        client_id: clientId,
      })
      .select(`
        id,
        chat_id,
        sender_id,
        content,
        media_url,
        media_type,
        media_name,
        media_size,
        status,
        reactions,
        message_status,
        created_at,
        client_id,
        users:sender_id ( id, name, email, bio, avatar_url, skills, created_at )
      `)
      .single();
    if (error) throw error;

    await this.supabase
      .from('direct_chats')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', chatId);

    return this.serializeDirectMessage(data, senderId);
  }

  async updateDirectMessageStatus(chatId, userId, status) {
    const messages = await this.listDirectMessages(chatId, userId);
    const changedMessages = [];

    for (const message of messages.filter((entry) => entry.sender_id !== userId)) {
      const nextStatuses = normalizeMessageStatuses(message.message_status).map((entry) => {
        if (entry.user_id !== userId) return entry;
        const nextStatus = status === 'read' || entry.status === 'read' ? 'read' : 'delivered';
        if (entry.status === nextStatus) return entry;
        return {
          ...entry,
          status: nextStatus,
          delivered_at: entry.delivered_at || new Date().toISOString(),
          read_at: nextStatus === 'read' ? new Date().toISOString() : entry.read_at,
        };
      });

      if (JSON.stringify(nextStatuses) === JSON.stringify(message.message_status || [])) {
        continue;
      }

      const aggregateStatus = nextStatuses.some((entry) => entry.status === 'read') ? 'read' : 'delivered';
      const { data, error } = await this.supabase
        .from('direct_messages')
        .update({
          status: aggregateStatus,
          message_status: nextStatuses,
        })
        .eq('id', message.id)
        .select(`
          id,
          chat_id,
          sender_id,
          content,
          media_url,
          media_type,
          media_name,
          media_size,
          status,
          reactions,
          message_status,
          created_at,
          client_id,
          users:sender_id ( id, name, email, bio, avatar_url, skills, created_at )
        `)
        .single();
      if (error) throw error;
      changedMessages.push(this.serializeDirectMessage(data, userId));
    }

    return changedMessages;
  }

  async toggleDirectMessageReaction(messageId, userId, emoji) {
    const { data: existing, error: existingError } = await this.supabase
      .from('direct_messages')
      .select(`
        id,
        chat_id,
        sender_id,
        content,
        media_url,
        media_type,
        media_name,
        media_size,
        status,
        reactions,
        message_status,
        created_at,
        client_id,
        users:sender_id ( id, name, email, bio, avatar_url, skills, created_at )
      `)
      .eq('id', messageId)
      .maybeSingle();
    if (existingError) throw existingError;
    if (!existing) {
      throw createError('Message not found.', 404);
    }

    const { data: chat } = await this.supabase
      .from('direct_chats')
      .select('id, user1_id, user2_id, created_at, updated_at')
      .eq('id', existing.chat_id)
      .maybeSingle();
    await ensureDirectChatParticipant(chat, userId);

    const nextReactions = toggleReactionSet(existing.reactions || [], userId, emoji);
    const { data, error } = await this.supabase
      .from('direct_messages')
      .update({ reactions: nextReactions })
      .eq('id', messageId)
      .select(`
        id,
        chat_id,
        sender_id,
        content,
        media_url,
        media_type,
        media_name,
        media_size,
        status,
        reactions,
        message_status,
        created_at,
        client_id,
        users:sender_id ( id, name, email, bio, avatar_url, skills, created_at )
      `)
      .single();
    if (error) throw error;
    return this.serializeDirectMessage(data, userId);
  }

  async searchDirectMessages(chatId, userId, query) {
    const messages = await this.listDirectMessages(chatId, userId);
    const normalized = query.toLowerCase();
    return messages.filter((message) => message.content.toLowerCase().includes(normalized));
  }

  async canAccessDirectChat(chatId, userId) {
    const { data, error } = await this.supabase
      .from('direct_chats')
      .select('id')
      .eq('id', chatId)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .maybeSingle();
    if (error) throw error;
    return Boolean(data);
  }
}

export const chatRepository = useSupabaseRepository
  ? new SupabaseChatRepository()
  : new MemoryChatRepository();
