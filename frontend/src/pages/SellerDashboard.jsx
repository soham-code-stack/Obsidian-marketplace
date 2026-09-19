import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import api from '../services/api';
import ProductForm from '../components/ProductForm';
import { useToast } from '../context/ToastContext';

const formatPrice = (cents) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'inr' }).format((cents || 0) / 100);

export default function SellerDashboard() {
  const { toastSuccess, toastError } = useToast();
  const [shop, setShop] = useState(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('products');
  const [editingProduct, setEditingProduct] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    setLoading(true);
    try {
      const shopRes = await api.get('/shops/me');
      setShop(shopRes.data.shop);

      const [productsRes, ordersRes] = await Promise.all([
        api.get('/products/seller/mine'),
        api.get('/orders/seller/mine'),
      ]);
      setProducts(productsRes.data.products || []);
      setOrders(ordersRes.data.orders || []);
    } catch (err) {
      if (err.response?.status === 404) setNeedsSetup(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleCreateOrUpdate = async (payload) => {
    try {
      if (editingProduct) {
        await api.patch(`/products/${editingProduct._id}`, payload);
        toastSuccess(`Updated artifact "${payload.name}"!`);
      } else {
        await api.post('/products', payload);
        toastSuccess(`Created new artifact "${payload.name}"!`);
      }
      setShowForm(false);
      setEditingProduct(null);
      await loadAll();
    } catch (err) {
      toastError(err.response?.data?.message || 'Action failed');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Permanently remove "${name || 'this product'}" from your shop?`)) return;
    try {
      await api.delete(`/products/${id}`);
      toastSuccess('Product deleted.');
      await loadAll();
    } catch (err) {
      toastError(err.response?.data?.message || 'Could not delete product');
    }
  };

  const handleFulfillmentChange = async (orderId, status) => {
    try {
      await api.patch(`/orders/${orderId}/fulfillment`, { status });
      toastSuccess(`Order fulfillment updated to "${status}".`);
      await loadAll();
    } catch (err) {
      toastError(err.response?.data?.message || 'Could not update fulfillment');
    }
  };

  if (loading) {
    return (
      <div className="container empty-state" style={{ marginTop: 60 }}>
        <span className="material-symbols-outlined icon" style={{ animation: 'pulseGlow 1.5s infinite' }}>
          hourglass_top
        </span>
        <p>Loading Merchant Control Panel...</p>
      </div>
    );
  }

  if (needsSetup) return <Navigate to="/seller/setup" replace />;

  return (
    <div className="container" style={{ paddingTop: 30, paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span className="badge badge-cyan">Merchant Verified</span>
          </div>
          <h1 className="page-title" style={{ margin: 0 }}>
            {shop.name}
          </h1>
          <p style={{ color: 'var(--color-text-dim)', fontSize: '0.95rem', marginTop: 4 }}>
            Manage inventory, fulfill orders, and monitor revenue performance.
          </p>
        </div>

        <button
          className="btn btn-primary glow-amber"
          onClick={() => {
            setEditingProduct(null);
            setShowForm(!showForm);
          }}
        >
          <span className="material-symbols-outlined">{showForm ? 'close' : 'add'}</span>
          {showForm ? 'Close Form' : 'New Artifact Drop'}
        </button>
      </div>

      {/* KPI Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 20,
          marginBottom: 36,
        }}
      >
        <div className="glass-panel" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ color: 'var(--color-text-dim)', fontSize: '0.85rem', fontWeight: 600 }}>Total Revenue</span>
            <span className="material-symbols-outlined" style={{ color: 'var(--color-accent)' }}>
              monetization_on
            </span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}>
            {formatPrice(shop.stats?.totalRevenue || 0)}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ color: 'var(--color-text-dim)', fontSize: '0.85rem', fontWeight: 600 }}>Total Orders</span>
            <span className="material-symbols-outlined" style={{ color: 'var(--color-secondary)' }}>
              local_shipping
            </span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-text)', fontFamily: 'var(--font-mono)' }}>
            {shop.stats?.totalOrders || 0}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ color: 'var(--color-text-dim)', fontSize: '0.85rem', fontWeight: 600 }}>Units Sold</span>
            <span className="material-symbols-outlined" style={{ color: 'var(--color-success)' }}>
              trending_up
            </span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-success)', fontFamily: 'var(--font-mono)' }}>
            {shop.stats?.totalSales || 0}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ color: 'var(--color-text-dim)', fontSize: '0.85rem', fontWeight: 600 }}>Active Listings</span>
            <span className="material-symbols-outlined" style={{ color: 'var(--color-text-dim)' }}>
              inventory_2
            </span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-text)', fontFamily: 'var(--font-mono)' }}>
            {products.length}
          </div>
        </div>
      </div>

      {/* Creation / Edit Form Modal or Inline Panel */}
      {showForm && (
        <div
          className="glass-floating"
          style={{
            padding: '32px',
            marginBottom: 36,
            border: '1px solid var(--color-border-glow)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>
              {editingProduct ? `Edit Artifact: ${editingProduct.name}` : 'Create New Artifact Listing'}
            </h2>
            <button
              className="btn-icon btn-glass"
              onClick={() => {
                setShowForm(false);
                setEditingProduct(null);
              }}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <ProductForm
            initial={editingProduct}
            onSubmit={handleCreateOrUpdate}
            submitLabel={editingProduct ? 'Update Listing' : 'Publish Listing'}
          />
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button
          className={`btn ${tab === 'products' ? 'btn-primary' : 'btn-glass'}`}
          onClick={() => setTab('products')}
        >
          <span className="material-symbols-outlined">inventory_2</span>
          My Artifacts ({products.length})
        </button>
        <button
          className={`btn ${tab === 'orders' ? 'btn-primary' : 'btn-glass'}`}
          onClick={() => setTab('orders')}
        >
          <span className="material-symbols-outlined">receipt_long</span>
          Orders & Fulfillment ({orders.length})
        </button>
      </div>

      {/* Products Tab */}
      {tab === 'products' && (
        <div className="glass-panel" style={{ padding: 0, overflowX: 'auto' }}>
          {products.length === 0 ? (
            <div className="empty-state">
              <span className="material-symbols-outlined icon">inventory_2</span>
              <h2>No artifacts listed yet</h2>
              <p style={{ marginTop: 8 }}>Start listing your creations to reach vault buyers.</p>
              <button
                className="btn btn-primary glow-amber"
                style={{ marginTop: 20 }}
                onClick={() => setShowForm(true)}
              >
                Create First Product
              </button>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Artifact</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img
                          src={p.images?.[0] || 'https://placehold.co/40x40?text=Item'}
                          alt={p.name}
                          style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'cover' }}
                        />
                        <div>
                          <Link to={`/products/${p._id}`} style={{ fontWeight: 600, display: 'block' }}>
                            {p.name}
                          </Link>
                          <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                            {p.category}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-accent)' }}>
                      {formatPrice(p.price)}
                    </td>
                    <td>
                      <span className={`badge ${p.stock > 0 ? 'badge-success' : 'badge-danger'}`}>
                        {p.stock} units
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${p.isActive ? 'badge-cyan' : 'badge-amber'}`}>
                        {p.isActive ? 'Active' : 'Draft'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 8 }}>
                        <button
                          className="btn btn-glass btn-sm"
                          onClick={() => {
                            setEditingProduct(p);
                            setShowForm(true);
                            window.scrollTo({ top: 180, behavior: 'smooth' });
                          }}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                          Edit
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(p._id, p.name)}
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Orders Tab */}
      {tab === 'orders' && (
        <div className="glass-panel" style={{ padding: 0, overflowX: 'auto' }}>
          {orders.length === 0 ? (
            <div className="empty-state">
              <span className="material-symbols-outlined icon">local_shipping</span>
              <h2>No incoming orders yet</h2>
              <p>When buyers purchase your artifacts, order records will appear here for fulfillment.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Order Reference</th>
                  <th>Date</th>
                  <th>Payment</th>
                  <th>Fulfillment</th>
                  <th>Update Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <code style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-secondary)' }}>
                        #{order._id.slice(-8)}
                      </code>
                    </td>
                    <td style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem' }}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <span className={`badge ${order.paymentStatus === 'paid' ? 'badge-success' : 'badge-danger'}`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          order.fulfillmentStatus === 'delivered'
                            ? 'badge-success'
                            : order.fulfillmentStatus === 'shipped'
                            ? 'badge-cyan'
                            : 'badge-amber'
                        }`}
                      >
                        {order.fulfillmentStatus || 'processing'}
                      </span>
                    </td>
                    <td>
                      <select
                        value={order.fulfillmentStatus}
                        onChange={(e) => handleFulfillmentChange(order._id, e.target.value)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-xs)',
                          background: 'var(--color-surface-2)',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text)',
                          fontSize: '0.85rem',
                        }}
                      >
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
