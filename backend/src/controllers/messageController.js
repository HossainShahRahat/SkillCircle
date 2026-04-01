import { repository } from '../models/repository.js';

function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

export async function listMessages(req, res, next) {
  try {
    const messages = await repository.listMessages(req.params.circleId, req.user?.id || null);
    res.json({ messages });
  } catch (error) {
    next(error);
  }
}

export async function createMessage(req, res, next) {
  try {
    const { circleId, content } = req.body;
    if (!circleId || !content?.trim()) {
      throw badRequest('Circle and message content are required.');
    }

    const message = await repository.createMessage({
      circleId,
      userId: req.user.id,
      content: content.trim(),
    });

    res.status(201).json({ message });
  } catch (error) {
    next(error);
  }
}

