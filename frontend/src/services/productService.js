import { api } from './httpClient.js';

const getProducts = async () => {
  const { data } = await api.get('/products');
  return data.products;
};

const getAdminProducts = async () => {
  const { data } = await api.get('/products/admin/all');
  return data.products;
};

const getCategories = async () => {
  const { data } = await api.get('/products/categories');
  return data.categories;
};

const createProduct = async (payload) => {
  const { data } = await api.post('/products', payload);
  return data.product;
};

const updateProduct = async (id, payload) => {
  const { data } = await api.put(`/products/${id}`, payload);
  return data.product;
};

const deleteProduct = async (id) => {
  await api.delete(`/products/${id}`);
};

const createCategory = async (payload) => {
  const { data } = await api.post('/products/categories', payload);
  return data.category;
};

const updateCategory = async (id, payload) => {
  const { data } = await api.put(`/products/categories/${id}`, payload);
  return data.category;
};

const deleteCategory = async (id) => {
  await api.delete(`/products/categories/${id}`);
};

export const productService = {
  getProducts,
  getAdminProducts,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  createCategory,
  updateCategory,
  deleteCategory
};
