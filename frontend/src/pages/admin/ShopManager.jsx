import { useEffect, useMemo, useState } from 'react';
import { productService } from '../../services/productService.js';
import './ShopManager.css';

const defaultProduct = {
  name: '',
  slug: '',
  basePrice: '',
  description: '',
  imageUrl: '',
  isActive: true,
  categories: []
};

export const AdminShopManagerPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [productForm, setProductForm] = useState(defaultProduct);
  const [editingProductId, setEditingProductId] = useState('');
  const [categoryForm, setCategoryForm] = useState({ name: '', slug: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [productsData, categoriesData] = await Promise.all([
        productService.getAdminProducts(),
        productService.getCategories()
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
    } catch (err) {
      setError('Failed to load products or categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleProductSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const payload = {
        name: productForm.name,
        slug: productForm.slug,
        description: productForm.description,
        basePrice: Number(productForm.basePrice),
        imageUrl: productForm.imageUrl,
        isActive: productForm.isActive,
        categories: productForm.categories
      };

      if (editingProductId) {
        await productService.updateProduct(editingProductId, payload);
      } else {
        await productService.createProduct(payload);
      }

      setProductForm(defaultProduct);
      setEditingProductId('');
      await loadData();
    } catch (err) {
      setError('Failed to save product. Please verify the form.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditProduct = (product) => {
    setEditingProductId(product._id);
    setProductForm({
      name: product.name,
      slug: product.slug,
      basePrice: product.basePrice,
      description: product.description || '',
      imageUrl: product.imageUrl || '',
      isActive: product.isActive,
      categories: product.categories?.map((category) => category._id) || []
    });
  };

  const cancelEdit = () => {
    setEditingProductId('');
    setProductForm(defaultProduct);
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    setIsSubmitting(true);
    try {
      await productService.deleteProduct(id);
      await loadData();
    } catch (err) {
      setError('Failed to delete product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCategorySubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await productService.createCategory({
        name: categoryForm.name,
        slug: categoryForm.slug
      });
      setCategoryForm({ name: '', slug: '' });
      await loadData();
    } catch (err) {
      setError('Failed to create category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm('Delete this category? Products linked will keep their reference.')) return;
    setIsSubmitting(true);
    try {
      await productService.deleteCategory(id);
      await loadData();
    } catch (err) {
      setError('Failed to delete category.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const productButtonLabel = useMemo(() => (editingProductId ? 'Update Product' : 'Add Product'), [editingProductId]);

  if (loading) {
    return <div className="admin__card">Loading shop manager...</div>;
  }

  return (
    <div className="shop-manager">
      <header>
        <h2>Shop Manager</h2>
        <p>Maintain products, pricing, and categories for the storefront.</p>
      </header>

      {error && <div className="admin__card admin__card--error">{error}</div>}

      <section className="shop-manager__grid">
        <form className="shop-manager__card" onSubmit={handleProductSubmit}>
          <h3>{editingProductId ? 'Edit Product' : 'Add New Product'}</h3>
          <label>
            Name
            <input
              value={productForm.name}
              onChange={(event) => setProductForm((prev) => ({ ...prev, name: event.target.value }))}
              required
            />
          </label>
          <label>
            Slug
            <input
              value={productForm.slug}
              onChange={(event) => setProductForm((prev) => ({ ...prev, slug: event.target.value }))}
              placeholder="business-card"
              required
            />
          </label>
          <label>
            Base price (৳)
            <input
              type="number"
              value={productForm.basePrice}
              onChange={(event) => setProductForm((prev) => ({ ...prev, basePrice: event.target.value }))}
              required
              min="0"
            />
          </label>
          <label>
            Description
            <textarea
              rows="3"
              value={productForm.description}
              onChange={(event) => setProductForm((prev) => ({ ...prev, description: event.target.value }))}
            />
          </label>
          <label>
            Image URL
            <input
              value={productForm.imageUrl}
              onChange={(event) => setProductForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
              placeholder="https://..."
            />
          </label>
          {productForm.imageUrl && (
            <div className="shop-manager__image-preview">
              <img src={productForm.imageUrl} alt={productForm.name || 'Product preview'} />
            </div>
          )}
          <label className="shop-manager__toggle">
            <span>Active on storefront</span>
            <input
              type="checkbox"
              checked={productForm.isActive}
              onChange={(event) => setProductForm((prev) => ({ ...prev, isActive: event.target.checked }))}
            />
            <div className={`shop-manager__switch ${productForm.isActive ? 'shop-manager__switch--on' : ''}`}>
              <div className="shop-manager__switch-knob" />
            </div>
          </label>
          <div className="shop-manager__actions">
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : productButtonLabel}
            </button>
            {editingProductId && (
              <button type="button" onClick={cancelEdit}>
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* Category management removed as per request */}
      </section>

      <section className="shop-manager__card">
        <h3>Existing Products</h3>
        <div className="shop-manager__table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Base price</th>
                <th>Status</th>
                <th>Updated</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product._id}>
                  <td>{product.name}</td>
                  <td>৳{product.basePrice}</td>
                  <td>{product.isActive ? 'Active' : 'Hidden'}</td>
                  <td>{new Date(product.updatedAt).toLocaleDateString()}</td>
                  <td className="shop-manager__table-actions">
                    <button type="button" onClick={() => startEditProduct(product)}>
                      Edit
                    </button>
                    <button type="button" onClick={() => deleteProduct(product._id)} disabled={isSubmitting}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
};
