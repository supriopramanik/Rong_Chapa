import { Order } from '../models/Order.js';
import { PrintOrder } from '../models/PrintOrder.js';

const sumBillingStage = {
  $sum: {
    $ifNull: ['$billing.amount', 0]
  }
};

const normalizeAmount = (value) => {
  if (typeof value === 'number') {
    return value;
  }
  if (value && typeof value.toString === 'function') {
    const parsed = Number(value.toString());
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const roundAmount = (value) => {
  const numeric = normalizeAmount(value);
  return Math.round(numeric * 100) / 100;
};

const buildStatusLookup = (collection) => {
  return collection.reduce((acc, entry) => {
    acc[entry._id] = {
      count: entry.count,
      amount: normalizeAmount(entry.amount)
    };
    return acc;
  }, {});
};

const buildMetric = (count, amount, totalOrders) => ({
  count,
  amount: roundAmount(amount),
  percentage: totalOrders > 0 ? Number(((count / totalOrders) * 100).toFixed(2)) : 0
});

export const getDashboardStats = async () => {
  const [
    ordersCount,
    printOrdersCount,
    statusAggregates,
    paidReturnAggregate,
    recentOrders,
    completedPrintOrdersAggregate
  ] = await Promise.all([
    Order.countDocuments(),
    PrintOrder.countDocuments(),
    Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          amount: sumBillingStage
        }
      }
    ]),
    Order.aggregate([
      { $match: { 'cancelRequest.status': 'approved' } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          amount: sumBillingStage
        }
      }
    ]),
    Order.find().sort({ createdAt: -1 }).limit(5).populate('product', 'name'),
    PrintOrder.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          amount: sumBillingStage,
          deposit: { $sum: { $ifNull: ['$securityAmount', 0] } }
        }
      }
    ])
  ]);

  const statusLookup = buildStatusLookup(statusAggregates);
  const delivered = statusLookup.completed || { count: 0, amount: 0 };
  const returned = statusLookup.cancelled || { count: 0, amount: 0 };
  const deliveryProcessing = statusLookup.processing || { count: 0, amount: 0 };
  const paidReturnRaw = paidReturnAggregate[0]
    ? {
        count: paidReturnAggregate[0].count,
        amount: normalizeAmount(paidReturnAggregate[0].amount)
      }
    : { count: 0, amount: 0 };
  const printOverviewRaw = completedPrintOrdersAggregate[0]
    ? {
        count: completedPrintOrdersAggregate[0].count,
        amount: normalizeAmount(completedPrintOrdersAggregate[0].amount),
        deposit: normalizeAmount(completedPrintOrdersAggregate[0].deposit)
      }
    : { count: 0, amount: 0, deposit: 0 };

  return {
    ordersCount,
    printOrdersCount,
    cancelledOrdersCount: returned.count,
    recentOrders,
    overview: {
      totalCompletedOrders: delivered.count + printOverviewRaw.count,
      totalRevenue: roundAmount(delivered.amount + printOverviewRaw.amount),
      printOrders: {
        completed: printOverviewRaw.count,
        revenue: roundAmount(printOverviewRaw.amount),
        deposit: roundAmount(printOverviewRaw.deposit)
      }
    },
    breakdown: {
      delivered: buildMetric(delivered.count, delivered.amount, ordersCount),
      paidReturn: buildMetric(paidReturnRaw.count, paidReturnRaw.amount, ordersCount),
      returned: buildMetric(returned.count, returned.amount, ordersCount),
      deliveryProcessing: buildMetric(deliveryProcessing.count, deliveryProcessing.amount, ordersCount)
    }
  };
};
