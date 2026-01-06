import dotenv from 'dotenv';

const envFound = dotenv.config();

if (envFound.error) {
  // eslint-disable-next-line no-console
  console.warn('⚠️  No .env file found, relying on process environment variables.');
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 4000,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '12h',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  adminEmail: process.env.ADMIN_EMAIL,
  adminPassword: process.env.ADMIN_PASSWORD
};

if (!env.mongoUri) {
  throw new Error('Missing MongoDB connection string. Set MONGODB_URI in environment variables.');
}

if (!env.jwtSecret) {
  throw new Error('Missing JWT secret. Set JWT_SECRET in environment variables.');
}
