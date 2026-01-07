import { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService.js';
import './Dashboard.css';

const formatNumber = (value) => {
  const numeric = Number(value) || 0;
  return numeric.toLocaleString('en-US');
};

const formatAmount = (value) => {
  const numeric = Number(value) || 0;
  return `Tk ${numeric.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

const STATUS_CARDS = [
  { key: 'delivered', label: 'Delivered', accent: 'success' },
  { key: 'paidReturn', label: 'Paid Return', accent: 'accent' },
  { key: 'returned', label: 'Returned', accent: 'danger' },
  { key: 'deliveryProcessing', label: 'Delivery Processing', accent: 'warning' }
];

export const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminService.getDashboard();
        setStats(data);
      } catch (err) {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="admin__card">Loading dashboard...</div>;
  }

  if (error || !stats) {
    return <div className="admin__card admin__card--error">{error || 'No dashboard data found.'}</div>;
  }

  const breakdown = stats.breakdown || {};
  const overview = stats.overview || { totalCompletedOrders: 0, totalRevenue: 0, printOrders: { completed: 0, revenue: 0 } };
  const printOverview = overview.printOrders || { completed: 0, revenue: 0 };
  const totalJobs = Number(stats.ordersCount || 0) + Number(stats.printOrdersCount || 0);
  const completionProgress = totalJobs > 0 ? Number(((overview.totalCompletedOrders / totalJobs) * 100).toFixed(2)) : 0;

  const summaryCards = [
    { label: 'Total Orders', value: stats.ordersCount, formatter: formatNumber },
    { label: 'Custom Print Requests', value: stats.printOrdersCount, formatter: formatNumber },
    { label: 'Cancelled Orders', value: stats.cancelledOrdersCount, formatter: formatNumber },
    { label: 'Print Revenue', value: printOverview.revenue, formatter: formatAmount }
  ];

  

  return (
    <div className="dashboard">
      <section className="dashboard__overview-card">
        <header className="dashboard__overview-header">
          <div>
            <h1>Overall Statistics</h1>
            <p>Live snapshot of order performance across the platform.</p>
          </div>
        </header>

        <div className="dashboard__overview-body">
          <div className="dashboard__progress" style={{ '--progress-value': completionProgress }}>
            <div className="dashboard__progress-inner">
              <span className="dashboard__progress-label">Total Value</span>
              <strong className="dashboard__progress-amount">{formatAmount(overview.totalRevenue)}</strong>
              <span className="dashboard__progress-orders">{formatNumber(overview.totalCompletedOrders)} Orders</span>
            </div>
          </div>

          <div className="dashboard__status-list">
            {STATUS_CARDS.map((card) => {
              const metric = breakdown[card.key] || { count: 0, amount: 0, percentage: 0 };

              return (
                <article key={card.key} className={`dashboard__status-card dashboard__status-card--${card.accent}`}>
                  <span className="dashboard__status-accent" aria-hidden="true" />
                  <div className="dashboard__status-meta">
                    <span className="dashboard__status-label">{card.label}</span>
                    <strong className="dashboard__status-percentage">{metric.percentage}%</strong>
                  </div>
                  <p className="dashboard__status-summary">
                    {formatNumber(metric.count)} orders
                    <span aria-hidden="true"> • </span>
                    {formatAmount(metric.amount)}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="dashboard__summary-grid">
        {summaryCards.map((card) => (
          <article key={card.label} className="dashboard__summary-card">
            <span>{card.label}</span>
            <strong>{card.formatter(card.value)}</strong>
          </article>
        ))}
      </section>

      

      <section className="dashboard__recent">
        <div className="dashboard__recent-header">
          <h2>Recent Orders</h2>
          <span>{stats.recentOrders.length > 0 ? `${stats.recentOrders.length} latest updates` : 'No recent orders'}</span>
        </div>
        <div className="dashboard__card">
          {stats.recentOrders.length === 0 && <p>No orders yet.</p>}
          {stats.recentOrders.map((order) => (
            <div key={order._id} className="dashboard__order">
              <div>
                <strong>{order.customerName}</strong>
                <span>{order.product?.name || 'Product removed'}</span>
              </div>
              <span className={`dashboard__status dashboard__status--${order.status}`}>{order.status}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
