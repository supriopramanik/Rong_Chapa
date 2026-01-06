import { body, param } from 'express-validator';

export const createOrderValidator = [
  body('customerName').isString().trim().notEmpty().withMessage('Customer name is required'),
  body('customerEmail').optional().isEmail().withMessage('Email must be valid'),
  body('customerPhone').optional().isString().trim(),
  body('product').isMongoId().withMessage('Valid product id is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('size').optional().isString().trim(),
  body('paperType').optional().isString().trim(),
  body('notes').optional().isString().trim(),
  body('shippingAddress').isString().trim().notEmpty().withMessage('Delivery address is required'),
  body('deliveryZone')
    .isIn(['dhaka', 'outside'])
    .withMessage('Delivery zone must be either dhaka or outside'),
  body('accountPassword').optional().isString().isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

export const updateOrderStatusValidator = [
  param('id').isMongoId().withMessage('Valid order id is required'),
  body('status')
    .isIn(['pending', 'processing', 'completed', 'cancelled'])
    .withMessage('Invalid status')
];

export const updateOrderBillingValidator = [
  param('id').isMongoId().withMessage('Valid order id is required'),
  body('billingNumber').optional().isString().trim().notEmpty().withMessage('Invoice number must be a string'),
  body('billingAmount').optional().isFloat({ min: 0 }).withMessage('Amount must be zero or greater'),
  body('billingNotes').optional().isString().trim(),
  body()
    .custom((value, { req }) => {
      if (
        req.body.billingNumber === undefined &&
        req.body.billingAmount === undefined &&
        req.body.billingNotes === undefined
      ) {
        throw new Error('Provide billingNumber, billingAmount, or billingNotes');
      }
      return true;
    })
    .withMessage('Provide billingNumber, billingAmount, or billingNotes')
];

export const orderCancelRequestValidator = [
  param('id').isMongoId().withMessage('Valid order id is required'),
  body('reason')
    .isString()
    .trim()
    .isLength({ min: 10 })
    .withMessage('Please share a short note (at least 10 characters).')
];

export const reviewCancelRequestValidator = [
  param('id').isMongoId().withMessage('Valid order id is required'),
  body('action').isIn(['approve', 'decline']).withMessage('Action must be approve or decline'),
  body('adminNote').optional().isString().trim()
];
