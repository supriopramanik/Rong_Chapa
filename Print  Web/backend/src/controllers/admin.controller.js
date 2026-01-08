import { getDashboardStats } from '../services/dashboard.service.js';
import { getCustomerDirectory } from '../services/admin.service.js';
import { listOrders } from './order.controller.js';

export const getDashboard = async (req, res) => {
  const stats = await getDashboardStats();
  res.status(200).json({ stats });
};

export const getAdminOrders = (req, res, next) => {
  // Reuse existing handler for consistency
  return listOrders(req, res, next);
};

export const getCustomers = async (req, res, next) => {
  try {
    const directory = await getCustomerDirectory({ limit: req.query.limit });
    res.status(200).json(directory);
  } catch (error) {
    next(error);
  }
};
