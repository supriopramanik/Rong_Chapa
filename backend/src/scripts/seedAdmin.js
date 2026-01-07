import { connectDatabase } from '../config/database.js';
import { ensureAdminUser } from '../services/admin.service.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

// Seed or refresh the admin user using ADMIN_EMAIL and ADMIN_PASSWORD from env
const run = async () => {
  try {
    if (!env.adminEmail || !env.adminPassword) {
      logger.error('Missing ADMIN_EMAIL or ADMIN_PASSWORD in environment. Aborting.');
      process.exit(1);
    }

    await connectDatabase();
    await ensureAdminUser();
    logger.info(`Admin seed complete for ${env.adminEmail}`);
    process.exit(0);
  } catch (err) {
    logger.error('Admin seed failed', err);
    process.exit(1);
  }
};

run();
