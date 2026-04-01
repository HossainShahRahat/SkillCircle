import { repository } from '../models/repository.js';
import { emitToUser } from '../services/socketServer.js';

function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

async function notifyJoinIfEnabled(userId, referenceId, triggeredBy) {
  const settings = await repository.getUserSettings?.(userId);
  if (settings && settings.notify_joins === false) {
    return;
  }
  const notification = await repository.createNotification({
    userId,
    type: 'join',
    referenceId,
    triggeredBy,
  });
  emitToUser(userId, 'new_notification', { notification });
}

export async function listCircles(req, res, next) {
  try {
    const circles = await repository.listCircles(req.user?.id || null);
    res.json({ circles });
  } catch (error) {
    next(error);
  }
}

export async function createCircle(req, res, next) {
  try {
    const { name, description, is_private: isPrivate } = req.body;
    if (!name?.trim() || !description?.trim()) {
      throw badRequest('Circle name and description are required.');
    }

    const circle = await repository.createCircle({
      name: name.trim(),
      description: description.trim(),
      isPrivate: Boolean(isPrivate),
      userId: req.user.id,
    });

    res.status(201).json({ circle });
  } catch (error) {
    next(error);
  }
}

export async function joinCircle(req, res, next) {
  try {
    const result = await repository.joinCircle(req.params.circleId, req.user.id);
    if (result.notificationTargetUserId) {
      await notifyJoinIfEnabled(result.notificationTargetUserId, req.params.circleId, req.user.id);
    }
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function joinCircleByCode(req, res, next) {
  try {
    const { code } = req.body;
    if (!code?.trim()) {
      throw badRequest('Invite code is required.');
    }

    const result = await repository.joinCircleByCode(code, req.user.id);
    if (result.notificationTargetUserId) {
      await notifyJoinIfEnabled(result.notificationTargetUserId, result.circle.id, req.user.id);
    }
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function leaveCircle(req, res, next) {
  try {
    const result = await repository.leaveCircle(req.params.circleId, req.user.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function getCircle(req, res, next) {
  try {
    const circle = await repository.getCircle(req.params.circleId, req.user?.id || null);
    if (!circle) {
      return res.status(404).json({ message: 'Circle not found.' });
    }

    res.json({ circle });
  } catch (error) {
    next(error);
  }
}

export async function searchCircle(req, res, next) {
  try {
    const query = req.query.q?.trim() || '';
    if (!query) {
      return res.json({ posts: [], members: [] });
    }
    const results = await repository.searchCircle(req.params.circleId, query, req.user?.id || null);
    res.json(results);
  } catch (error) {
    next(error);
  }
}

export async function updateCircleMemberRole(req, res, next) {
  try {
    const { role } = req.body;
    if (!['admin', 'moderator', 'member'].includes(role)) {
      throw badRequest('A valid role is required.');
    }
    const member = await repository.updateCircleMemberRole(
      req.params.circleId,
      req.params.userId,
      role,
      req.user.id,
    );
    res.json({ member });
  } catch (error) {
    next(error);
  }
}
