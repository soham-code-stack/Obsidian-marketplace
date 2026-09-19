import { useState, useEffect } from 'react';
import api from '../services/api';
import Modal from './Modal';

const CANCEL_WINDOW_MS = 24 * 60 * 60 * 1000;

const formatCountdown = (ms) => {
  if (ms <= 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const s = String(totalSeconds % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
};

/**
 * Renders a "Cancel Order" button with a live 24-hour countdown, visible
 * only while the order is still 'processing' and within the cancellation
 * window. Handles the full flow: confirm dialog -> cancel API call ->
 * refund-timing info popup.
 *
 * `onCancelled` is called after the user dismisses the final info popup,
 * so the parent page can refetch/update its order data.
 */
export default function CancelOrderButton({ order, onCancelled }) {
  const [now, setNow] = useState(Date.now());
  const [showConfirm, setShowConfirm] = useState(false);
  const [showRefundInfo, setShowRefundInfo] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (order.fulfillmentStatus !== 'processing') return null;

  const orderTime = new Date(order.createdAt).getTime();
  const deadline = orderTime + CANCEL_WINDOW_MS;
  const remaining = deadline - now;

  if (remaining <= 0) return null;

  const handleConfirmCancel = async () => {
    setCancelling(true);
    setError('');
    try {
      await api.patch(`/orders/${order._id}/cancel`);
      setShowConfirm(false);
      setShowRefundInfo(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const closeRefundInfo = () => {
    setShowRefundInfo(false);
    onCancelled?.();
  };

  return (
    <>
      <div style={{ marginTop: 10 }}>
        <button className="btn btn-danger" onClick={() => setShowConfirm(true)}>
          Cancel Order
        </button>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)', marginTop: 6 }}>
          Cancellation available for {formatCountdown(remaining)}
        </p>
      </div>

      {showConfirm && (
        <Modal onClose={() => !cancelling && setShowConfirm(false)}>
          <h3 style={{ marginTop: 0 }}>Cancel this order?</h3>
          <p>Are you sure you want to cancel this order? This cannot be undone.</p>
          {error && <p className="error-text">{error}</p>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button className="btn" onClick={() => setShowConfirm(false)} disabled={cancelling}>
              No
            </button>
            <button className="btn btn-danger" onClick={handleConfirmCancel} disabled={cancelling}>
              {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
            </button>
          </div>
        </Modal>
      )}

      {showRefundInfo && (
        <Modal onClose={closeRefundInfo}>
          <h3 style={{ marginTop: 0 }}>Order Cancelled</h3>
          <p>You will receive your refund within 2 business days.</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
            <button className="btn btn-primary" onClick={closeRefundInfo}>
              OK
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
