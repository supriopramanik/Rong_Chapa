import { createServer } from 'http';
import { createApp } from './app.js';
import { connectDatabase } from './config/database.js';
import { ensureAdminUser } from './services/admin.service.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

const startServer = async () => {
  await connectDatabase();
  await ensureAdminUser();

  const app = createApp();
  const server = createServer(app);

  server.listen(env.port, () => {
    logger.info(`🚀 API listening on port ${env.port}`);
  });
};

startServer().catch((error) => {
  logger.error('Failed to start server', error);
  process.exit(1);
});
