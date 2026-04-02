import { repository } from '../models/repository.js';
import { resolveMentions } from '../services/mentionService.js';
import { emitGlobal, emitToCircle, emitToUser } from '../services/socketServer.js';

function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

async function ensureCanManagePost(postId, userId) {
  const post = await repository.getPostById(postId, userId);
  if (!post) {
    const error = new Error('Post not found.');
    error.status = 404;
    throw error;
  }

  const canManage = post.user_id === userId
    || (post.circle_id && await repository.canModerateCircleContent(post.circle_id, userId));
  if (!canManage) {
    const error = new Error('You do not have permission to manage this post.');
    error.status = 403;
    throw error;
  }

  return post;
}

async function ensureCanManageComment(commentId, userId) {
  const comment = await repository.getCommentById(commentId);
  if (!comment) {
    const error = new Error('Comment not found.');
    error.status = 404;
    throw error;
  }
  const post = await repository.getPostById(comment.post_id, userId);
  const canManage = comment.user_id === userId
    || (post?.circle_id && await repository.canModerateCircleContent(post.circle_id, userId));
  if (!canManage) {
    const error = new Error('You do not have permission to manage this comment.');
    error.status = 403;
    throw error;
  }

  return { comment, post };
}

export async function updatePost(req, res, next) {
  try {
    const { content } = req.body;
    if (!content?.trim()) {
      throw badRequest('Post content is required.');
    }
    const existing = await ensureCanManagePost(req.params.postId, req.user.id);
    const post = await repository.updatePost(req.params.postId, req.user.id, content.trim());
    if (existing.circle_id) {
      emitToCircle(existing.circle_id, 'post_updated', { post });
    } else {
      emitGlobal('post_updated', { post });
    }
    res.json({ post });
  } catch (error) {
    next(error);
  }
}

export async function deletePost(req, res, next) {
  try {
    const existing = await ensureCanManagePost(req.params.postId, req.user.id);
    const deleted = await repository.softDeletePost(req.params.postId);
    if (existing.circle_id) {
      emitToCircle(existing.circle_id, 'post_deleted', { postId: req.params.postId });
    } else {
      emitGlobal('post_deleted', { postId: req.params.postId });
    }
    res.json({ deleted });
  } catch (error) {
    next(error);
  }
}

export async function updateComment(req, res, next) {
  try {
    const { content } = req.body;
    if (!content?.trim()) {
      throw badRequest('Comment content is required.');
    }
    const { comment, post } = await ensureCanManageComment(req.params.commentId, req.user.id);
    const activeMembers = post?.circle_id ? await repository.listCircleMembers(post.circle_id, req.user.id) : [];
    const mentionedUsers = resolveMentions(content.trim(), activeMembers);
    const updatedComment = await repository.updateComment(
      req.params.commentId,
      req.user.id,
      content.trim(),
      mentionedUsers.map((user) => user.id),
    );

    await Promise.all(
      mentionedUsers
        .filter((mentionedUser) => mentionedUser.id !== req.user.id && mentionedUser.id !== comment.user_id)
        .map(async (mentionedUser) => {
          const notification = await repository.createNotification({
            userId: mentionedUser.id,
            type: 'mention',
            referenceId: comment.post_id,
            triggeredBy: req.user.id,
          });
          emitToUser(mentionedUser.id, 'new_notification', { notification });
        }),
    );

    if (post?.circle_id) {
      emitToCircle(post.circle_id, 'comment_updated', { postId: comment.post_id, comment: updatedComment });
    } else {
      emitGlobal('comment_updated', { postId: comment.post_id, comment: updatedComment });
    }
    res.json({ comment: updatedComment });
  } catch (error) {
    next(error);
  }
}

export async function deleteComment(req, res, next) {
  try {
    const { comment, post } = await ensureCanManageComment(req.params.commentId, req.user.id);
    const deleted = await repository.softDeleteComment(req.params.commentId);
    if (post?.circle_id) {
      emitToCircle(post.circle_id, 'comment_deleted', { postId: comment.post_id, commentId: req.params.commentId });
    } else {
      emitGlobal('comment_deleted', { postId: comment.post_id, commentId: req.params.commentId });
    }
    res.json({ deleted });
  } catch (error) {
    next(error);
  }
}
