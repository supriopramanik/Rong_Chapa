import { api } from './httpClient.js';

const submitPrintRequest = async (payload) => {
  const { data } = await api.post('/print-orders', payload);
  return data.printOrder;
};

const getPrintOrders = async () => {
  const { data } = await api.get('/print-orders');
  return data.printOrders;
};

const getMyPrintOrders = async () => {
  const { data } = await api.get('/print-orders/mine');
  return data.printOrders;
};

const updatePrintOrderStatus = async (id, status) => {
  const { data } = await api.patch(`/print-orders/${id}/status`, { status });
  return data.printOrder;
};

const updatePrintOrderBilling = async (id, payload) => {
  const { data } = await api.patch(`/print-orders/${id}/billing`, payload);
  return data.printOrder;
};

export const printService = {
  submitPrintRequest,
  getPrintOrders,
  getMyPrintOrders,
  updatePrintOrderStatus,
  updatePrintOrderBilling
};
