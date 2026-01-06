import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService.js';

const AuthContext = createContext();

const TOKEN_KEY = 'rc_auth_token';
const LEGACY_TOKEN_KEY = 'rc_admin_token';

const readStoredToken = () => {
  if (typeof window === 'undefined') return null;
  const current = window.localStorage.getItem(TOKEN_KEY);
  if (current) return current;
  const legacy = window.localStorage.getItem(LEGACY_TOKEN_KEY);
  if (legacy) {
    window.localStorage.setItem(TOKEN_KEY, legacy);
    window.localStorage.removeItem(LEGACY_TOKEN_KEY);
  }
  return legacy || null;
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => readStoredToken());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(readStoredToken()));

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setUser(null);
      return;
    }

    let isSubscribed = true;

    const fetchProfile = async () => {
      try {
        const profile = await authService.getCurrentUser(token);
        if (!isSubscribed) return;
        setUser(profile.user);
      } catch (error) {
        if (!isSubscribed) return;
        logout();
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      isSubscribed = false;
    };
  }, [token]);

  const persistToken = (value) => {
    window.localStorage.setItem(TOKEN_KEY, value);
    window.localStorage.removeItem(LEGACY_TOKEN_KEY);
    setToken(value);
  };

  const login = async (email, password) => {
    const response = await authService.login(email, password);
    persistToken(response.token);
    setUser(response.user);
    return response.user;
  };

  const register = async (form) => {
    const response = await authService.register(form);
    persistToken(response.token);
    setUser(response.user);
    return response.user;
  };

  const updateProfile = async (form) => {
    const response = await authService.updateProfile(form);
    if (response.token) {
      persistToken(response.token);
    }
    setUser(response.user);
    return response.user;
  };

  const setSession = (payload) => {
    if (!payload?.token || !payload?.user) {
      return;
    }
    persistToken(payload.token);
    setUser(payload.user);
  };

  const logout = () => {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(LEGACY_TOKEN_KEY);
    setToken(null);
    setUser(null);
    setLoading(false);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      login,
      register,
      updateProfile,
      setSession,
      logout,
      loading,
      isAuthenticated: Boolean(token && user),
      isAdmin: user?.role === 'admin',
      isCustomer: user?.role === 'customer'
    }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
