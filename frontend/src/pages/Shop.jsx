import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { productService } from '../services/productService.js';
import { orderService } from '../services/orderService.js';
import { ProductCard } from '../components/common/ProductCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import './Shop.css';

const DELIVERY_OPTIONS = {
  dhaka: { label: 'Inside Dhaka', description: 'Delivery within Dhaka city', charge: 60 },
  outside: { label: 'Outside Dhaka', description: 'Anywhere outside Dhaka', charge: 110 }
};

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  notes: '',
  shippingAddress: '',
  deliveryZone: 'dhaka'
};

export const ShopPage = () => {
  const { isAuthenticated, user, setSession } = useAuth();
  const { items: cartItems, addItem, clearItems, total: cartTotal, updateQuantity } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [productError, setProductError] = useState('');
  const [previewProduct, setPreviewProduct] = useState(null);
  const [orderState, setOrderState] = useState({ show: false, items: [], source: null });
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await productService.getProducts();
        setProducts(data);
        setProductError('');
      } catch (err) {
        setProductError('Unable to load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const prefillForm = useCallback(
    (nextUser) => {
      const sourceUser = nextUser || user;
      setForm((prev) => {
        const savedAddress = sourceUser?.address?.trim();
        return {
          ...prev,
          name: sourceUser?.name || '',
          email: sourceUser?.email || '',
          phone: sourceUser?.phone || '',
          shippingAddress: savedAddress ?? (prev.shippingAddress || ''),
          password: '',
          notes: ''
        };
      });
    },
    [user]
  );

  const modalTotal = useMemo(
    () =>
      (orderState.items || []).reduce((sum, item) => sum + Number(item.product.basePrice || 0) * item.quantity, 0),
    [orderState.items]
  );

  const deliveryMeta = useMemo(() => DELIVERY_OPTIONS[form.deliveryZone] || DELIVERY_OPTIONS.dhaka, [form.deliveryZone]);
  const checkoutTotal = modalTotal + (deliveryMeta?.charge || 0);

  const handleAddToCart = ({ product, quantity }) => {
    addItem(product, quantity);
  };

  const openOrderModal = useCallback(
    (items, source) => {
      if (!items.length) return;
      const snapshot = items.map((item) => ({ ...item }));
      setOrderState({ show: true, items: snapshot, source });
      prefillForm();
      setOrderError('');
      setSuccessMessage('');
    },
    [prefillForm]
  );

  const handleOrderNow = useCallback(
    ({ product, quantity }) => {
      openOrderModal([{ product, quantity }], 'single');
    },
    [openOrderModal]
  );

  const handleCheckout = useCallback(() => {
    if (!cartItems.length) return;
    openOrderModal(cartItems, 'cart');
  }, [cartItems, openOrderModal]);

  const adjustOrderQuantity = useCallback(
    (productId, delta) => {
      let shouldSyncWithCart = false;
      setOrderState((prev) => {
        if (!prev.items.length) return prev;
        let changed = false;
        const updatedItems = prev.items.map((item) => {
          if (item.product._id !== productId) return item;
          const newQuantity = Math.max(1, Math.min(99, item.quantity + delta));
          if (newQuantity === item.quantity) return item;
          changed = true;
          return { ...item, quantity: newQuantity };
        });
        if (!changed) return prev;
        shouldSyncWithCart = prev.source === 'cart';
        return { ...prev, items: updatedItems };
      });

      if (shouldSyncWithCart) {
        updateQuantity(productId, delta);
      }
    },
    [updateQuantity]
  );

  useEffect(() => {
    const handleGlobalCheckout = () => {
      if (!cartItems.length || orderState.show) return;
      openOrderModal(cartItems, 'cart');
    };

    window.addEventListener('rc:open-cart-checkout', handleGlobalCheckout);
    return () => {
      window.removeEventListener('rc:open-cart-checkout', handleGlobalCheckout);
    };
  }, [cartItems, orderState.show, openOrderModal]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('checkout') === '1' && cartItems.length && !orderState.show) {
      openOrderModal(cartItems, 'cart');
      navigate('/shop', { replace: true });
    }
  }, [location.search, cartItems, orderState.show, openOrderModal, navigate]);

  const closeModal = () => {
    setOrderState({ show: false, items: [], source: null });
    setOrderError('');
    setSuccessMessage('');
    setSubmitting(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!orderState.items.length) return;
    setSubmitting(true);
    setOrderError('');
    setSuccessMessage('');
    const wasAuthenticated = isAuthenticated;
    let accountCreated = false;
    const selectedZone = form.deliveryZone || 'dhaka';
    const deliveryCharge = (DELIVERY_OPTIONS[selectedZone] || DELIVERY_OPTIONS.dhaka).charge;

    try {
      const checkoutId = `checkout-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const aggregatedAmount = Number(checkoutTotal.toFixed(2));
      for (let index = 0; index < orderState.items.length; index += 1) {
        const item = orderState.items[index];
        const payload = {
          customerName: form.name,
          customerEmail: form.email,
          customerPhone: form.phone,
          notes: form.notes,
          product: item.product._id,
          quantity: item.quantity,
          shippingAddress: form.shippingAddress,
          deliveryZone: selectedZone,
          deliveryCharge: index === 0 ? deliveryCharge : 0,
          billingAmount: aggregatedAmount,
          invoiceNumber,
          batchId: checkoutId
        };

        if (!wasAuthenticated && !accountCreated) {
          payload.accountPassword = form.password;
        }

        const response = await orderService.createOrder(payload);

        if (response.account) {
          setSession(response.account);
          accountCreated = true;
          prefillForm(response.account.user);
        }
      }

      const accountMessage = !wasAuthenticated && accountCreated
        ? ' An account has been created for you. You are now signed in.'
        : '';
      const baseMessage = `${orderState.items.length > 1 ? `${orderState.items.length} orders` : 'Order'} placed successfully. Our team will reach out soon.`;
      setSuccessMessage(`${baseMessage}${accountMessage}`);

      if (!wasAuthenticated) {
        setForm((prev) => ({ ...prev, password: '' }));
      }

      if (orderState.source === 'cart') {
        clearItems();
      }
    } catch (err) {
      const message = err?.response?.data?.message || 'Unable to submit order. Please try again.';
      setOrderError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="shop">
      <section className="shop__hero">
        <h1>Shop &amp; Checkout In Minutes</h1>
        <p>Select a product, add it to your cart, and confirm the order without juggling extra form fields.</p>
      </section>

      {loading && <p className="shop__status">Loading products from our free API... Please wait a moment...</p>}
      {productError && !loading && <p className="shop__status shop__status--error">{productError}</p>}

      <div className="shop__grid">
        {products.map((product) => (
          <ProductCard
            key={product._id}
            product={product}
            onPreview={setPreviewProduct}
            onAddToCart={handleAddToCart}
            onOrderNow={handleOrderNow}
          />
        ))}
      </div>

      {cartItems.length > 0 && (
        <button type="button" className="shop__floating-checkout" onClick={handleCheckout}>
          Checkout cart · ৳{cartTotal.toFixed(2)}
        </button>
      )}

      {orderState.show && (
        <div className="shop__modal" onClick={closeModal}>
          <div className="shop__modal-dialog" onClick={(event) => event.stopPropagation()}>
            <button className="shop__modal-close" onClick={closeModal}>
              ×
            </button>
            <h2>Confirm your order</h2>

            <table className="shop__modal-items-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {orderState.items.map((item) => (
                  <tr key={item.product._id}>
                    <td>
                      <div className="shop__modal-item-meta">
                        <div
                          className={`shop__modal-item-thumb ${item.product.imageUrl ? '' : 'shop__modal-item-thumb--placeholder'}`}
                          style={item.product.imageUrl ? { backgroundImage: `url(${item.product.imageUrl})` } : undefined}
                          aria-hidden="true"
                        />
                        <div>
                          <strong>{item.product.name}</strong>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="shop__modal-item-quantity">
                        <button
                          type="button"
                          onClick={() => adjustOrderQuantity(item.product._id, -1)}
                          disabled={item.quantity <= 1}
                          aria-label={`Decrease quantity of ${item.product.name}`}
                        >
                          -
                        </button>
                        <span>{item.quantity} pcs</span>
                        <button
                          type="button"
                          onClick={() => adjustOrderQuantity(item.product._id, 1)}
                          aria-label={`Increase quantity of ${item.product.name}`}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td>
                      <strong>৳{(Number(item.product.basePrice || 0) * item.quantity).toFixed(2)}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="shop__delivery-summary">
              <p>
                <strong>Deliver to:</strong> {form.shippingAddress || 'Add delivery address below'}
              </p>
              <p>
                {deliveryMeta.label} · Delivery charge ৳{deliveryMeta.charge.toFixed(2)}
              </p>
            </div>

            <div className="shop__modal-totals">
              <p>
                <span>Products</span>
                <strong>৳{modalTotal.toFixed(2)}</strong>
              </p>
              <p>
                <span>Delivery</span>
                <strong>৳{deliveryMeta.charge.toFixed(2)}</strong>
              </p>
              <p className="shop__modal-price">
                <span>Grand total</span>
                <strong>৳{checkoutTotal.toFixed(2)}</strong>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="shop__form">
              <label>
                Full name
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Your name"
                />
              </label>
              <label>
                Email address
                <input
                  type="email"
                  required={!isAuthenticated}
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="you@example.com"
                />
              </label>
              <label>
                Phone number
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                  placeholder="01xxxxxxxxx"
                />
              </label>
              {!isAuthenticated && (
                <label>
                  Create password
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={form.password}
                    onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                    placeholder="Minimum 6 characters"
                  />
                  <span className="shop__form-hint">Track your orders anytime with your new account.</span>
                </label>
              )}
              <label>
                Delivery address
                <textarea
                  rows="3"
                  required
                  value={form.shippingAddress}
                  onChange={(event) => setForm((prev) => ({ ...prev, shippingAddress: event.target.value }))}
                  placeholder="House, road, area details"
                />
              </label>

              <div className="shop__delivery-options">
                <p>Select delivery area</p>
                <div className="shop__delivery-grid">
                  {Object.entries(DELIVERY_OPTIONS).map(([value, option]) => (
                    <label
                      key={value}
                      className={`shop__delivery-option ${form.deliveryZone === value ? 'is-active' : ''}`}
                    >
                      <input
                        type="radio"
                        name="deliveryZone"
                        value={value}
                        checked={form.deliveryZone === value}
                        onChange={(event) => setForm((prev) => ({ ...prev, deliveryZone: event.target.value }))}
                      />
                      <div>
                        <strong>{option.label}</strong>
                        <span>{option.description}</span>
                      </div>
                      <span className="shop__delivery-charge">৳{option.charge.toFixed(0)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <label>
                Notes
                <textarea
                  rows="3"
                  value={form.notes}
                  onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                  placeholder="Delivery instructions or design reminders"
                />
              </label>

              {orderError && <p className="shop__status shop__status--error">{orderError}</p>}
              {successMessage && <p className="shop__status shop__status--success">{successMessage}</p>}

              <button type="submit" disabled={submitting} className="shop__submit">
                {submitting ? 'Submitting...' : isAuthenticated ? 'Place order' : 'Place order & create account'}
              </button>
            </form>
          </div>
        </div>
      )}

      {previewProduct && (
        <div className="shop__modal shop__modal--preview" onClick={() => setPreviewProduct(null)}>
          <div className="shop__modal-dialog" onClick={(event) => event.stopPropagation()}>
            <button className="shop__modal-close" onClick={() => setPreviewProduct(null)}>
              ×
            </button>
            <div className="shop__preview">
              {previewProduct.imageUrl && (
                <img src={previewProduct.imageUrl} alt={previewProduct.name} />
              )}
              <div>
                <h3>{previewProduct.name}</h3>
                <p>{previewProduct.description}</p>
                <span className="shop__preview-price">৳{Number(previewProduct.basePrice || 0).toFixed(2)}</span>
                <br/>
                <button
                  type="button"
                  className="shop__submit"
                  onClick={() => {
                    setPreviewProduct(null);
                    handleOrderNow({ product: previewProduct, quantity: 1 });
                  }}
                >
                  Order this product
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
