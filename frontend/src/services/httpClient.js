import axios from 'axios';

const TOKEN_KEY = 'rc_auth_token';
const LEGACY_TOKEN_KEY = 'rc_admin_token';

const DEFAULT_API_BASE_URL = 'https://rong-chapa.onrender.com/api/v1';

const resolveBaseUrl = () => {
  const rawUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  if (!rawUrl) {
    return DEFAULT_API_BASE_URL;
  }

  const normalizedUrl = rawUrl.replace(/\/+$/, '');

  if (/\/api\//i.test(normalizedUrl)) {
    return normalizedUrl;
  }

  return `${normalizedUrl}/api/v1`;
};

const api = axios.create({
  baseURL: resolveBaseUrl()
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
