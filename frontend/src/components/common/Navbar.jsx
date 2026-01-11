import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import './Navbar.css';

export const Navbar = () => {
  const { isAuthenticated, isCustomer, isAdmin, user, logout } = useAuth();
  const { items: cartItems, total: cartTotal, totalQuantity, removeItem, updateQuantity } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const cartRef = useRef(null);

  const toggle = () => setOpen((prev) => !prev);
  const close = () => {
    setOpen(false);
    setCartOpen(false);
  };
  const handleLogout = () => {
    logout();
    close();
  };

  const greeting = user?.name?.split(' ')[0] || 'Guest';

  const showAdminLink = isAdmin || !isAuthenticated;
  const cartCount = totalQuantity;

  const handleCartToggle = () => {
    setCartOpen((prev) => !prev);
  };

  const closeCartPanel = () => {
    setCartOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cartRef.current && !cartRef.current.contains(event.target)) {
        setCartOpen(false);
      }
    };

    if (cartOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [cartOpen]);

  const handleCheckoutCTA = () => {
    if (!cartItems.length) {
      close();
      navigate('/shop');
      return;
    }

    if (location.pathname === '/shop') {
      window.dispatchEvent(new CustomEvent('rc:open-cart-checkout'));
      close();
      return;
    }

    close();
    navigate('/shop?checkout=1');
  };

  return (
    <header className="navbar">
      <div className="navbar__container">
        <Link to="/" className="navbar__brand" onClick={close}>
          <span className="navbar__brand-en">Rong Chapa</span>
          <span className="navbar__brand-bn">রং ছাপা</span>
        </Link>
        <button className="navbar__toggle" onClick={toggle} aria-label="Toggle navigation">
          <span />
          <span />
          <span />
        </button>
        <nav className={`navbar__links ${open ? 'navbar__links--open' : ''}`}>
          <NavLink to="/" onClick={close}>
            Home
          </NavLink>
          <NavLink to="/shop" onClick={close}>
            Shop
          </NavLink>
          <NavLink to="/print" onClick={close}>
            Custom Print
          </NavLink>
          <NavLink to="/about" onClick={close}>
            About
          </NavLink>
          {isCustomer && (
            <NavLink to="/dashboard" onClick={close}>
              My Profile
            </NavLink>
          )}
          <div className="navbar__cart" ref={cartRef}>
            <button
              type="button"
              className="navbar__cart-button"
              onClick={handleCartToggle}
              aria-haspopup="true"
              aria-expanded={cartOpen}
            >
              Cart
              {cartCount > 0 && <span className="navbar__cart-count">{cartCount}</span>}
            </button>
            {cartOpen && (
              <div className="navbar__cart-panel">
                <div className="navbar__cart-header">
                  <span>Cart summary</span>
                  <button
                    type="button"
                    className="navbar__cart-close"
                    onClick={closeCartPanel}
                    aria-label="Close cart preview"
                  >
                    ×
                  </button>
                </div>
                {cartItems.length === 0 ? (
                  <p className="navbar__cart-empty">Your cart is empty.</p>
                ) : (
                  <>
                    <ul className="navbar__cart-list">
                      {cartItems.map((item) => (
                        <li key={item.product._id}>
                          <div
                            className="navbar__cart-thumb"
                            aria-label={`Thumbnail for ${item.product.name}`}
                          >
                            {item.product.imageUrl ? (
                              <img
                                src={item.product.imageUrl}
                                alt={`Thumbnail of ${item.product.name}`}
                                loading="lazy"
                              />
                            ) : (
                              <span className="navbar__cart-thumb-fallback" />
                            )}
                          </div>
                          <div className="navbar__cart-details">
                            <div>
                              <strong>{item.product.name}</strong>
                              <span>
                                ৳{Number(item.product.basePrice || 0).toFixed(2)} × {item.quantity}
                              </span>
                            </div>
                            <div className="navbar__cart-controls">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.product._id, -1)}
                                aria-label={`Decrease ${item.product.name} quantity`}
                              >
                                -
                              </button>
                              <span>{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.product._id, 1)}
                                aria-label={`Increase ${item.product.name} quantity`}
                              >
                                +
                              </button>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="navbar__cart-remove"
                            onClick={() => removeItem(item.product._id)}
                            aria-label={`Remove ${item.product.name} from cart`}
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                    <div className="navbar__cart-total">
                      <span>Total</span>
                      <strong>৳{cartTotal.toFixed(2)}</strong>
                    </div>
                    <button type="button" className="navbar__cart-cta" onClick={handleCheckoutCTA}>
                      Confirm order
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="navbar__auth">
            {isAuthenticated ? (
              <>
                <span className="navbar__user">Hi, {greeting}</span>
                <button type="button" className="navbar__logout" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className="navbar__auth-link" onClick={close}>
                  Sign In
                </NavLink>
                <NavLink to="/register" className="navbar__cta" onClick={close}>
                  Join
                </NavLink>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};
