import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import './AdminLayout.css';

export const AdminLayout = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const handleNavClick = () => {
    setMenuOpen(false);
  };

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev);
  };

  return (
    <div className="admin">
      <aside className={`admin__sidebar ${isMenuOpen ? 'admin__sidebar--open' : ''}`}>
        <div className="admin__brand">Rong Chapa Admin</div>
        <nav className="admin__menu" onClick={handleNavClick}>
          <NavLink end to="/admin">
            Dashboard
          </NavLink>
          <NavLink to="/admin/print-orders">Print Orders</NavLink>
          <NavLink to="/admin/shop-orders">Shop Orders</NavLink>
          <NavLink to="/admin/shop">Shop Manager</NavLink>
        </nav>
        <button className="admin__logout" onClick={handleLogout}>
          Logout
        </button>
        <button className="admin__sidebar-close" onClick={toggleMenu} aria-label="Close menu">
          ×
        </button>
      </aside>
      {isMenuOpen && <button className="admin__overlay" onClick={toggleMenu} aria-label="Close menu" />}
      <div className="admin__content">
        <header className="admin__topbar">
          <div>
            <h1>Welcome back, {user?.name || 'Admin'}</h1>
            <p>Manage orders, products, and track performance.</p>
          </div>
          <button className="admin__menu-toggle" onClick={toggleMenu} aria-label="Toggle menu">
            <span></span>
            <span></span>
            <span></span>
          </button>
        </header>
        <main className="admin__main">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
