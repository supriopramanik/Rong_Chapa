import { useEffect, useState } from 'react';
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

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <h1>Hello, {user?.name || 'there'}!</h1>
        <p>Track both your custom print requests and shop purchases in one place.</p>
      </header>

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

        {!shopLoading && !shopError && shopOrders.length === 0 && (
          <div className="dashboard__empty">
            <p>You have not placed any storefront orders yet.</p>
            <Link to="/shop" className="dashboard__cta">
              Browse the shop
            </Link>
          </div>
        )}

        {!shopLoading && !shopError && shopOrders.length > 0 && (
          <div className="dashboard__table-wrapper">
            <table className="dashboard__table">
              <thead>
                <tr>
                  <th scope="col">Order</th>
                  <th scope="col">Placed</th>
                  <th scope="col">Status</th>
                  <th scope="col">Billing</th>
                </tr>
              </thead>
              <tbody>
                {shopOrders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <div className="dashboard__request">
                        <strong>{order.product?.name || 'Product removed'}</strong>
                        <span>
                          {order.quantity} pcs
                          {order.size ? ` · Size: ${order.size}` : ''}
                          {order.paperType ? ` · Paper: ${order.paperType}` : ''}
                        </span>
                        {order.notes && <span>Note: {order.notes}</span>}
                      </div>
                    </td>
                    <td>{formatDateTime(order.createdAt)}</td>
                    <td>
                      <div className="dashboard__status-block">
                        <span className={`dashboard__status dashboard__status--${order.status}`}>
                          {STATUS_LABEL[order.status] || order.status}
                        </span>
                        {order.cancelRequest?.status === 'pending' && (
                          <div className="dashboard__cancel-note">
                            <strong>Cancellation pending.</strong>
                            <span>
                              Requested {formatDateTime(order.cancelRequest.requestedAt)} · {order.cancelRequest.reason}
                            </span>
                          </div>
                        )}
                        {order.cancelRequest?.status === 'approved' && (
                          <div className="dashboard__cancel-note dashboard__cancel-note--approved">
                            <strong>Cancellation approved.</strong>
                            <span>
                              {order.cancelRequest.resolvedAt ? `Closed ${formatDateTime(order.cancelRequest.resolvedAt)}.` : 'Closed.'}
                              {order.cancelRequest.adminNote ? ` ${order.cancelRequest.adminNote}` : ''}
                            </span>
                          </div>
                        )}
                        {order.cancelRequest?.status === 'declined' && (
                          <div className="dashboard__cancel-note dashboard__cancel-note--declined">
                            <strong>Cancellation declined.</strong>
                            <span>
                              {order.cancelRequest.resolvedAt
                                ? `Reviewed ${formatDateTime(order.cancelRequest.resolvedAt)}.`
                                : 'Reviewed.'}
                              {order.cancelRequest.adminNote ? ` ${order.cancelRequest.adminNote}` : ''}
                            </span>
                          </div>
                        )}
                        {canRequestCancellation(order) && (
                          <button type="button" className="dashboard__ghost-btn" onClick={() => openCancelModal(order)}>
                            Request cancellation
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      {order.billing?.number || typeof order.billing?.amount === 'number' ? (
                        <div className="dashboard__billing">
                          {order.billing?.number && <span>Invoice: {order.billing.number}</span>}
                          {typeof order.billing?.amount === 'number' && (
                            <span>Amount: {formatCurrency(order.billing.amount)}</span>
                          )}
                          {order.billing?.notes && <span>Notes: {order.billing.notes}</span>}
                        </div>
                      ) : (
                        <span className="dashboard__billing--empty">Pending invoice</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

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
