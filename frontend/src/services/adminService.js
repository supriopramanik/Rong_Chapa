import { api } from './httpClient.js';

const getDashboard = async () => {
  const { data } = await api.get('/admin/dashboard');
  return data.stats;
};

const getCustomers = async () => {
  const { data } = await api.get('/admin/customers');
  return data;
};

export const adminService = {
  getDashboard,
  getCustomers
};
