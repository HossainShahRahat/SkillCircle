import { Router } from 'express';
import {
  addComment,
  createPost,
  listPosts,
  toggleLike,
} from '../controllers/postController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import {
  deleteComment,
  deletePost,
  updateComment,
  updatePost,
} from '../controllers/contentController.js';

export const postRoutes = Router();

postRoutes.get('/', listPosts);
postRoutes.post('/', requireAuth, createPost);
postRoutes.post('/:postId/like', requireAuth, toggleLike);
postRoutes.patch('/:postId', requireAuth, updatePost);
postRoutes.delete('/:postId', requireAuth, deletePost);
postRoutes.post('/:postId/comments', requireAuth, addComment);
postRoutes.patch('/comments/:commentId', requireAuth, updateComment);
postRoutes.delete('/comments/:commentId', requireAuth, deleteComment);
