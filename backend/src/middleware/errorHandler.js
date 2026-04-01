import { logger } from '../services/logger.js';

export function errorHandler(error, _req, res, _next) {
  logger.error(error.message || 'Unhandled error', {
    status: error.status || 500,
    stack: error.stack,
  });
  const status = error.status || 500;
  res.status(status).json({
    message: error.message || 'Internal server error.',
  });
}
