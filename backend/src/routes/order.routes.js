import express from 'express';
import {
  createOrder,
  downloadOrderInvoice,
  listMyOrders,
  listOrders,
  requestOrderCancellation,
  reviewOrderCancellation,
  updateOrderBilling,
  updateOrderStatus
} from '../controllers/order.controller.js';
import {
  createOrderValidator,
  orderCancelRequestValidator,
  reviewCancelRequestValidator,
  updateOrderBillingValidator,
  updateOrderStatusValidator
} from '../validators/order.validators.js';
import { authenticate, authenticateOptional, requireAdmin } from '../middleware/auth.js';

export const orderRouter = express.Router();

orderRouter.post('/', authenticateOptional, createOrderValidator, createOrder);
orderRouter.get('/mine', authenticate, listMyOrders);
orderRouter.post('/:id/cancel-request', authenticate, orderCancelRequestValidator, requestOrderCancellation);

orderRouter.use(authenticate, requireAdmin);

orderRouter.get('/', listOrders);
orderRouter.patch('/:id/cancel-request', reviewCancelRequestValidator, reviewOrderCancellation);
orderRouter.patch('/:id/status', updateOrderStatusValidator, updateOrderStatus);
orderRouter.patch('/:id/billing', updateOrderBillingValidator, updateOrderBilling);
orderRouter.get('/:id/invoice', downloadOrderInvoice);
