import { useCallback, useEffect, useState } from 'react';
import { orderService } from '../../services/orderService.js';
import './ShopOrders.css';

const statusOptions = ['pending', 'processing', 'completed', 'cancelled'];

const statusCards = [
  { key: 'completed', label: 'Completed', accent: 'success' },
  { key: 'pending', label: 'Pending', accent: 'accent' },
  { key: 'processing', label: 'Processing', accent: 'warning' },
  { key: 'cancelled', label: 'Cancelled', accent: 'danger' }
];

const formatNumber = (value) => {
  const numeric = Number(value) || 0;
  return numeric.toLocaleString('en-US');
};

const formatAmount = (value) => {
  const numeric = Number(value) || 0;
  return `Tk ${numeric.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

const formatDateTime = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString();
};

export const AdminShopOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState('');
  const [invoiceLoadingId, setInvoiceLoadingId] = useState('');
  const [billingModal, setBillingModal] = useState({
    open: false,
    order: null,
    values: { number: '', amount: '', notes: '' }
  });
  const [billingSaving, setBillingSaving] = useState(false);
  const [cancelNotes, setCancelNotes] = useState({});
  const [cancelActionId, setCancelActionId] = useState('');

  const stats = orders.reduce(
    (acc, order) => {
      acc.total += 1;
      const amount = typeof order.billing?.amount === 'number' && !Number.isNaN(order.billing.amount) ? order.billing.amount : 0;
      acc.totalBilled += amount;

      if (order.status && acc[order.status] !== undefined) {
        acc[order.status] += 1;
      }

      return acc;
    },
    { total: 0, pending: 0, processing: 0, completed: 0, cancelled: 0, totalBilled: 0 }
  );

  const completionProgress = stats.total > 0 ? Number(((stats.completed / stats.total) * 100).toFixed(2)) : 0;
  const totalValue = stats.totalBilled;

  const loadOrders = useCallback(async (silent = false) => {
    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const ordersData = await orderService.getOrders();
      setOrders(ordersData);
      setError('');
    } catch (err) {
      setError('Failed to load shop orders.');
    } finally {
      if (silent) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleStatusChange = async (orderId, status) => {
    setUpdatingOrderId(orderId);
    setError('');
    try {
      const updatedOrder = await orderService.updateOrderStatus(orderId, status);
      setOrders((prev) => prev.map((order) => (order._id === orderId ? updatedOrder : order)));
    } catch (err) {
      setError('Could not update order status.');
    } finally {
      setUpdatingOrderId('');
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
      const updatedOrder = await orderService.updateOrderBilling(billingModal.order._id, payload);
      setOrders((prev) => prev.map((order) => (order._id === updatedOrder._id ? updatedOrder : order)));
      closeBillingModal();
    } catch (err) {
      setError('Unable to save billing details.');
    } finally {
      setBillingSaving(false);
    }
  };

  const handleInvoiceDownload = async (order) => {
    setInvoiceLoadingId(order._id);
    setError('');
    try {
      const blob = await orderService.downloadOrderInvoice(order._id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${order.billing?.number || order._id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to generate invoice PDF.');
    } finally {
      setInvoiceLoadingId('');
    }
  };

  const handleCancelNoteChange = (orderId, value) => {
    setCancelNotes((prev) => ({
      ...prev,
      [orderId]: value
    }));
  };

  const handleCancelDecision = async (order, action) => {
    if (!order) return;
    setCancelActionId(order._id);
    setError('');

    const payload = { action };
    const trimmedNote = cancelNotes[order._id]?.trim();
    if (trimmedNote) {
      payload.adminNote = trimmedNote;
    }

    try {
      const updatedOrder = await orderService.reviewCancellation(order._id, payload);
      setOrders((prev) => prev.map((row) => (row._id === updatedOrder._id ? updatedOrder : row))); 
      setCancelNotes((prev) => ({ ...prev, [order._id]: '' }));
    } catch (err) {
      setError('Unable to update cancellation request.');
    } finally {
      setCancelActionId('');
    }
  };

  const renderTable = () => (
    <div className="shop-orders__table">
      <table>
        <thead>
          <tr>
            <th>Customer</th>
            <th>Order</th>
            <th>Status</th>
            <th>Cancellation</th>
            <th>Billing</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const hasBilling = order.billing?.number || typeof order.billing?.amount === 'number';
            return (
              <tr key={order._id}>
                <td>
                  <div className="shop-orders__customer">
                    <strong>{order.customerName}</strong>
                    <span>{order.customerEmail || 'No email provided'}</span>
                    <span>{order.customerPhone || 'No phone provided'}</span>
                  </div>
                </td>
                <td>
                  <div className="shop-orders__details">
                    <span>{order.product?.name || 'Product removed'}</span>
                    <span>{order.quantity} pcs</span>
                    {order.size && <span>Size: {order.size}</span>}
                    {order.paperType && <span>Paper: {order.paperType}</span>}
                  </div>
                </td>
                <td>
                  <select
                    className="shop-orders__status"
                    value={order.status}
                    onChange={(event) => handleStatusChange(order._id, event.target.value)}
                    disabled={updatingOrderId === order._id}
                  >
                    {statusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <div className="shop-orders__cancel">
                    {order.cancelRequest?.status === 'pending' ? (
                      <>
                        <div className="shop-orders__cancel-note">
                          <strong>Requested {formatDateTime(order.cancelRequest.requestedAt)}</strong>
                          <span>{order.cancelRequest.reason}</span>
                        </div>
                        <textarea
                          value={cancelNotes[order._id] || ''}
                          onChange={(event) => handleCancelNoteChange(order._id, event.target.value)}
                          placeholder="Admin note (optional)"
                        />
                        <div className="shop-orders__cancel-actions">
                          <button
                            type="button"
                            onClick={() => handleCancelDecision(order, 'decline')}
                            disabled={cancelActionId === order._id}
                          >
                            {cancelActionId === order._id ? 'Working...' : 'Decline'}
                          </button>
                          <button
                            type="button"
                            className="shop-orders__cancel-approve"
                            onClick={() => handleCancelDecision(order, 'approve')}
                            disabled={cancelActionId === order._id}
                          >
                            {cancelActionId === order._id ? 'Working...' : 'Approve & cancel'}
                          </button>
                        </div>
                      </>
                    ) : order.cancelRequest?.status === 'approved' ? (
                      <div className="shop-orders__cancel-status shop-orders__cancel-status--approved">
                        <strong>Approved</strong>
                        <span>
                          {order.cancelRequest.resolvedAt ? formatDateTime(order.cancelRequest.resolvedAt) : 'Resolved'}
                        </span>
                        {order.cancelRequest.adminNote && <p>{order.cancelRequest.adminNote}</p>}
                      </div>
                    ) : order.cancelRequest?.status === 'declined' ? (
                      <div className="shop-orders__cancel-status shop-orders__cancel-status--declined">
                        <strong>Declined</strong>
                        <span>
                          {order.cancelRequest.resolvedAt ? formatDateTime(order.cancelRequest.resolvedAt) : 'Reviewed'}
                        </span>
                        {order.cancelRequest.adminNote && <p>{order.cancelRequest.adminNote}</p>}
                      </div>
                    ) : (
                      <span className="shop-orders__cancel-empty">No request</span>
                    )}
                  </div>
                </td>
                <td>
                  {hasBilling ? (
                    <div className="shop-orders__billing">
                      {order.billing?.number && <span>Invoice: {order.billing.number}</span>}
                      {typeof order.billing?.amount === 'number' && (
                        <span>Amount: Tk {order.billing.amount.toFixed(2)}</span>
                      )}
                      {order.billing?.notes && <span>Notes: {order.billing.notes}</span>}
                    </div>
                  ) : (
                    <span className="shop-orders__billing-empty">No billing info</span>
                  )}
                </td>
                <td className="shop-orders__actions">
                  <button type="button" onClick={() => openBillingModal(order)}>
                    {order.billing ? 'Edit Bill' : 'Add Bill'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInvoiceDownload(order)}
                    disabled={!hasBilling || invoiceLoadingId === order._id}
                  >
                    {invoiceLoadingId === order._id ? 'Preparing...' : 'Download PDF'}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="shop-orders">
      <header className="shop-orders__intro">
        <h2>Shop Orders</h2>
        <p>Review storefront purchases, update their status, and hand customers a clean invoice.</p>
      </header>

      <section className="shop-orders__overview">
        <div className="shop-orders__overview-card">
          <div className="shop-orders__progress" style={{ '--progress-value': completionProgress }}>
            <div className="shop-orders__progress-inner">
              <span className="shop-orders__progress-label">Total Value</span>
              <strong className="shop-orders__progress-amount">{formatAmount(totalValue)}</strong>
              <span className="shop-orders__progress-orders">{formatNumber(stats.total)} Requests</span>
            </div>
          </div>

          <div className="shop-orders__status-grid">
            {statusCards.map((card) => {
              const count = stats[card.key] || 0;
              const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;

              return (
                <article key={card.key} className={`shop-orders__status-card shop-orders__status-card--${card.accent}`}>
                  <span className="shop-orders__status-accent" aria-hidden="true" />
                  <div className="shop-orders__status-meta">
                    <span>{card.label}</span>
                    <strong>{formatNumber(count)}</strong>
                  </div>
                  <p>{percentage}% of requests</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="shop-orders__card">
        <div className="shop-orders__toolbar">
          <div>
            <h3>Incoming orders</h3>
            <p>Customer details, fulfillment steps, and billing in one place.</p>
          </div>
          <button type="button" onClick={() => loadOrders(true)} disabled={refreshing}>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {error && <div className="shop-orders__alert">{error}</div>}

        {loading ? (
          <p className="shop-orders__empty">Loading orders...</p>
        ) : orders.length === 0 ? (
          <p className="shop-orders__empty">No shop orders yet.</p>
        ) : (
          renderTable()
        )}
      </section>

      {billingModal.open && (
        <div className="shop-orders__modal">
          <div className="shop-orders__modal-body">
            <h4>Billing details</h4>
            <p>Set the invoice info for {billingModal.order?.customerName}.</p>
            <form onSubmit={submitBilling} className="shop-orders__modal-form">
              <label>
                Invoice number
                <input
                  value={billingModal.values.number}
                  onChange={(event) => handleBillingInput('number', event.target.value)}
                  placeholder="INV-2024-001"
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

              <div className="shop-orders__modal-actions">
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
