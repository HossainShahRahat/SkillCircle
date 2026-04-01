import { repository } from '../models/repository.js';
import { createImageUrl } from '../services/storageService.js';

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

    res.status(201).json({ post });
  } catch (error) {
    next(error);
  }
}

export async function toggleLike(req, res, next) {
  try {
    const result = await repository.toggleLike(req.params.postId, req.user.id);
    if (result.notificationTargetUserId) {
      await repository.createNotification({
        userId: result.notificationTargetUserId,
        type: 'like',
        referenceId: req.params.postId,
        triggeredBy: req.user.id,
      });
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

    const comment = await repository.addComment(req.params.postId, req.user.id, content.trim());
    if (comment.notificationTargetUserId) {
      await repository.createNotification({
        userId: comment.notificationTargetUserId,
        type: 'comment',
        referenceId: req.params.postId,
        triggeredBy: req.user.id,
      });
    }
    res.status(201).json({ comment });
  } catch (error) {
    next(error);
  }
}
