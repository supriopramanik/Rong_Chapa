import { logger } from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  logger.error('API error', err);
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || 'Something went wrong',
    details: err.details || null
  });
};
