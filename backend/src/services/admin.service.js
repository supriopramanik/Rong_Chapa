import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export const ensureAdminUser = async () => {
  if (!env.adminEmail || !env.adminPassword) {
    logger.warn('Admin seeding skipped: ADMIN_EMAIL or ADMIN_PASSWORD not set.');
    return;
  }

  const existing = await User.findOne({ email: env.adminEmail });
  if (existing) {
    existing.password = env.adminPassword;
    existing.role = 'admin';
    if (!existing.name) {
      existing.name = 'Rong Chapa Admin';
    }
    await existing.save();
    logger.info(`✅ Admin user refreshed for ${env.adminEmail}`);
    return;
  }

  await User.create({
    email: env.adminEmail,
    password: env.adminPassword,
    name: 'Rong Chapa Admin',
    role: 'admin'
  });

  logger.info(`✅ Admin user created for ${env.adminEmail}`);
};
