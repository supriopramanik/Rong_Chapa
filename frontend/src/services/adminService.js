import { api } from './httpClient.js';

const getDashboard = async () => {
  const { data } = await api.get('/admin/dashboard');
  return data.stats;
};

export const adminService = {
  getDashboard
};
