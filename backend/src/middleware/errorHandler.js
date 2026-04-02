import { logger } from '../services/logger.js';
import { config } from '../config.js';

export function errorHandler(error, _req, res, _next) {
  logger.error(error.message || 'Unhandled error', {
    status: error.status || 500,
    stack: error.stack,
  });
  const status = error.status || 500;
  res.status(status).json({
    message: status >= 500 && config.nodeEnv === 'production'
      ? 'Internal server error.'
      : error.message || 'Internal server error.',
  });
}
