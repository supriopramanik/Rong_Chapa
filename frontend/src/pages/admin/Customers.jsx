import { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService.js';
import './Dashboard.css';

const formatNumber = (n) => (Number(n) || 0).toLocaleString('en-US');

const formatDate = (value) => {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'N/A';
  return parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const AdminCustomersPage = () => {
  const [directory, setDirectory] = useState({ totalCustomers: 0, customers: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await adminService.getCustomers();
        setDirectory(data);
      } catch (e) {
        setError('Failed to load customer information.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <div className="admin__card">Loading customers...</div>;
  }

  return (
    <div className="dashboard">
      <section className="dashboard__customers">
        <div className="dashboard__customers-header">
          <div>
            <h2>Customer Directory</h2>
            <p>
              {directory.customers.length > 0
                ? `Showing latest ${directory.customers.length} of ${formatNumber(directory.totalCustomers)} customers`
                : 'No customer records to display yet.'}
            </p>
          </div>
          <span className="dashboard__customers-total">{formatNumber(directory.totalCustomers)} total</span>
        </div>

        <div className="dashboard__card dashboard__card--table">
          {error && <p className="dashboard__empty">{error}</p>}
          {!error && directory.customers.length === 0 && (
            <p className="dashboard__empty">Customers will appear here after they register.</p>
          )}
          {!error && directory.customers.length > 0 && (
            <div className="dashboard__table-wrap">
              <table className="dashboard__table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>#</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Organization</th>
                    <th>Phone</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {directory.customers.map((c, idx) => (
                    <tr key={c._id || c.id}>
                      <td>{idx + 1}</td>
                      <td>{c.name || 'Unnamed Customer'}</td>
                      <td>{c.email}</td>
                      <td>{c.organization || '-'}</td>
                      <td>{c.phone || '-'}</td>
                      <td>{formatDate(c.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
