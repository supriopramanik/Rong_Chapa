import { api } from './httpClient.js';

const register = async (payload) => {
  const { data } = await api.post('/auth/register', payload);
  return data;
};

const login = async (email, password) => {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
};

const getCurrentUser = async (token) => {
  const config = token
    ? {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    : undefined;

  const { data } = await api.get('/auth/me', config);
  return data;
};

const updateProfile = async (payload) => {
  const { data } = await api.put('/auth/me', payload);
  return data;
};

export const authService = {
  register,
  login,
  getCurrentUser,
  updateProfile
};
