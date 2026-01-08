import { body, param } from 'express-validator';

const optionValidator = (field) =>
  body(field)
    .isArray({ min: 0 })
    .withMessage(`${field} must be an array`)
    .optional()
    .custom((items) => items.every((item) => typeof item.label === 'string'))
    .withMessage('Option label must be a string');

export const createProductValidator = [
  body('name').isString().trim().notEmpty().withMessage('Product name is required'),
  body('slug').isString().trim().notEmpty().withMessage('Slug is required'),
  body('basePrice').isFloat({ min: 0 }).withMessage('Base price must be positive'),
  optionValidator('sizes'),
  optionValidator('paperTypes'),
  body('quantityOptions').optional().isArray().withMessage('Quantity options must be an array'),
  body('isActive').optional().isBoolean(),
  body('categories').optional().isArray()
];

export const updateProductValidator = [
  param('id').isMongoId().withMessage('Valid product id is required'),
  body('basePrice').optional().isFloat({ min: 0 }).withMessage('Base price must be positive'),
  optionValidator('sizes'),
  optionValidator('paperTypes'),
  body('quantityOptions').optional().isArray(),
  body('isActive').optional().isBoolean()
];

export const productIdValidator = [
  param('id').isMongoId().withMessage('Valid product id is required')
];

export const updateCategoryValidator = [
  param('id').isMongoId().withMessage('Valid category id is required'),
  body('name').optional().isString().trim().notEmpty(),
  body('slug').optional().isString().trim().notEmpty()
];

export const createCategoryValidator = [
  body('name').isString().trim().notEmpty().withMessage('Category name is required'),
  body('slug').isString().trim().notEmpty().withMessage('Slug is required')
];

export const categoryIdValidator = [
  param('id').isMongoId().withMessage('Valid category id is required')
];
