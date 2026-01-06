import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const signToken = (payload, options = {}) => {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
    ...options
  });
};
