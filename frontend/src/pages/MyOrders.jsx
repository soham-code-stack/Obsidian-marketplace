import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
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

const STATUS_TABS = [
  { key: 'all', label: 'All Orders' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

const statusBadgeClass = (status) => {
  if (status === 'delivered') return 'badge-success';
  if (status === 'cancelled') return 'badge-danger';
  return 'badge-success';
};

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/orders/mine');
      setOrders(data.orders);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  if (loading) return <div className="container empty-state">Loading orders...</div>;
  if (orders.length === 0) return <div className="container empty-state">You have no orders yet.</div>;

  const filtered =
    activeTab === 'all' ? orders : orders.filter((o) => o.fulfillmentStatus === activeTab);

  return (
    <div className="container" style={{ paddingTop: 30, paddingBottom: 60 }}>
      <h1 className="page-title">My Orders</h1>

      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {STATUS_TABS.map((tab) => {
          const count =
            tab.key === 'all' ? orders.length : orders.filter((o) => o.fulfillmentStatus === tab.key).length;
          return (
            <button
              key={tab.key}
              className="btn"
              style={activeTab === tab.key ? { borderColor: 'var(--color-accent)', color: 'var(--color-accent)' } : {}}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">No orders in this category.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.map((order) => (
            <div key={order._id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 700 }}>
                    Order <Link to={`/orders/${order._id}`}>#{order._id.slice(-8).toUpperCase()}</Link>
                  </p>
                  <p style={{ margin: '4px 0 0', color: 'var(--color-text-dim)', fontSize: '0.85rem' }}>
                    Placed on {formatDate(order.createdAt)}
                  </p>
                  {order.fulfillmentStatus !== 'cancelled' && (
                    <p style={{ margin: '2px 0 0', color: 'var(--color-text-dim)', fontSize: '0.85rem' }}>
                      Estimated delivery: {formatDate(estimatedDeliveryDate(order.createdAt))}
                    </p>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`badge ${statusBadgeClass(order.fulfillmentStatus)}`}>
                    {order.fulfillmentStatus}
                  </span>
                  <p style={{ margin: '6px 0 0', fontWeight: 700 }}>{formatPrice(order.totalAmount, order.currency)}</p>
                </div>
              </div>

              <div style={{ marginTop: 12, borderTop: '1px solid var(--color-border)', paddingTop: 12 }}>
                {order.items.map((item, idx) => (
                  <p key={idx} style={{ margin: '4px 0', fontSize: '0.9rem' }}>
                    {item.name} × {item.quantity}
                  </p>
                ))}
              </div>

              <p style={{ marginTop: 10, fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>
                Payment: <span style={{ fontWeight: 600 }}>{order.paymentStatus}</span>
              </p>

              <CancelOrderButton order={order} onCancelled={loadOrders} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}