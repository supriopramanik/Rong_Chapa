import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { printService } from '../services/printService.js';
import { orderService } from '../services/orderService.js';
import './Dashboard.css';

const STATUS_LABEL = {
  pending: 'Pending review',
  processing: 'In production',
  completed: 'Completed',
  cancelled: 'Cancelled'
};

const PAPER_LABEL = {
  a4: 'A4',
  letter: 'Letter',
  photo_paper: 'Photo Paper',
  passport_photo: 'Passport Photo',
  stamp_photo: 'Stamp Photo'
};

const formatDateTime = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatCurrency = (value) => {
  if (typeof value !== 'number') return 'Tk 0.00';
  return `Tk ${value.toFixed(2)}`;
};

const getShopOrderGroupId = (order) => order.batchId || order.billing?.number || order._id;

const DASHBOARD_TABS = [
  { id: 'profile', label: 'Profile settings' },
  { id: 'orders', label: 'Order progress' }
];

export const UserDashboardPage = () => {
  const { user, updateProfile: updateProfileAction } = useAuth();
  const [printOrders, setPrintOrders] = useState([]);
  const [shopOrders, setShopOrders] = useState([]);
  const [printLoading, setPrintLoading] = useState(true);
  const [shopLoading, setShopLoading] = useState(true);
  const [printError, setPrintError] = useState('');
  const [shopError, setShopError] = useState('');
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    organization: user?.organization || '',
    address: user?.address || '',
    currentPassword: '',
    newPassword: ''
  });
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
  const [cancelModal, setCancelModal] = useState({ open: false, order: null, reason: '' });
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [cancelAlert, setCancelAlert] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState(DASHBOARD_TABS[0].id);

  useEffect(() => {
    setProfileForm((prev) => ({
      ...prev,
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      organization: user?.organization || '',
      address: user?.address || ''
    }));
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    const fetchOrders = async () => {
      try {
        const data = await printService.getMyPrintOrders();
        if (!isMounted) return;
        setPrintOrders(data);
      } catch (fetchError) {
        if (!isMounted) return;
        setPrintError('Unable to load your print requests right now.');
      } finally {
        if (isMounted) {
          setPrintLoading(false);
        }
      }
    };

    fetchOrders();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchShopOrders = async () => {
      try {
        const data = await orderService.getMyOrders();
        if (!isMounted) return;
        setShopOrders(data);
      } catch (fetchError) {
        if (!isMounted) return;
        setShopError('Unable to load your shop purchases right now.');
      } finally {
        if (isMounted) {
          setShopLoading(false);
        }
      }
    };

    fetchShopOrders();

    return () => {
      isMounted = false;
    };
  }, []);

  const combinedOrders = [...printOrders, ...shopOrders];
  const totalOrders = combinedOrders.length;
  const completedOrders = combinedOrders.filter((order) => order.status === 'completed').length;
  const activeOrders = combinedOrders.filter((order) => order.status === 'pending' || order.status === 'processing').length;

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setProfileMessage({ type: '', text: '' });

    if (!profileForm.name.trim() || !profileForm.email.trim()) {
      setProfileMessage({ type: 'error', text: 'Name and email are required.' });
      return;
    }

    if ((profileForm.currentPassword && !profileForm.newPassword) || (!profileForm.currentPassword && profileForm.newPassword)) {
      setProfileMessage({ type: 'error', text: 'Provide both current and new password to change it.' });
      return;
    }

    if (profileForm.newPassword && profileForm.newPassword.length < 6) {
      setProfileMessage({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }

    setProfileSubmitting(true);

    try {
      const payload = {
        name: profileForm.name.trim(),
        email: profileForm.email.trim(),
        phone: profileForm.phone?.trim() || '',
        organization: profileForm.organization?.trim() || '',
        address: profileForm.address?.trim() || ''
      };

      if (profileForm.currentPassword) {
        payload.currentPassword = profileForm.currentPassword;
      }

      if (profileForm.newPassword) {
        payload.newPassword = profileForm.newPassword;
      }

      await updateProfileAction(payload);
      setProfileMessage({ type: 'success', text: 'Profile updated successfully.' });
      setProfileForm((prev) => ({ ...prev, currentPassword: '', newPassword: '' }));
    } catch (error) {
      const message = error?.response?.data?.message || 'Unable to update your profile right now.';
      setProfileMessage({ type: 'error', text: message });
    } finally {
      setProfileSubmitting(false);
    }
  };

  const canRequestCancellation = (order) => {
    if (!order) return false;
    if (order.status === 'completed' || order.status === 'cancelled') {
      return false;
    }
    return order.cancelRequest?.status !== 'pending';
  };

  const groupedShopOrders = useMemo(() => {
    const map = new Map();
    shopOrders.forEach((order) => {
      const key = getShopOrderGroupId(order);
      if (!map.has(key)) {
        map.set(key, { id: key, orders: [] });
      }
      map.get(key).orders.push(order);
    });
    return Array.from(map.values());
  }, [shopOrders]);

  const openCancelModal = (order) => {
    if (!order) return;
    setCancelModal({ open: true, order, reason: '' });
    setCancelError('');
  };

  const closeCancelModal = () => {
    setCancelModal({ open: false, order: null, reason: '' });
    setCancelError('');
  };

  const handleCancelSubmit = async (event) => {
    event.preventDefault();
    if (!cancelModal.order) return;
    const reason = cancelModal.reason.trim();

    if (reason.length < 10) {
      setCancelError('Please explain why you want to cancel (at least 10 characters).');
      return;
    }

    setCancelSubmitting(true);
    setCancelError('');

    try {
      const updatedOrder = await orderService.requestCancellation(cancelModal.order._id, reason);
      setShopOrders((prev) => prev.map((order) => (order._id === updatedOrder._id ? updatedOrder : order)));
      setCancelAlert({ type: 'success', text: 'Cancellation request submitted. Our team will review it shortly.' });
      closeCancelModal();
    } catch (error) {
      const message = error?.response?.data?.message || 'Unable to submit your request right now.';
      setCancelError(message);
    } finally {
      setCancelSubmitting(false);
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <h1>Hello, {user?.name || 'there'}!</h1>
        <p>Track both your custom print requests and shop purchases in one place.</p>
      </header>

      <section className="dashboard__submenu" aria-label="Dashboard navigation">
        {DASHBOARD_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`dashboard__submenu-button ${activeTab === tab.id ? 'dashboard__submenu-button--active' : ''}`}
            onClick={() => handleTabChange(tab.id)}
            aria-pressed={activeTab === tab.id}
          >
            {tab.label}
          </button>
        ))}
      </section>

      {activeTab === 'profile' && (
        <section className="dashboard__profile">
        <div className="dashboard__profile-head">
          <div>
            <h2>Account details</h2>
            <p>Update your personal information and password in one place.</p>
          </div>
        </div>

        <form className="dashboard__profile-form" onSubmit={handleProfileSubmit}>
          <div className="dashboard__profile-grid">
            <label>
              Full name
              <input
                type="text"
                name="name"
                required
                value={profileForm.name}
                onChange={handleProfileChange}
                placeholder="Your name"
                autoComplete="name"
              />
            </label>
            <label>
              Email address
              <input
                type="email"
                name="email"
                required
                value={profileForm.email}
                onChange={handleProfileChange}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </label>
            <label>
              Phone number
              <input
                type="tel"
                name="phone"
                value={profileForm.phone}
                onChange={handleProfileChange}
                placeholder="01xxxxxxxxx"
                autoComplete="tel"
              />
            </label>
            <label>
              Organization / Company
              <input
                type="text"
                name="organization"
                value={profileForm.organization}
                onChange={handleProfileChange}
                placeholder="Business name (optional)"
                autoComplete="organization"
              />
            </label>
          </div>

          <div className="dashboard__profile-address">
            <div>
              <h3>Delivery address</h3>
              <p>Save a default delivery location for quicker checkout.</p>
            </div>
            <label>
              Street & area
              <textarea
                name="address"
                value={profileForm.address}
                onChange={handleProfileChange}
                placeholder="House / road, area, city"
                rows={3}
                autoComplete="street-address"
              />
              <span className="dashboard__profile-hint">We use this address as the default shipping location during checkout.</span>
            </label>
          </div>

          <div className="dashboard__profile-grid dashboard__profile-grid--two">
            <label>
              Current password
              <input
                type="password"
                name="currentPassword"
                value={profileForm.currentPassword}
                onChange={handleProfileChange}
                placeholder="Required when changing password"
                autoComplete="current-password"
              />
            </label>
            <label>
              New password
              <input
                type="password"
                name="newPassword"
                value={profileForm.newPassword}
                onChange={handleProfileChange}
                placeholder="Minimum 6 characters"
                autoComplete="new-password"
                minLength={6}
              />
              <span className="dashboard__profile-hint">Leave both password fields blank to keep your current password.</span>
            </label>
          </div>

          {profileMessage.text && (
            <p className={`dashboard__profile-status dashboard__profile-status--${profileMessage.type}`}>
              {profileMessage.text}
            </p>
          )}

          <div className="dashboard__profile-actions">
            <button type="submit" disabled={profileSubmitting}>
              {profileSubmitting ? 'Saving changes...' : 'Save changes'}
            </button>
          </div>
        </form>
        </section>
      )}

      {activeTab === 'orders' && (
        <>
          <section className="dashboard__summary">
        <div className="dashboard__metric">
          <span>Total requests</span>
          <strong>{totalOrders}</strong>
        </div>
        <div className="dashboard__metric">
          <span>In progress</span>
          <strong>{activeOrders}</strong>
        </div>
        <div className="dashboard__metric">
          <span>Completed</span>
          <strong>{completedOrders}</strong>
        </div>
          </section>

          <section className="dashboard__orders">
        <div className="dashboard__orders-head">
          <h2>Your custom requests</h2>
          <Link to="/print" className="dashboard__cta">
            New request
          </Link>
        </div>

        {printLoading && <div className="dashboard__loading">Loading your requests...</div>}
        {printError && !printLoading && <div className="dashboard__error">{printError}</div>}

        {!printLoading && !printError && printOrders.length === 0 && (
          <div className="dashboard__empty">
            <p>You have not submitted any custom print requests yet.</p>
            <Link to="/print" className="dashboard__cta">
              Submit your first request
            </Link>
          </div>
        )}

        {!printLoading && !printError && printOrders.length > 0 && (
          <div className="dashboard__table-wrapper">
            <table className="dashboard__table">
              <thead>
                <tr>
                  <th scope="col">Request</th>
                  <th scope="col">Submitted</th>
                  <th scope="col">Collection</th>
                  <th scope="col">Billing</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {printOrders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <div className="dashboard__request">
                        <strong>{order.description || 'Custom request'}</strong>
                        <span>
                          {order.colorMode === 'color' ? 'Full color' : 'Black & White'} ·{' '}
                          {PAPER_LABEL[order.paperSize] || order.paperSize?.toUpperCase()}
                        </span>
                        <span>{order.quantity} copies</span>
                        {order.deliveryLocation && (
                          <span>Pickup: {order.deliveryLocation}</span>
                        )}
                      </div>
                    </td>
                    <td>{formatDateTime(order.createdAt)}</td>
                    <td>{formatDateTime(order.collectionTime)}</td>
                    <td>
                      {typeof order.billing?.amount === 'number' && !Number.isNaN(order.billing.amount) ? (
                        <div className="dashboard__billing">
                          <strong>{formatCurrency(order.billing.amount)}</strong>
                          <span className="dashboard__billing-note">Please pay after receiving the delivery.</span>
                          {order.billing?.notes && <span>{order.billing.notes}</span>}
                          {order.billing?.number && <span>Invoice: {order.billing.number}</span>}
                        </div>
                      ) : (
                        <span className="dashboard__billing--empty">Awaiting billing</span>
                      )}
                    </td>
                    <td>
                      <span className={`dashboard__status dashboard__status--${order.status}`}>
                        {STATUS_LABEL[order.status] || order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
          </section>

          <section className="dashboard__orders">
        <div className="dashboard__orders-head">
          <h2>Your shop orders</h2>
          <Link to="/shop" className="dashboard__cta">
            Shop again
          </Link>
        </div>

        {shopLoading && <div className="dashboard__loading">Loading your shop orders...</div>}
        {shopError && !shopLoading && <div className="dashboard__error">{shopError}</div>}
        {cancelAlert.text && (
          <div className={`dashboard__alert dashboard__alert--${cancelAlert.type}`}>
            {cancelAlert.text}
          </div>
        )}

        {!shopLoading && !shopError && groupedShopOrders.length === 0 && (
          <div className="dashboard__empty">
            <p>You have not placed any storefront orders yet.</p>
            <Link to="/shop" className="dashboard__cta">
              Browse the shop
            </Link>
          </div>
        )}

        {!shopLoading && !shopError && groupedShopOrders.length > 0 && (
          <div className="dashboard__shop-list">
            {groupedShopOrders.map((group) => {
              const primary = group.orders[0];
              const baseTotal = group.orders.reduce(
                (sum, order) => sum + Number(order.product?.basePrice || 0) * order.quantity,
                0
              );
              const deliveryTotal = group.orders.reduce(
                (sum, order) => sum + (typeof order.deliveryCharge === 'number' ? order.deliveryCharge : 0),
                0
              );
              const deliveryAmount = deliveryTotal > 0 ? deliveryTotal : primary.deliveryZone === 'outside' ? 110 : 60;
              const totalAmount = baseTotal + deliveryAmount;
              const billingAmount =
                typeof primary.billing?.amount === 'number' ? primary.billing.amount : totalAmount;
              const formattedDeliveryZone = primary.deliveryZone === 'outside' ? 'Outside Dhaka' : 'Inside Dhaka';
              return (
                <article key={group.id} className="dashboard__shop-card">
                  <div className="dashboard__shop-card-header">
                    <div>
                      <strong>
                        #{primary.batchId?.slice(-6) || primary._id.slice(-6)} — {primary.customerName || user?.name || 'You'}
                      </strong>
                      <p className="dashboard__shop-card-subtitle">
                        {primary.shippingAddress || 'Shipping address not set'}
                      </p>
                      <p className="dashboard__shop-card-meta">
                        {formatDateTime(primary.createdAt)} · Delivery: {formattedDeliveryZone} ·{' '}
                        {formatCurrency(deliveryAmount)}
                      </p>
                    </div>
                    <span className={`dashboard__status dashboard__status--${primary.status}`}>
                      {STATUS_LABEL[primary.status] || primary.status}
                    </span>
                  </div>
                  <div className="dashboard__shop-card-products">
                    {group.orders.map((order) => (
                      <div key={order._id} className="dashboard__shop-card-product">
                        <div
                          className={`dashboard__shop-card-thumb ${order.product?.imageUrl ? '' : 'dashboard__shop-card-thumb--placeholder'}`}
                          style={order.product?.imageUrl ? { backgroundImage: `url(${order.product.imageUrl})` } : undefined}
                          aria-hidden="true"
                        />
                        <div className="dashboard__shop-card-product-info">
                          <strong>{order.product?.name || 'Product removed'}</strong>
                          <div className="dashboard__shop-card-tags">
                            {order.size && <span>Size: {order.size}</span>}
                            {order.paperType && <span>Paper: {order.paperType}</span>}
                            {order.notes && <span>Note: {order.notes}</span>}
                          </div>
                        </div>
                        <div className="dashboard__shop-card-product-meta">
                          <span>{order.quantity} pcs</span>
                          <span>{formatCurrency(Number(order.product?.basePrice || 0) * order.quantity)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="dashboard__status-block">
                    {primary.cancelRequest?.status === 'pending' && (
                      <div className="dashboard__cancel-note">
                        <strong>Cancellation pending.</strong>
                        <span>
                          Requested {formatDateTime(primary.cancelRequest.requestedAt)} · {primary.cancelRequest.reason}
                        </span>
                      </div>
                    )}
                    {primary.cancelRequest?.status === 'approved' && (
                      <div className="dashboard__cancel-note dashboard__cancel-note--approved">
                        <strong>Cancellation approved.</strong>
                        <span>
                          {primary.cancelRequest.resolvedAt
                            ? `Closed ${formatDateTime(primary.cancelRequest.resolvedAt)}.`
                            : 'Closed.'}
                          {primary.cancelRequest.adminNote ? ` ${primary.cancelRequest.adminNote}` : ''}
                        </span>
                      </div>
                    )}
                    {primary.cancelRequest?.status === 'declined' && (
                      <div className="dashboard__cancel-note dashboard__cancel-note--declined">
                        <strong>Cancellation declined.</strong>
                        <span>
                          {primary.cancelRequest.resolvedAt
                            ? `Reviewed ${formatDateTime(primary.cancelRequest.resolvedAt)}.`
                            : 'Reviewed.'}
                          {primary.cancelRequest.adminNote ? ` ${primary.cancelRequest.adminNote}` : ''}
                        </span>
                      </div>
                    )}
                    {canRequestCancellation(primary) && (
                      <button type="button" className="dashboard__ghost-btn" onClick={() => openCancelModal(primary)}>
                        Request cancellation
                      </button>
                    )}
                  </div>
                  <div className="dashboard__shop-card-footer">
                    {primary.billing?.number && <span>Invoice: {primary.billing.number}</span>}
                    <span>Total: {formatCurrency(billingAmount)}</span>
                    {primary.billing?.notes && <span>{primary.billing.notes}</span>}
                  </div>
                </article>
              );
            })}
          </div>
        )}
          </section>
        </>
      )}

      {cancelModal.open && (
        <div className="dashboard__modal">
          <div className="dashboard__modal-card">
            <button type="button" className="dashboard__modal-close" onClick={closeCancelModal}>
              ×
            </button>
            <h3>Request cancellation</h3>
            <p>Share why you need to cancel this order. Our admin team will review the note before taking action.</p>
            <form onSubmit={handleCancelSubmit} className="dashboard__modal-form">
              <label>
                Reason for cancelling
                <textarea
                  rows="4"
                  value={cancelModal.reason}
                  onChange={(event) => setCancelModal((prev) => ({ ...prev, reason: event.target.value }))}
                  placeholder="Example: Ordered the wrong size. Please stop production."
                />
              </label>
              {cancelError && <p className="dashboard__modal-alert">{cancelError}</p>}
              <div className="dashboard__modal-actions">
                <button type="button" onClick={closeCancelModal}>
                  Keep order
                </button>
                <button type="submit" disabled={cancelSubmitting}>
                  {cancelSubmitting ? 'Sending request...' : 'Send request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
