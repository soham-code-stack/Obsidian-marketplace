import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import CancelOrderButton from '../components/CancelOrderButton';

const formatPrice = (cents, currency = 'inr') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format((cents || 0) / 100);

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const estimatedDeliveryDate = (createdAt) => {
  const d = new Date(createdAt);
  d.setDate(d.getDate() + 7);
  return d;
};

const statusBadge = (status) => {
  const map = { paid: 'badge-success', pending: 'badge-danger', failed: 'badge-danger', refunded: 'badge-danger' };
  return map[status] || 'badge-danger';
};

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadOrder = useCallback(async () => {
    // Payment confirmation can take a moment to reach the webhook, so poll
    // briefly until paymentStatus updates from 'pending'.
    for (let attempt = 0; attempt < 6; attempt++) {
      const { data } = await api.get(`/orders/${id}`);
      setOrder(data.order);
      if (data.order.paymentStatus !== 'pending') break;
      await new Promise((r) => setTimeout(r, 1500));
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    setLoading(true);
    loadOrder();
  }, [loadOrder]);

  if (loading) return <div className="container empty-state">Confirming your order...</div>;
  if (!order) return <div className="container empty-state">Order not found.</div>;

  return (
    <div className="container" style={{ paddingTop: 30, paddingBottom: 60 }}>
      <h1 className="page-title">Order Confirmation</h1>
      <div className="card">
        <p>
          Status: <span className={`badge ${statusBadge(order.paymentStatus)}`}>{order.paymentStatus}</span>
        </p>
        <p>Fulfillment: {order.fulfillmentStatus}</p>
        <p>Placed on: {formatDate(order.createdAt)}</p>
        {order.fulfillmentStatus !== 'cancelled' && (
          <p>Estimated delivery: {formatDate(estimatedDeliveryDate(order.createdAt))}</p>
        )}

        <table style={{ marginTop: 16 }}>
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Price</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, idx) => (
              <tr key={idx}>
                <td>{item.name}</td>
                <td>{item.quantity}</td>
                <td>{formatPrice(item.price * item.quantity, order.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ marginTop: 16, fontWeight: 700 }}>Total: {formatPrice(order.totalAmount, order.currency)}</p>

        <CancelOrderButton order={order} onCancelled={loadOrder} />
      </div>
    </div>
  );
}