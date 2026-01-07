import { body, param } from 'express-validator';

export const createPrintOrderValidator = [
  body('description').isString().trim().notEmpty().withMessage('Description is required'),
  body('fileLink').optional().isString().trim(),
  body('colorMode').isIn(['color', 'black_white']).withMessage('Color mode is required'),
  body('sides').isIn(['single', 'double']).withMessage('Print sides is required'),
  body('paperSize')
    .isIn(['a4', 'letter', 'photo_paper', 'passport_photo', 'stamp_photo'])
    .withMessage('Paper size is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('collectionTime')
    .isISO8601()
    .withMessage('Select a valid collection time slot'),
  body('deliveryLocation')
    .isIn(['SEU', 'AUST'])
    .withMessage('Delivery location is required'),
  body('paymentTransaction').optional().isString().trim()
];

export const updatePrintOrderStatusValidator = [
  param('id').isMongoId().withMessage('Valid print order id is required'),
  body('status')
    .isIn(['pending', 'processing', 'completed', 'cancelled'])
    .withMessage('Invalid status')
];

export const updatePrintOrderBillingValidator = [
  param('id').isMongoId().withMessage('Valid print order id is required'),
  body('billingNumber').optional().isString().trim(),
  body('billingAmount').optional().isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('billingNotes').optional().isString().trim(),
  body().custom((value) => {
    if (value.billingNumber || value.billingNotes || value.billingAmount !== undefined) {
      return true;
    }
    throw new Error('Provide billing number, amount, or notes.');
  })
];
