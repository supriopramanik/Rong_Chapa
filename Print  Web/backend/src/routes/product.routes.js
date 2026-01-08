import express from 'express';
import {
  listProducts,
  listAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/product.controller.js';
import {
  createProductValidator,
  updateProductValidator,
  createCategoryValidator,
  updateCategoryValidator,
  categoryIdValidator,
  productIdValidator
} from '../validators/product.validators.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

export const productRouter = express.Router();

productRouter.get('/', listProducts);

productRouter.get('/categories', listCategories);

productRouter.use(authenticate, requireAdmin);

productRouter.get('/admin/all', listAdminProducts);
productRouter.post('/', createProductValidator, createProduct);
productRouter.put('/:id', updateProductValidator, updateProduct);
productRouter.delete('/:id', productIdValidator, deleteProduct);

productRouter.post('/categories', createCategoryValidator, createCategory);
productRouter.put('/categories/:id', updateCategoryValidator, updateCategory);
productRouter.delete('/categories/:id', categoryIdValidator, deleteCategory);
