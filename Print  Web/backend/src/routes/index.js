import express from 'express';
import { authRouter } from './auth.routes.js';
import { productRouter } from './product.routes.js';
import { orderRouter } from './order.routes.js';
import { printOrderRouter } from './printOrder.routes.js';
import { adminRouter } from './admin.routes.js';

export const apiRouter = express.Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/products', productRouter);
apiRouter.use('/orders', orderRouter);
apiRouter.use('/print-orders', printOrderRouter);
apiRouter.use('/admin', adminRouter);
