import axios from 'axios';

const TOKEN_KEY = 'rc_auth_token';
const LEGACY_TOKEN_KEY = 'rc_admin_token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://rong-chapa.onrender.com/api/v1'
});

api.interceptors.request.use((config) => {
  const token =
    window.localStorage.getItem(TOKEN_KEY) || window.localStorage.getItem(LEGACY_TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export { api };
