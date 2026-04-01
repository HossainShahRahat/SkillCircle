import express from 'express';
import http from 'http';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config.js';
import { authRoutes } from './routes/authRoutes.js';
import { profileRoutes } from './routes/profileRoutes.js';
import { postRoutes } from './routes/postRoutes.js';
import { circleRoutes } from './routes/circleRoutes.js';
import { notificationRoutes } from './routes/notificationRoutes.js';
import { searchRoutes } from './routes/searchRoutes.js';
import { messageRoutes } from './routes/messageRoutes.js';
import { reactionRoutes } from './routes/reactionRoutes.js';
import { dashboardRoutes } from './routes/dashboardRoutes.js';
import { analyticsRoutes } from './routes/analyticsRoutes.js';
import { settingsRoutes } from './routes/settingsRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { attachCurrentUser } from './middleware/authMiddleware.js';
import { applySecurityHeaders } from './middleware/securityMiddleware.js';
import { initializeSocketServer } from './services/socketServer.js';

const app = express();
const httpServer = http.createServer(app);

function resolveOrigin(origin, callback) {
  if (!origin || config.clientUrls.includes(origin)) {
    callback(null, true);
    return;
  }
  callback(new Error('CORS origin not allowed.'));
}

app.use(
  cors({
    origin: resolveOrigin,
    credentials: true,
  }),
);
app.use(applySecurityHeaders);
app.use(express.json({ limit: config.bodyLimit }));
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
app.use('/api/messages', messageRoutes);
app.use('/api/reactions', reactionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);

app.use(errorHandler);

initializeSocketServer(httpServer);

httpServer.listen(config.port, () => {
  console.log(`SkillCircle API listening on http://localhost:${config.port}`);
});
