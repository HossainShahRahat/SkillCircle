import { chatRepository } from '../models/chatRepository.js';
import { createChatMediaAttachment } from '../services/storageService.js';
import { emitToCircle, emitToDirectChat, emitToUser } from '../services/socketServer.js';

function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function requireMessagePayload(content, media) {
  if (!content?.trim() && !media?.url) {
    throw badRequest('Message content or media is required.');
  }
}

export async function listCircleMessages(req, res, next) {
  try {
    const messages = await chatRepository.listCircleMessages(req.params.circleId, req.user.id);
    const statusUpdates = await chatRepository.updateCircleMessageStatus(req.params.circleId, req.user.id, 'delivered');

    statusUpdates.forEach((message) => {
      emitToCircle(req.params.circleId, 'message_status_update', {
        scope: 'circle',
        targetId: req.params.circleId,
        message,
      });
    });

    res.json({ messages });
  } catch (error) {
    next(error);
  }
}

export async function createCircleMessage(req, res, next) {
  try {
    const { content, media, client_id: clientId } = req.body;
    requireMessagePayload(content, media);

    const message = await chatRepository.createCircleMessage({
      circleId: req.params.circleId || req.body.circleId,
      userId: req.user.id,
      content: content?.trim() || '',
      media: media || null,
      clientId: clientId || null,
    });

    emitToCircle(message.circle_id, 'new_message', {
      scope: 'circle',
      targetId: message.circle_id,
      message,
    });
    if (message.media_url) {
      emitToCircle(message.circle_id, 'media_upload_notification', {
        scope: 'circle',
        targetId: message.circle_id,
        message,
      });
      emitToCircle(message.circle_id, 'media_uploaded', {
        scope: 'circle',
        targetId: message.circle_id,
        message,
      });
    }

    res.status(201).json({ message });
  } catch (error) {
    next(error);
  }
}

export async function markCircleMessages(req, res, next) {
  try {
    const status = req.body.status === 'read' ? 'read' : 'delivered';
    const messages = await chatRepository.updateCircleMessageStatus(req.params.circleId, req.user.id, status);

    messages.forEach((message) => {
      emitToCircle(req.params.circleId, 'message_status_update', {
        scope: 'circle',
        targetId: req.params.circleId,
        message,
      });
    });

    res.json({ messages });
  } catch (error) {
    next(error);
  }
}

export async function searchCircleMessages(req, res, next) {
  try {
    const query = req.query.q?.trim() || '';
    if (!query) {
      return res.json({ messages: [] });
    }
    const messages = await chatRepository.searchCircleMessages(req.params.circleId, req.user.id, query);
    res.json({ messages });
  } catch (error) {
    next(error);
  }
}

export async function reactToCircleMessage(req, res, next) {
  try {
    const { emoji } = req.body;
    if (!emoji?.trim()) {
      throw badRequest('A reaction emoji is required.');
    }

    const message = await chatRepository.toggleCircleMessageReaction(req.params.messageId, req.user.id, emoji.trim());
    emitToCircle(message.circle_id, 'message_reaction', {
      scope: 'circle',
      targetId: message.circle_id,
      message,
    });

    res.json({ message });
  } catch (error) {
    next(error);
  }
}

export async function listDirectChats(req, res, next) {
  try {
    const chats = await chatRepository.listDirectChats(req.user.id);
    res.json({ chats });
  } catch (error) {
    next(error);
  }
}

export async function createOrFetchDirectChat(req, res, next) {
  try {
    const participantId = req.body.participantId || req.params.userId;
    if (!participantId) {
      throw badRequest('participantId is required.');
    }

    const chat = await chatRepository.getOrCreateDirectChat(req.user.id, participantId);
    res.status(201).json({ chat });
  } catch (error) {
    next(error);
  }
}

export async function listDirectMessages(req, res, next) {
  try {
    const messages = await chatRepository.listDirectMessages(req.params.chatId, req.user.id);
    const statusUpdates = await chatRepository.updateDirectMessageStatus(req.params.chatId, req.user.id, 'delivered');

    statusUpdates.forEach((message) => {
      emitToDirectChat(req.params.chatId, 'message_status_update', {
        scope: 'direct',
        targetId: req.params.chatId,
        message,
      });
      emitToUser(message.sender_id, 'message_status_update', {
        scope: 'direct',
        targetId: req.params.chatId,
        message,
      });
    });

    res.json({ messages });
  } catch (error) {
    next(error);
  }
}

export async function createDirectMessage(req, res, next) {
  try {
    const { content, media, client_id: clientId } = req.body;
    requireMessagePayload(content, media);

    const message = await chatRepository.createDirectMessage({
      chatId: req.params.chatId,
      senderId: req.user.id,
      content: content?.trim() || '',
      media: media || null,
      clientId: clientId || null,
    });

    emitToDirectChat(req.params.chatId, 'new_message', {
      scope: 'direct',
      targetId: req.params.chatId,
      message,
    });
    if (message.media_url) {
      emitToDirectChat(req.params.chatId, 'media_upload_notification', {
        scope: 'direct',
        targetId: req.params.chatId,
        message,
      });
      emitToDirectChat(req.params.chatId, 'media_uploaded', {
        scope: 'direct',
        targetId: req.params.chatId,
        message,
      });
    }

    const recipientStatus = message.message_status?.[0];
    if (recipientStatus?.user_id) {
      emitToUser(recipientStatus.user_id, 'new_message', {
        scope: 'direct',
        targetId: req.params.chatId,
        message,
      });
      if (message.media_url) {
        emitToUser(recipientStatus.user_id, 'media_upload_notification', {
          scope: 'direct',
          targetId: req.params.chatId,
          message,
        });
        emitToUser(recipientStatus.user_id, 'media_uploaded', {
          scope: 'direct',
          targetId: req.params.chatId,
          message,
        });
      }
    }

    res.status(201).json({ message });
  } catch (error) {
    next(error);
  }
}

