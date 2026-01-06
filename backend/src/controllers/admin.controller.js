import { getDashboardStats } from '../services/dashboard.service.js';
import { listOrders } from './order.controller.js';

export const getDashboard = async (req, res) => {
  const stats = await getDashboardStats();
  res.status(200).json({ stats });
};

export const getAdminOrders = (req, res, next) => {
  // Reuse existing handler for consistency
  return listOrders(req, res, next);
};
