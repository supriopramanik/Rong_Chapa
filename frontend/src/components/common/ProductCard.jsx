import { useMemo, useState } from 'react';
import './ProductCard.css';

export const ProductCard = ({ product, onPreview, onAddToCart, onOrderNow }) => {
  const [quantity, setQuantity] = useState(1);

  const basePrice = Number(product.basePrice || 0);
  const subtotal = useMemo(() => basePrice * quantity, [basePrice, quantity]);

  const increment = () => setQuantity((prev) => Math.min(prev + 1, 99));
  const decrement = () => setQuantity((prev) => Math.max(1, prev - 1));

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart({ product, quantity });
    }
  };

  const handleOrderNow = () => {
    if (onOrderNow) {
      onOrderNow({ product, quantity });
    }
  };

  return (
    <article className="product-card">
      <button
        type="button"
        className="product-card__image"
        onClick={() => onPreview && onPreview(product)}
        aria-label={`Preview ${product.name || 'product'}`}
      >
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} loading="lazy" />
        ) : (
          <span className="product-card__image-fallback">View details</span>
        )}
      </button>

      <div className="product-card__body">
        <div className="product-card__meta">
          <h3 className="product-card__title">{product.name}</h3>
          {product.description && <p className="product-card__description">{product.description}</p>}
        </div>

        <span className="product-card__price">Starting at ৳{basePrice.toFixed(2)}</span>

        <div className="product-card__quantity">
          <span>Quantity</span>
          <div className="product-card__stepper">
            <button type="button" onClick={decrement} aria-label="Decrease quantity">
              -
            </button>
            <span>{quantity}</span>
            <button type="button" onClick={increment} aria-label="Increase quantity">
              +
            </button>
          </div>
          <small>Subtotal: ৳{subtotal.toFixed(2)}</small>
        </div>

        <div className="product-card__actions">
          <button type="button" className="product-card__cart" onClick={handleAddToCart}>
            Add to cart
          </button>
          <button type="button" className="product-card__order" onClick={handleOrderNow}>
            Order now
          </button>
        </div>
      </div>
    </article>
  );
};
