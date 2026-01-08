import express from 'express';
import { getDashboard, getAdminOrders, getCustomers } from '../controllers/admin.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

export const adminRouter = express.Router();

adminRouter.use(authenticate, requireAdmin);

adminRouter.get('/dashboard', getDashboard);
adminRouter.get('/orders', getAdminOrders);
adminRouter.get('/customers', getCustomers);
