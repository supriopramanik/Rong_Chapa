import express from 'express';
import {
  createPrintOrder,
  listPrintOrders,
  listMyPrintOrders,
  updatePrintOrderStatus,
  updatePrintOrderBilling
} from '../controllers/printOrder.controller.js';
import {
  createPrintOrderValidator,
  updatePrintOrderStatusValidator,
  updatePrintOrderBillingValidator
} from '../validators/printOrder.validators.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

export const printOrderRouter = express.Router();

printOrderRouter.post('/', authenticate, createPrintOrderValidator, createPrintOrder);

printOrderRouter.get('/mine', authenticate, listMyPrintOrders);

printOrderRouter.get('/', authenticate, requireAdmin, listPrintOrders);
printOrderRouter.patch('/:id/status', authenticate, requireAdmin, updatePrintOrderStatusValidator, updatePrintOrderStatus);
printOrderRouter.patch('/:id/billing', authenticate, requireAdmin, updatePrintOrderBillingValidator, updatePrintOrderBilling);
