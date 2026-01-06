import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import './Login.css';

export const AdminLoginPage = () => {
  const { login, isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);

  if (authLoading) {
    return <div className="admin-login__loading">Authenticating...</div>;
  }

  if (isAuthenticated) {
    if (isAdmin) {
      const redirectPath = location.state?.from?.pathname || '/admin';
      return <Navigate to={redirectPath} replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const loggedInUser = await login(form.email, form.password);
      if (loggedInUser.role !== 'admin') {
        setError('You are not authorized for the admin dashboard.');
        return;
      }
    } catch (err) {
      setError('Invalid credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login__card">
        <h1>Rong Chapa Admin</h1>
        <p>Sign in with your admin credentials to access the dashboard.</p>

        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              required
            />
          </label>

          {error && <div className="admin-login__error">{error}</div>}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};
