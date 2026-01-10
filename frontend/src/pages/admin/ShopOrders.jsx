import { useCallback, useEffect, useMemo, useState } from 'react';
import { orderService } from '../../services/orderService.js';
import './ShopOrders.css';

const DELIVERY_RATES = {
  dhaka: 60,
  outside: 110
};

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
  const [updatingBatchId, setUpdatingBatchId] = useState('');
  const [invoiceLoadingId, setInvoiceLoadingId] = useState('');
  const [billingModal, setBillingModal] = useState({
    open: false,
    order: null,
    groupId: '',
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

  const getGroupId = (order) => order.batchId || order.billing?.number || order._id;

  const handleStatusChangeGroup = async (groupId, status) => {
    if (!groupId) return;
    setUpdatingBatchId(groupId);
    setError('');
    try {
      const targetOrders = orders.filter((order) => getGroupId(order) === groupId);
      const updatedOrders = await Promise.all(
        targetOrders.map((order) => orderService.updateOrderStatus(order._id, status))
      );
      setOrders((prev) =>
        prev.map((order) => {
          const updated = updatedOrders.find((entry) => entry._id === order._id);
          return updated || order;
        })
      );
    } catch (err) {
      setError('Could not update order status.');
    } finally {
      setUpdatingBatchId('');
    }
  };

  const openBillingModal = (order) => {
    const groupId = getGroupId(order);
    setBillingModal({
      open: true,
      order,
      groupId,
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
    setBillingModal({ open: false, order: null, groupId: '', values: { number: '', amount: '', notes: '' } });
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
      const targetOrders = orders.filter((order) => getGroupId(order) === billingModal.groupId);
      const updatedOrders = await Promise.all(
        targetOrders.map((order) => orderService.updateOrderBilling(order._id, payload))
      );
      setOrders((prev) =>
        prev.map((order) => {
          const updated = updatedOrders.find((entry) => entry._id === order._id);
          return updated || order;
        })
      );
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

  const groupedOrders = useMemo(() => {
    const map = new Map();
    orders.forEach((order) => {
      const key = getGroupId(order);
      if (!map.has(key)) {
        map.set(key, { id: key, orders: [] });
      }
      map.get(key).orders.push(order);
    });
    return Array.from(map.values());
  }, [orders]);

  const renderOrderCards = () => (
    <div className="shop-orders__list">
      {groupedOrders.map((group) => {
        const primaryOrder = group.orders[0];
        const hasBilling = primaryOrder.billing?.number || typeof primaryOrder.billing?.amount === 'number';
        const groupStatus = primaryOrder.status || 'pending';
        const deliveryZoneLabel = primaryOrder.deliveryZone === 'outside' ? 'Outside Dhaka' : 'Inside Dhaka';
        const groupDeliveryCharge = group.orders.reduce(
          (sum, order) => sum + (typeof order.deliveryCharge === 'number' ? order.deliveryCharge : 0),
          0
        );
        const deliveryChargeValue =
          groupDeliveryCharge > 0
            ? groupDeliveryCharge
            : DELIVERY_RATES[primaryOrder.deliveryZone] ?? DELIVERY_RATES.dhaka;
        const deliveryChargeText = formatAmount(deliveryChargeValue);
        const groupAmount = group.orders.reduce(
          (sum, order) => sum + Number(order.product?.basePrice || 0) * order.quantity,
          0
        );
        return (
          <article key={group.id} className="shop-orders__order-card">
            <div className="shop-orders__order-header">
              <div>
                <strong className="shop-orders__order-title">#{primaryOrder.batchId?.slice(-6) || primaryOrder._id.slice(-6)} — {primaryOrder.customerName}</strong>
                <p className="shop-orders__order-meta">{primaryOrder.shippingAddress || 'No address provided'}</p>
                <p className="shop-orders__order-zone">
                  Delivery: {deliveryZoneLabel} — {deliveryChargeText}
                </p>
              </div>
              <div className="shop-orders__order-status">
                <select
                  value={groupStatus}
                  onChange={(event) => handleStatusChangeGroup(group.id, event.target.value)}
                  disabled={updatingBatchId === group.id}
                >
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="shop-orders__order-products">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {group.orders.map((order) => (
                    <tr key={order._id}>
                      <td>
                        <div className="shop-orders__product">
                          {order.product?.imageUrl && (
                            <img src={order.product.imageUrl} alt={order.product.name} />
                          )}
                          <div>
                            <strong>{order.product?.name || 'Product removed'}</strong>
                            {order.size && <span>Size: {order.size}</span>}
                            {order.paperType && <span>Paper: {order.paperType}</span>}
                          </div>
                        </div>
                      </td>
                      <td>{order.quantity} pcs</td>
                      <td>
                        <strong>
                          ৳{(Number(order.product?.basePrice || 0) * order.quantity).toFixed(2)}
                        </strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="shop-orders__order-footer">
              <div className="shop-orders__billing">
                {primaryOrder.billing?.number && <span>Invoice: {primaryOrder.billing.number}</span>}
                <span>
                  Amount: Tk {(hasBilling ? primaryOrder.billing?.amount ?? groupAmount : groupAmount).toFixed(2)}
                </span>
                {primaryOrder.billing?.notes ? (
                  <span>Notes: {primaryOrder.billing.notes}</span>
                ) : (
                  <span className="shop-orders__billing-empty">Invoice pending</span>
                )}
              </div>
              <div className="shop-orders__actions">
                <button type="button" onClick={() => openBillingModal(primaryOrder)}>
                  {primaryOrder.billing ? 'Edit Bill' : 'Add Bill'}
                </button>
                <button
                  type="button"
                  onClick={() => handleInvoiceDownload(primaryOrder)}
                  disabled={!hasBilling || invoiceLoadingId === primaryOrder._id}
                >
                  {invoiceLoadingId === primaryOrder._id ? 'Preparing...' : 'Download PDF'}
                </button>
              </div>
            </div>
            <div className="shop-orders__cancel">
              {primaryOrder.cancelRequest?.status === 'pending' ? (
                <>
                  <div className="shop-orders__cancel-note">
                    <strong>Requested {formatDateTime(primaryOrder.cancelRequest.requestedAt)}</strong>
                    <span>{primaryOrder.cancelRequest.reason}</span>
                  </div>
                  <textarea
                    value={cancelNotes[primaryOrder._id] || ''}
                    onChange={(event) => handleCancelNoteChange(primaryOrder._id, event.target.value)}
                    placeholder="Admin note (optional)"
                  />
                  <div className="shop-orders__cancel-actions">
                    <button
                      type="button"
                      onClick={() => handleCancelDecision(primaryOrder, 'decline')}
                      disabled={cancelActionId === primaryOrder._id}
                    >
                      {cancelActionId === primaryOrder._id ? 'Working...' : 'Decline'}
                    </button>
                    <button
                      type="button"
                      className="shop-orders__cancel-approve"
                      onClick={() => handleCancelDecision(primaryOrder, 'approve')}
                      disabled={cancelActionId === primaryOrder._id}
                    >
                      {cancelActionId === primaryOrder._id ? 'Working...' : 'Approve & cancel'}
                    </button>
                  </div>
                </>
              ) : primaryOrder.cancelRequest?.status === 'approved' ? (
                <div className="shop-orders__cancel-status shop-orders__cancel-status--approved">
                  <strong>Approved</strong>
                  <span>
                    {primaryOrder.cancelRequest.resolvedAt ? formatDateTime(primaryOrder.cancelRequest.resolvedAt) : 'Resolved'}
                  </span>
                  {primaryOrder.cancelRequest.adminNote && <p>{primaryOrder.cancelRequest.adminNote}</p>}
                </div>
              ) : primaryOrder.cancelRequest?.status === 'declined' ? (
                <div className="shop-orders__cancel-status shop-orders__cancel-status--declined">
                  <strong>Declined</strong>
                  <span>
                    {primaryOrder.cancelRequest.resolvedAt ? formatDateTime(primaryOrder.cancelRequest.resolvedAt) : 'Reviewed'}
                  </span>
                  {primaryOrder.cancelRequest.adminNote && <p>{primaryOrder.cancelRequest.adminNote}</p>}
                </div>
              ) : (
                <span className="shop-orders__cancel-empty">No request</span>
              )}
            </div>
          </article>
        );
      })}
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
          renderOrderCards()
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
