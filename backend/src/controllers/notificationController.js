import { repository } from '../models/repository.js';

export async function listNotifications(req, res, next) {
  try {
    const notifications = await repository.listNotifications(req.user.id);
    res.json({ notifications });
  } catch (error) {
    next(error);
  }
}

export async function markNotificationRead(req, res, next) {
  try {
    const notification = await repository.markNotificationRead(req.params.notificationId, req.user.id);
    res.json({ notification });
  } catch (error) {
    next(error);
  }
}

