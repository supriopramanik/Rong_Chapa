import { User } from '../models/User.js';
import { Admin } from '../models/Admin.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { sanitizeUser } from '../utils/sanitizeUser.js';

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
    // Ensure an Admin profile entry exists/updated
    await Admin.findOneAndUpdate(
      { email: existing.email },
      {
        user: existing._id,
        email: existing.email,
        name: existing.name,
        phone: existing.phone,
        organization: existing.organization
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    logger.info(`✅ Admin user refreshed for ${env.adminEmail}`);
    return;
  }

  await User.create({
    email: env.adminEmail,
    password: env.adminPassword,
    name: 'Rong Chapa Admin',
    role: 'admin'
  });

  // Fetch the created user to link Admin profile
  const created = await User.findOne({ email: env.adminEmail });
  if (created) {
    await Admin.findOneAndUpdate(
      { email: created.email },
      {
        user: created._id,
        email: created.email,
        name: created.name,
        phone: created.phone,
        organization: created.organization
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  logger.info(`✅ Admin user created for ${env.adminEmail}`);
};

export const getCustomerDirectory = async ({ limit = 12 } = {}) => {
  const numericLimit = Number(limit);
  const safeLimit = Number.isFinite(numericLimit) ? Math.min(Math.max(numericLimit, 1), 50) : 12;

  const [totalCustomers, recentCustomers] = await Promise.all([
    User.countDocuments({ role: 'customer' }),
    User.find({ role: 'customer' })
      .sort({ createdAt: -1 })
      .limit(safeLimit)
  ]);

  return {
    totalCustomers,
    customers: recentCustomers.map(sanitizeUser)
  };
};
