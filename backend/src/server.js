import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config.js';
import { authRoutes } from './routes/authRoutes.js';
import { profileRoutes } from './routes/profileRoutes.js';
import { postRoutes } from './routes/postRoutes.js';
import { circleRoutes } from './routes/circleRoutes.js';
import { notificationRoutes } from './routes/notificationRoutes.js';
import { searchRoutes } from './routes/searchRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { attachCurrentUser } from './middleware/authMiddleware.js';

const app = express();

app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  }),
);
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));
app.use(attachCurrentUser);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'skillcircle-api' });
});

app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/circles', circleRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/search', searchRoutes);

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`SkillCircle API listening on http://localhost:${config.port}`);
});
