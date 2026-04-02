import { config } from './config.js';
import { createHttpServer } from './app.js';
import { logger } from './services/logger.js';

const { httpServer } = createHttpServer();

httpServer.listen(config.port, () => {
  logger.info('SkillCircle API listening', { url: `http://localhost:${config.port}` });
});
