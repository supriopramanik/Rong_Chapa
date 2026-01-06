import { validationResult } from 'express-validator';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';

export const listProducts = async (req, res) => {
  const products = await Product.find({ isActive: true }).populate('categories', 'name slug');
  res.status(200).json({ products });
};

export const listAdminProducts = async (req, res) => {
  const products = await Product.find().populate('categories', 'name slug');
  res.status(200).json({ products });
};

export const createProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: 'Validation failed', errors: errors.array() });
  }

  const { name, slug, description, basePrice, categories, sizes, paperTypes, quantityOptions, imageUrl, isActive } = req.body;

  if (categories && categories.length) {
    const existingCategories = await Category.find({ _id: { $in: categories } });
    if (existingCategories.length !== categories.length) {
      return res.status(400).json({ message: 'One or more categories do not exist' });
    }
  }

  const product = await Product.create({
    name,
    slug,
    description,
    basePrice,
    categories,
    sizes,
    paperTypes,
    quantityOptions,
    imageUrl,
    isActive
  });

  res.status(201).json({ message: 'Product created', product });
};

export const updateProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: 'Validation failed', errors: errors.array() });
  }

  const { id } = req.params;
  const update = req.body;

  const product = await Product.findByIdAndUpdate(id, update, { new: true });
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  res.status(200).json({ message: 'Product updated', product });
};

export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  const product = await Product.findByIdAndDelete(id);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  res.status(200).json({ message: 'Product deleted' });
};

export const listCategories = async (req, res) => {
  const categories = await Category.find();
  res.status(200).json({ categories });
};

export const createCategory = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: 'Validation failed', errors: errors.array() });
  }

  const category = await Category.create(req.body);
  res.status(201).json({ message: 'Category created', category });
};

export const updateCategory = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ message: 'Validation failed', errors: errors.array() });
  }

  const { id } = req.params;
  const category = await Category.findByIdAndUpdate(id, req.body, { new: true });
  if (!category) {
    return res.status(404).json({ message: 'Category not found' });
  }
  res.status(200).json({ message: 'Category updated', category });
};

export const deleteCategory = async (req, res) => {
  const { id } = req.params;
  const category = await Category.findByIdAndDelete(id);
  if (!category) {
    return res.status(404).json({ message: 'Category not found' });
  }
  res.status(200).json({ message: 'Category deleted' });
};
