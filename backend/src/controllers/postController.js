import { repository } from '../models/repository.js';
import { createImageUrl } from '../services/storageService.js';
import { resolveMentions } from '../services/mentionService.js';
import { emitGlobal, emitToCircle, emitToUser } from '../services/socketServer.js';

function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

async function notifyIfEnabled(userId, key, buildNotification, event = 'new_notification') {
  const settings = await repository.getUserSettings?.(userId);
  if (settings && settings[key] === false) {
    return;
  }
  const notification = await buildNotification();
  emitToUser(userId, event, { notification });
}

export async function listPosts(req, res, next) {
  try {
    const circleId = req.query.circleId || null;
    const posts = await repository.getFeed(req.user?.id || null, circleId);
    res.json({ posts });
  } catch (error) {
    next(error);
  }
}

export async function createPost(req, res, next) {
  try {
    const { content, image, circleId } = req.body;
    if (!content?.trim()) {
      throw badRequest('Post content is required.');
    }

    const imageUrl = await createImageUrl(image);
    const post = await repository.createPost({
      userId: req.user.id,
      content: content.trim(),
      imageUrl,
      circleId: circleId || null,
    });

    emitGlobal('new_post', { post });
    if (post.circle_id) {
      emitToCircle(post.circle_id, 'new_post', { post });
    }

    const [dashboard, analytics] = await Promise.all([
      repository.getDashboard?.(req.user.id),
      repository.getUserAnalytics?.(req.user.id),
    ]);

    res.status(201).json({
      post,
      streak: dashboard?.streak || analytics?.streak || null,
      insights: dashboard?.insights || analytics?.totals || null,
    });
  } catch (error) {
    next(error);
  }
}

export async function toggleLike(req, res, next) {
  try {
    const result = await repository.toggleLike(req.params.postId, req.user.id);
    if (result.notificationTargetUserId) {
      await notifyIfEnabled(result.notificationTargetUserId, 'notify_likes', () => repository.createNotification({
        userId: result.notificationTargetUserId,
        type: 'like',
        referenceId: req.params.postId,
        triggeredBy: req.user.id,
      }));
    }
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function addComment(req, res, next) {
  try {
    const { content } = req.body;
    if (!content?.trim()) {
      throw badRequest('Comment content is required.');
    }

    const post = await repository.getPostById(req.params.postId, req.user.id);
    const activeMembers = post?.circle_id
      ? await repository.listCircleMembers(post.circle_id, req.user.id)
      : [];
    const mentionedUsers = resolveMentions(content.trim(), activeMembers);
    const comment = await repository.addComment(
      req.params.postId,
      req.user.id,
      content.trim(),
      mentionedUsers.map((user) => user.id),
    );

    if (comment.notificationTargetUserId) {
      await notifyIfEnabled(comment.notificationTargetUserId, 'notify_comments', () => repository.createNotification({
        userId: comment.notificationTargetUserId,
        type: 'comment',
        referenceId: req.params.postId,
        triggeredBy: req.user.id,
      }));
    }
    await Promise.all(
      mentionedUsers
        .filter((mentionedUser) => mentionedUser.id !== req.user.id && mentionedUser.id !== comment.notificationTargetUserId)
        .map((mentionedUser) => notifyIfEnabled(mentionedUser.id, 'notify_mentions', () => repository.createNotification({
            userId: mentionedUser.id,
            type: 'mention',
            referenceId: req.params.postId,
            triggeredBy: req.user.id,
          }), 'new_mention')),
    );
    emitGlobal('new_comment', { postId: req.params.postId, comment });
    if (post?.circle_id) {
      emitToCircle(post.circle_id, 'new_comment', { postId: req.params.postId, comment });
    }
    res.status(201).json({ comment });
  } catch (error) {
    next(error);
  }
}
