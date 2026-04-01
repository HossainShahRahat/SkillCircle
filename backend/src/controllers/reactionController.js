import { repository } from '../models/repository.js';
import { emitGlobal, emitToCircle } from '../services/socketServer.js';

function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

export async function toggleReaction(req, res, next) {
  try {
    const { referenceType, referenceId, reactionType } = req.body;
    if (!referenceType || !referenceId || !reactionType) {
      throw badRequest('referenceType, referenceId, and reactionType are required.');
    }

    const reactions = await repository.toggleReaction({
      userId: req.user.id,
      referenceType,
      referenceId,
      reactionType,
    });

    let circleId = null;
    if (referenceType === 'post') {
      const post = await repository.getPostById(referenceId, req.user.id);
      circleId = post?.circle_id || null;
    } else {
      const comment = await repository.getCommentById(referenceId);
      const post = comment ? await repository.getPostById(comment.post_id, req.user.id) : null;
      circleId = post?.circle_id || null;
    }

    emitGlobal('reaction_updated', { referenceType, referenceId, reactions });
    if (circleId) {
      emitToCircle(circleId, 'reaction_updated', { referenceType, referenceId, reactions });
    }

    res.json({ reactions });
  } catch (error) {
    next(error);
  }
}

