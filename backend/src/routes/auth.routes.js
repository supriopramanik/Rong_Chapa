import express from 'express';
import { register, login, getProfile, updateProfile } from '../controllers/auth.controller.js';
import { registerValidator, loginValidator, updateProfileValidator } from '../validators/auth.validators.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

export const authRouter = express.Router();

authRouter.post('/register', registerValidator, register);
authRouter.post('/login', loginValidator, login);

authRouter.get('/profile', authenticate, requireAdmin, getProfile);
authRouter.get('/me', authenticate, getProfile);
authRouter.put('/me', authenticate, updateProfileValidator, updateProfile);
