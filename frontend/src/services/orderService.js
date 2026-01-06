import { api } from './httpClient.js';

const createOrder = async (payload) => {
  const { data } = await api.post('/orders', payload);
  return data;
};

const getOrders = async () => {
  const { data } = await api.get('/orders');
  return data.orders;
};

const getMyOrders = async () => {
  const { data } = await api.get('/orders/mine');
  return data.orders;
};

const updateOrderStatus = async (id, status) => {
  const { data } = await api.patch(`/orders/${id}/status`, { status });
  return data.order;
};

const updateOrderBilling = async (id, payload) => {
  const { data } = await api.patch(`/orders/${id}/billing`, payload);
  return data.order;
};

const downloadOrderInvoice = async (id) => {
  const response = await api.get(`/orders/${id}/invoice`, { responseType: 'blob' });
  return response.data;
};

const requestCancellation = async (id, reason) => {
  const { data } = await api.post(`/orders/${id}/cancel-request`, { reason });
  return data.order;
};

const reviewCancellation = async (id, payload) => {
  const { data } = await api.patch(`/orders/${id}/cancel-request`, payload);
  return data.order;
};

export const orderService = {
  createOrder,
  getOrders,
  getMyOrders,
  updateOrderStatus,
  updateOrderBilling,
  downloadOrderInvoice,
  requestCancellation,
  reviewCancellation
};