export async function markDirectMessages(req, res, next) {
  try {
    const status = req.body.status === 'read' ? 'read' : 'delivered';
    const messages = await chatRepository.updateDirectMessageStatus(req.params.chatId, req.user.id, status);

    messages.forEach((message) => {
      emitToDirectChat(req.params.chatId, 'message_status_update', {
        scope: 'direct',
        targetId: req.params.chatId,
        message,
      });
      emitToUser(message.sender_id, 'message_status_update', {
        scope: 'direct',
        targetId: req.params.chatId,
        message,
      });
    });

    res.json({ messages });
  } catch (error) {
    next(error);
  }
}

export async function searchDirectMessages(req, res, next) {
  try {
    const query = req.query.q?.trim() || '';
    if (!query) {
      return res.json({ messages: [] });
    }
    const messages = await chatRepository.searchDirectMessages(req.params.chatId, req.user.id, query);
    res.json({ messages });
  } catch (error) {
    next(error);
  }
}

export async function reactToDirectMessage(req, res, next) {
  try {
    const { emoji } = req.body;
    if (!emoji?.trim()) {
      throw badRequest('A reaction emoji is required.');
    }

    const message = await chatRepository.toggleDirectMessageReaction(req.params.messageId, req.user.id, emoji.trim());
    emitToDirectChat(message.chat_id, 'message_reaction', {
      scope: 'direct',
      targetId: message.chat_id,
      message,
    });

    const recipientStatus = message.message_status?.[0];
    const peerUserId = recipientStatus?.user_id || message.sender_id;
    if (peerUserId) {
      emitToUser(peerUserId, 'message_reaction', {
        scope: 'direct',
        targetId: message.chat_id,
        message,
      });
    }

    res.json({ message });
  } catch (error) {
    next(error);
  }
}

export async function uploadChatMedia(req, res, next) {
  try {
    const { fileName, contentType, size, dataUrl, sourceUrl } = req.body;
    if (!fileName && !sourceUrl) {
      throw badRequest('fileName or sourceUrl is required.');
    }

    const media = await createChatMediaAttachment({
      fileName,
      contentType,
      size,
      dataUrl,
      sourceUrl,
    });

    res.status(201).json({ media });
  } catch (error) {
    next(error);
  }
}

export async function reactToMessage(req, res, next) {
  if (req.body.scope === 'direct') {
    return reactToDirectMessage(req, res, next);
  }
  return reactToCircleMessage(req, res, next);
}

export async function updateMessageStatusById(req, res, next) {
  try {
    const { scope, targetId, status } = req.body;
    const messages = scope === 'direct'
      ? await chatRepository.updateDirectMessageStatus(targetId, req.user.id, status)
      : await chatRepository.updateCircleMessageStatus(targetId, req.user.id, status);

    const matchedMessage = messages.find((message) => message.id === req.params.messageId) || null;
    const emitter = scope === 'direct' ? emitToDirectChat : emitToCircle;
    messages.forEach((message) => {
      emitter(targetId, 'message_status_update', {
        scope,
        targetId,
        message,
      });
      if (scope === 'direct') {
        emitToUser(message.sender_id, 'message_status_update', {
          scope,
          targetId,
          message,
        });
      }
    });

    res.json({ message: matchedMessage, messages });
  } catch (error) {
    next(error);
  }
}

export async function syncOfflineMessages(req, res, next) {
  try {
    const queue = Array.isArray(req.body.messages) ? req.body.messages : [];
    const delivered = [];

    for (const item of queue) {
      if (item.scope === 'direct') {
        const message = await chatRepository.createDirectMessage({
          chatId: item.targetId,
          senderId: req.user.id,
          content: item.content?.trim() || '',
          media: item.media || null,
          clientId: item.client_id || null,
        });
        emitToDirectChat(item.targetId, 'new_message', { scope: 'direct', targetId: item.targetId, message });
        delivered.push(message);
      } else if (item.scope === 'circle') {
        const message = await chatRepository.createCircleMessage({
          circleId: item.targetId,
          userId: req.user.id,
          content: item.content?.trim() || '',
          media: item.media || null,
          clientId: item.client_id || null,
        });
        emitToCircle(item.targetId, 'new_message', { scope: 'circle', targetId: item.targetId, message });
        delivered.push(message);
      }
    }

    res.json({ messages: delivered });
  } catch (error) {
    next(error);
  }
}

export const listMessages = listCircleMessages;

export async function createMessage(req, res, next) {
  req.params.circleId = req.params.circleId || req.body.circleId;
  return createCircleMessage(req, res, next);
}
