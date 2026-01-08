import { body } from 'express-validator';

export const registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().trim(),
  body('organization').optional().trim(),
  body('address').optional().isString().trim()
];

export const loginValidator = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

export const updateProfileValidator = [
  body('name').optional().isString().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Provide a valid email address'),
  body('phone').optional().isString().trim(),
  body('organization').optional().isString().trim(),
  body('address').optional().isString().trim(),
  body('newPassword').optional().isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  body('currentPassword').optional().isString().notEmpty(),
  body()
    .custom((value, { req }) => {
      if (
        req.body.name === undefined &&
        req.body.email === undefined &&
        req.body.phone === undefined &&
        req.body.organization === undefined &&
        req.body.address === undefined &&
        req.body.currentPassword === undefined &&
        req.body.newPassword === undefined
      ) {
        throw new Error('Provide at least one field to update');
      }
      return true;
    })
    .withMessage('Provide at least one field to update')
];
