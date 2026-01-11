import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { printService } from '../services/printService.js';
import './PrintRequest.css';

const COLLECTION_SLOT_DAYS = 5;

const COLLECTION_WINDOWS = {
  // Friday
  5: [
    { startHour: 8, startMinute: 0, endHour: 12, endMinute: 0 },
    { startHour: 16, startMinute: 0, endHour: 17, endMinute: 0 }
  ],
  // Saturday
  6: [{ startHour: 13, startMinute: 30, endHour: 17, endMinute: 30 }]
};

const DEFAULT_COLLECTION_WINDOWS = [{ startHour: 13, startMinute: 0, endHour: 14, endMinute: 0 }];

const DELIVERY_CHARGE_OTHER = 60;

const PAPER_SIZE_OPTIONS = [
  { value: 'a4', label: 'A4' },
  { value: 'letter', label: 'Letter' },
  { value: 'photo_paper', label: 'Photo Paper' },
  { value: 'passport_photo', label: 'Passport Photo' },
  { value: 'stamp_photo', label: 'Stamp Photo' }
];

const RATE_TABLE = {
  color: {
    single: 5,
    double: 8
  },
  black_white: {
    single: 3,
    double: 6
  }
};

const generateCollectionSlots = (days = COLLECTION_SLOT_DAYS) => {
  const slots = [];
  const now = new Date();

  for (let dayIndex = 0; dayIndex < days; dayIndex += 1) {
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);
    dayStart.setDate(dayStart.getDate() + dayIndex);

    const dayOfWeek = dayStart.getDay();
    const windows = COLLECTION_WINDOWS[dayOfWeek] || DEFAULT_COLLECTION_WINDOWS;

    windows.forEach(({ startHour, startMinute, endHour, endMinute }) => {
      const slotStart = new Date(dayStart);
      slotStart.setHours(startHour, startMinute, 0, 0);

      const slotEnd = new Date(dayStart);
      slotEnd.setHours(endHour, endMinute, 0, 0);

      if (slotStart > now) {
        const startLabel = slotStart.toLocaleString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit'
        });

        const endLabel = slotEnd.toLocaleString(undefined, {
          hour: 'numeric',
          minute: '2-digit'
        });

        slots.push({
          value: slotStart.toISOString(),
          label: `${startLabel} - ${endLabel}`
        });
      }
    });
  }

  return slots;
};

const createInitialFormState = (slots) => ({
  description: '',
  fileLink: '',
  colorMode: 'color',
  sides: 'single',
  paperSize: PAPER_SIZE_OPTIONS[0].value,
  quantity: 1,
  collectionTime: slots[0]?.value || '',
  deliveryLocation: 'SEU',
  deliveryAddress: '',
  paymentTransaction: ''
});

