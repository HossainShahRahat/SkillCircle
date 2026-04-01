import { repository } from '../models/repository.js';
import { createImageUrl } from '../services/storageService.js';
import { resolveMentions } from '../services/mentionService.js';
import { emitGlobal, emitToCircle, emitToUser } from '../services/socketServer.js';

function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
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

    res.status(201).json({ post });
  } catch (error) {
    next(error);
  }
}

export async function toggleLike(req, res, next) {
  try {
    const result = await repository.toggleLike(req.params.postId, req.user.id);
    if (result.notificationTargetUserId) {
      const notification = await repository.createNotification({
        userId: result.notificationTargetUserId,
        type: 'like',
        referenceId: req.params.postId,
        triggeredBy: req.user.id,
      });
      emitToUser(result.notificationTargetUserId, 'new_notification', { notification });
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
      const notification = await repository.createNotification({
        userId: comment.notificationTargetUserId,
        type: 'comment',
        referenceId: req.params.postId,
        triggeredBy: req.user.id,
      });
      emitToUser(comment.notificationTargetUserId, 'new_notification', { notification });
    }
    await Promise.all(
      mentionedUsers
        .filter((mentionedUser) => mentionedUser.id !== req.user.id && mentionedUser.id !== comment.notificationTargetUserId)
        .map(async (mentionedUser) => {
          const notification = await repository.createNotification({
            userId: mentionedUser.id,
            type: 'mention',
            referenceId: req.params.postId,
            triggeredBy: req.user.id,
          });
          emitToUser(mentionedUser.id, 'new_notification', { notification });
          emitToUser(mentionedUser.id, 'new_mention', { notification });
        }),
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
