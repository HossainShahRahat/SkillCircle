import { Router } from 'express';
import {
  addComment,
  createPost,
  listPosts,
  toggleLike,
} from '../controllers/postController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

export const postRoutes = Router();

postRoutes.get('/', listPosts);
postRoutes.post('/', requireAuth, createPost);
postRoutes.post('/:postId/like', requireAuth, toggleLike);
postRoutes.post('/:postId/comments', requireAuth, addComment);