export const PrintRequestPage = () => {
  const { isAuthenticated, loading } = useAuth();
  const [collectionSlots] = useState(generateCollectionSlots);
  const [form, setForm] = useState(() => createInitialFormState(collectionSlots));
  const [status, setStatus] = useState({ type: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [estimate, setEstimate] = useState(null);

  const updateEstimate = (nextData) => {
    const { colorMode, sides, quantity, deliveryLocation } = nextData;
    const rate = RATE_TABLE?.[colorMode]?.[sides];
    if (!rate) {
      setEstimate(null);
      return;
    }

    const qtyNumber = Number(quantity);
    if (!Number.isFinite(qtyNumber) || qtyNumber <= 0) {
      setEstimate(null);
      return;
    }

    const deliveryCharge = deliveryLocation === 'OTHER' ? DELIVERY_CHARGE_OTHER : 0;

    setEstimate(rate * qtyNumber + deliveryCharge);
  };

  useEffect(() => {
    updateEstimate(form);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasCollectionSlots = collectionSlots.length > 0;
  const isOtherLocation = form.deliveryLocation === 'OTHER';
  const submitLabel = !isAuthenticated
    ? 'Sign in to submit'
    : !hasCollectionSlots
    ? 'Collection slots unavailable'
    : submitting
    ? 'Submitting...'
    : 'Submit Custom Request';
  const isSubmitDisabled = submitting || !hasCollectionSlots || !isAuthenticated;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => {
      const nextData = { ...prev, [name]: value };
      updateEstimate(nextData);
      return nextData;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isAuthenticated) {
      setStatus({ type: 'error', message: 'Please sign in to submit your custom request.' });
      return;
    }

    const paymentTx = (form.paymentTransaction || '').trim();
    if (!paymentTx) {
      setStatus({ type: 'error', message: 'Please provide the security payment transaction number.' });
      return;
    }

    setSubmitting(true);
    setStatus({ type: '', message: '' });

    try {
      await printService.submitPrintRequest({
        description: form.description,
        fileLink: form.fileLink,
        colorMode: form.colorMode,
        sides: form.sides,
        paperSize: form.paperSize,
        quantity: Number(form.quantity),
        collectionTime: form.collectionTime,
        deliveryLocation: form.deliveryLocation,
        deliveryAddress: form.deliveryLocation === 'OTHER' ? form.deliveryAddress : '',
        paymentTransaction: paymentTx
      });
      const resetState = createInitialFormState(collectionSlots);
      setForm(resetState);
      updateEstimate(resetState);
      setStatus({ type: 'success', message: 'Request submitted. Our team will review and confirm shortly.' });
    } catch (error) {
      const message = error?.response?.status === 401
        ? 'Your session expired. Please sign in again.'
        : 'Unable to submit request. Please try again later.';
      setStatus({ type: 'error', message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="print-request__loading">Loading request form...</div>;
  }

  return (
    <div className="print-request">
      <section className="print-request__intro">
        <h1>Custom Print Request</h1>
        <p>
          Provide your print specifications and share files via Google Drive or any link. We will review the details,
          confirm pricing, and send you an update within 2 hours.
        </p>
      </section>

      <section className="print-request__pricing">
        <h2>Popular Print Rates</h2>
        <div className="print-request__pricing-grid">
          <article>
            <h3>A4 Color Prints</h3>
            <ul>
              <li><strong>Single-sided:</strong> 5tk per sheet</li>
              <li><strong>Double-sided:</strong> 8tk per sheet</li>
            </ul>
          </article>
          <article>
            <h3>A4 Black & White</h3>
            <ul>
              <li><strong>Single-sided:</strong> 3tk per sheet</li>
              <li><strong>Double-sided:</strong> 6tk per sheet</li>
            </ul>
          </article>
          <article>
            <h3>Extra Services</h3>
            <ul>
              <li><strong>Passport size & Stamp size photo:</strong> starts at 60tk per sheet</li>
              <li><strong>Urgent queue:</strong> add 20% rush fee</li>
            </ul>
          </article>
        </div>
        <p className="print-request__note">Need bulk pricing or special finishing? Mention details in your request above.</p>
      </section>

      <form className="print-request__form" onSubmit={handleSubmit}>
        {!isAuthenticated && (
          <div className="print-request__alert">
            <p>
              Create an account or sign in to submit a custom print request and track your orders in your dashboard.
            </p>
            <div className="print-request__alert-links">
              <Link to="/login">Sign In</Link>
              <Link to="/register">Create Account</Link>
            </div>
          </div>
        )}

        <fieldset className="print-request__fieldset" disabled={!isAuthenticated || submitting}>
          <label>
            What would you like to print?
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              required
              rows="4"
              placeholder="Describe your print requirements, size, finishing, or any references."
            />
          </label>

          <label>
            Google Drive / File Link
            <input
              name="fileLink"
              value={form.fileLink}
              onChange={handleChange}
              type="url"
              placeholder="https://drive.google.com/..."
            />
          </label>

          <div className="print-request__grid">
            <label>
              Color preference
              <select name="colorMode" value={form.colorMode} onChange={handleChange}>
                <option value="color">Full Color</option>
                <option value="black_white">Black & White</option>
              </select>
            </label>

            <label>
              Print sides
              <select name="sides" value={form.sides} onChange={handleChange}>
                <option value="single">Single-sided</option>
                <option value="double">Double-sided</option>
              </select>
            </label>

            <label>
              Paper Size
              <select name="paperSize" value={form.paperSize} onChange={handleChange}>
                {PAPER_SIZE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Total Page (For estimates total tk)
              <input name="quantity" value={form.quantity} onChange={handleChange} type="number" min="1" required />
            </label>

            <label>
              Collection Time
              <select
                name="collectionTime"
                value={form.collectionTime}
                onChange={handleChange}
                required
                disabled={!hasCollectionSlots}
              >
                {hasCollectionSlots ? (
                  collectionSlots.map((slot) => (
                    <option key={slot.value} value={slot.value}>
                      {slot.label}
                    </option>
                  ))
                ) : (
                  <option value="">No slots available</option>
                )}
              </select>
              <p className="print-request__note">
                These slots include free delivery. Choosing any other time may require an extra delivery charge.
              </p>
            </label>

            <label>
              Delivery Location
              <select name="deliveryLocation" value={form.deliveryLocation} onChange={handleChange} required>
                <option value="SEU">SEU</option>
                <option value="AUST">AUST</option>
                <option value="OTHER">Other location (+60 tk delivery)</option>
              </select>
              <p className="print-request__note">
                SEU/AUST within the listed collection slots are free delivery.
              </p>
            </label>

            {isOtherLocation && (
              <label>
                Delivery address (Advance 60tk charge for other locations. For other locations, security payment not mendatory)
                <input
                  name="deliveryAddress"
                  value={form.deliveryAddress}
                  onChange={handleChange}
                  placeholder="Full delivery address"
                  required={isOtherLocation}
                />
              </label>
            )}

            <label className="print-request__payment">
              <div className="print-request__label-row">
                <span>Security Payment Transaction 20tk</span>
                {estimate !== null ? (
                  <span className="print-request__estimate">Est. total: {estimate} tk</span>
                ) : (
                  <span className="print-request__estimate print-request__estimate--muted">
                    Set color, sides & quantity
                  </span>
                )}
              </div>
              <input
                name="paymentTransaction"
                value={form.paymentTransaction}
                onChange={handleChange}
                placeholder="Bkash/Nagad transaction number"
                required
              />
            </label>
            <label className="print-request__payment">
              Payment information
            <div className="print-request__payment-qr">
                <span className="print-request__payment-qr-text">bKash (Send Money): 01751156833</span>
                <span className="print-request__payment-qr-text">nagad (Send Money): 01751156833</span>
                <img
                  src="https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=https://qr.bka.sh/281014021RjmoKcTgS40026643"
                  alt="bKash QR for 01751156833"
                />
              </div>
            </label>
          </div>
        </fieldset>

        {status.message && (
          <div className={`print-request__status print-request__status--${status.type}`}>{status.message}</div>
        )}

        <button type="submit" disabled={isSubmitDisabled} className="print-request__submit">
          {submitLabel}
        </button>
      </form>
    </div>
  );
};
