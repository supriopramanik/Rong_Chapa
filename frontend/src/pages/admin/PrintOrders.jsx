import { useEffect, useState } from 'react';
import { printService } from '../../services/printService.js';
import './PrintOrders.css';

const statusOptions = ['pending', 'processing', 'completed', 'cancelled'];

const formatCollectionTime = (value) => {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
};

const formatNumber = (value) => {
  const numeric = Number(value) || 0;
  return numeric.toLocaleString('en-US');
};

const formatAmount = (value) => {
  const numeric = Number(value) || 0;
  return `Tk ${numeric.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

const paperSizeLabels = {
  a4: 'A4',
  letter: 'Letter',
  photo_paper: 'Photo Paper',
  passport_photo: 'Passport Photo',
  stamp_photo: 'Stamp Photo'
};

const formatDelivery = (order) => {
  if (!order) return '—';
  const location = order.deliveryLocation || '—';
  if (location === 'OTHER') {
    const address = order.deliveryAddress?.trim();
    return address ? `Other: ${address}` : 'Other';
  }
  return location;
};

export const AdminPrintOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState('');
  const [billingModal, setBillingModal] = useState({
    open: false,
    order: null,
    values: { number: '', amount: '', notes: '' }
  });
  const [billingSaving, setBillingSaving] = useState(false);

  const loadOrders = async () => {
    try {
      const data = await printService.getPrintOrders();
      setOrders(data);
    } catch (err) {
      setError('Unable to load print orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    try {
      const updatedOrder = await printService.updatePrintOrderStatus(id, status);
      setOrders((prev) => prev.map((order) => (order._id === id ? updatedOrder : order)));
    } catch (err) {
      setError('Failed to update order status.');
    } finally {
      setUpdatingId('');
    }
  };

  const openBillingModal = (order) => {
    setBillingModal({
      open: true,
      order,
      values: {
        number: order.billing?.number || '',
        amount:
          typeof order.billing?.amount === 'number' && !Number.isNaN(order.billing.amount)
            ? order.billing.amount.toString()
            : '',
        notes: order.billing?.notes || ''
      }
    });
    setError('');
  };

  const closeBillingModal = () => {
    setBillingModal({ open: false, order: null, values: { number: '', amount: '', notes: '' } });
  };

  const handleBillingInput = (field, value) => {
    setBillingModal((prev) => ({
      ...prev,
      values: {
        ...prev.values,
        [field]: value
      }
    }));
  };

  const submitBilling = async (event) => {
    event.preventDefault();
    if (!billingModal.order) return;

    const payload = {};
    const trimmedNumber = billingModal.values.number.trim();
    const trimmedNotes = billingModal.values.notes.trim();

    if (trimmedNumber) {
      payload.billingNumber = trimmedNumber;
    }

    if (billingModal.values.amount !== '') {
      const parsedAmount = Number(billingModal.values.amount);
      if (Number.isNaN(parsedAmount)) {
        setError('Amount must be a valid number.');
        return;
      }
      payload.billingAmount = parsedAmount;
    }

    if (trimmedNotes) {
      payload.billingNotes = trimmedNotes;
    }

    if (!Object.keys(payload).length) {
      setError('Please provide invoice number, amount, or notes.');
      return;
    }

    try {
      setBillingSaving(true);
      setError('');
      const updatedOrder = await printService.updatePrintOrderBilling(billingModal.order._id, payload);
      setOrders((prev) => prev.map((order) => (order._id === updatedOrder._id ? updatedOrder : order)));
      closeBillingModal();
    } catch (err) {
      setError('Failed to save billing information.');
    } finally {
      setBillingSaving(false);
    }
  };

  const stats = orders.reduce(
    (acc, order) => {
      acc.total += 1;
      const amount = typeof order.billing?.amount === 'number' && !Number.isNaN(order.billing.amount) ? order.billing.amount : 0;
      const deposit = typeof order.securityAmount === 'number' && !Number.isNaN(order.securityAmount) ? order.securityAmount : 0;
      acc.totalBilled += amount;
      acc.totalDeposit += deposit;

      switch (order.status) {
        case 'completed':
          acc.completed += 1;
          acc.completedRevenue += amount + deposit;
          break;
        case 'processing':
          acc.processing += 1;
          break;
        case 'cancelled':
          acc.cancelled += 1;
          break;
        default:
          acc.pending += 1;
      }

      return acc;
    },
    { total: 0, pending: 0, processing: 0, completed: 0, cancelled: 0, totalBilled: 0, completedRevenue: 0, totalDeposit: 0 }
  );

  const completionProgress = stats.total > 0 ? Number(((stats.completed / stats.total) * 100).toFixed(2)) : 0;
  const totalValue = stats.totalBilled + stats.totalDeposit;

  const statusCards = [
    { key: 'completed', label: 'Completed', count: stats.completed, amount: stats.completedRevenue, accent: 'success' },
    { key: 'pending', label: 'Pending', count: stats.pending, amount: null, accent: 'accent' },
    { key: 'processing', label: 'Processing', count: stats.processing, amount: null, accent: 'warning' },
    { key: 'cancelled', label: 'Cancelled', count: stats.cancelled, amount: null, accent: 'danger' }
  ];

  if (loading) {
    return <div className="admin__card">Loading print orders...</div>;
  }

  return (
    <div className="print-orders">
      <header className="print-orders__header">
        <h2>Custom Print Requests</h2>
        <p>Review custom briefs submitted from the website.</p>
      </header>

      {error && <div className="admin__card admin__card--error">{error}</div>}

      <section className="print-orders__overview">
        <div className="print-orders__overview-card">
          <div className="print-orders__progress" style={{ '--progress-value': completionProgress }}>
            <div className="print-orders__progress-inner">
              <span className="print-orders__progress-label">Total Value</span>
              <strong className="print-orders__progress-amount">{formatAmount(totalValue)}</strong>
              <span className="print-orders__progress-orders">{formatNumber(stats.total)} Requests</span>
            </div>
          </div>

          <div className="print-orders__status-grid">
            {statusCards.map((card) => (
              <article key={card.key} className={`print-orders__status-card print-orders__status-card--${card.accent}`}>
                <span className="print-orders__status-accent" aria-hidden="true" />
                <div className="print-orders__status-meta">
                  <span>{card.label}</span>
                  <strong>{formatNumber(card.count)}</strong>
                </div>
                {card.amount !== null && <p>{formatAmount(card.amount)}</p>}
                {card.amount === null && (
                  <p>{stats.total > 0 ? Math.round((card.count / stats.total) * 100) : 0}% of requests</p>
                )}
              </article>
            ))}
          </div>
        </div>

        <div className="print-orders__summary-grid">
          <article className="print-orders__summary-card">
            <span>Total Requests</span>
            <strong>{formatNumber(stats.total)}</strong>
          </article>
          <article className="print-orders__summary-card">
            <span>Completed Revenue</span>
            <strong>{formatAmount(stats.completedRevenue)}</strong>
          </article>
          <article className="print-orders__summary-card">
            <span>Pending Requests</span>
            <strong>{formatNumber(stats.pending)}</strong>
          </article>
          <article className="print-orders__summary-card">
            <span>Processing Requests</span>
            <strong>{formatNumber(stats.processing)}</strong>
          </article>
          <article className="print-orders__summary-card">
            <span>Security Deposits</span>
            <strong>{formatAmount(stats.totalDeposit)}</strong>
          </article>
        </div>
      </section>

      <div className="print-orders__table">
        <table>
          <thead>
            <tr>
              <th style={{ width: '60px' }}>#</th>
              <th>Description</th>
              <th>Files</th>
              <th>Color</th>
              <th>Sides</th>
              <th>Paper Size</th>
              <th>Quantity</th>
              <th>Collection</th>
              <th>Delivery</th>
              <th>Payment</th>
              <th>Customer</th>
              <th>Security</th>
              <th>Billing</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, idx) => (
              <tr key={order._id}>
                <td>{idx + 1}</td>
                <td>{order.description}</td>
                <td>
                  {order.fileLink ? (
                    <a href={order.fileLink} target="_blank" rel="noreferrer">
                      View Link
                    </a>
                  ) : (
                    '—'
                  )}
                </td>
                <td>{order.colorMode === 'color' ? 'Color' : 'B & W'}</td>
                <td>{order.sides === 'double' ? 'Double' : 'Single'}</td>
                <td>{paperSizeLabels[order.paperSize] || order.paperSize || '—'}</td>
                <td>{order.quantity}</td>
                <td>{formatCollectionTime(order.collectionTime)}</td>
                <td>{formatDelivery(order)}</td>
                <td>{order.paymentTransaction || '—'}</td>
                <td>
                  {order.user ? (
                    <div className="print-orders__customer">
                      <strong>{order.user.name}</strong>
                      <span>{order.user.email}</span>
                      <span>{order.user.phone || '—'}</span>
                    </div>
                  ) : (
                    '—'
                  )}
                </td>
                <td>
                  <span className="print-orders__security">{formatAmount(order.securityAmount || 0)}</span>
                </td>
                <td>
                  {order.billing && (order.billing.number || typeof order.billing.amount === 'number' || order.billing.notes) ? (
                    <div className="print-orders__billing">
                      {order.billing.number && <span>Invoice: {order.billing.number}</span>}
                      {typeof order.billing.amount === 'number' && !Number.isNaN(order.billing.amount) && (
                        <span>Amount: Tk {order.billing.amount.toFixed(2)}</span>
                      )}
                      {order.billing.notes && <span>Notes: {order.billing.notes}</span>}
                    </div>
                  ) : (
                    <span className="print-orders__billing-empty">No billing info</span>
                  )}
                </td>
                <td>
                  <select
                    value={order.status}
                    onChange={(event) => updateStatus(order._id, event.target.value)}
                    disabled={updatingId === order._id}
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="print-orders__actions">
                  <button type="button" onClick={() => openBillingModal(order)}>
                    {order.billing ? 'Edit Bill' : 'Add Bill'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {billingModal.open && (
        <div className="print-orders__modal">
          <div className="print-orders__modal-body">
            <h4>Billing details</h4>
            <p>Set the invoice info for this custom request.</p>
            <form onSubmit={submitBilling} className="print-orders__form">
              <label>
                Invoice number
                <input
                  value={billingModal.values.number}
                  onChange={(event) => handleBillingInput('number', event.target.value)}
                  placeholder="INV-2026-001"
                />
              </label>
              <label>
                Amount (Tk)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={billingModal.values.amount}
                  onChange={(event) => handleBillingInput('amount', event.target.value)}
                />
              </label>
              <label>
                Notes
                <textarea
                  rows="3"
                  value={billingModal.values.notes}
                  onChange={(event) => handleBillingInput('notes', event.target.value)}
                />
              </label>

              <div className="print-orders__modal-actions">
                <button type="button" onClick={closeBillingModal}>
                  Cancel
                </button>
                <button type="submit" disabled={billingSaving}>
                  {billingSaving ? 'Saving...' : 'Save billing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
