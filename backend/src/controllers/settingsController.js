import { repository } from '../models/repository.js';

function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

export async function getSettings(req, res, next) {
  try {
    const settings = await repository.getUserSettings(req.user.id);
    res.json({ settings });
  } catch (error) {
    next(error);
  }
}

export async function updateSettings(req, res, next) {
  try {
    const {
      post_visibility,
      notify_likes,
      notify_comments,
      notify_mentions,
      notify_joins,
      weekly_digest,
    } = req.body;

    if (!['public', 'circles'].includes(post_visibility)) {
      throw badRequest('Invalid post visibility value.');
    }

    const settings = await repository.updateUserSettings(req.user.id, {
      post_visibility,
      notify_likes: Boolean(notify_likes),
      notify_comments: Boolean(notify_comments),
      notify_mentions: Boolean(notify_mentions),
      notify_joins: Boolean(notify_joins),
      weekly_digest: Boolean(weekly_digest),
    });

    res.json({ settings });
  } catch (error) {
    next(error);
  }
}
