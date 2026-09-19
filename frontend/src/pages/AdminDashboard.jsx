import { useEffect, useState } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

const formatPrice = (cents) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'inr' }).format((cents || 0) / 100);

export default function AdminDashboard() {
  const { toastSuccess, toastError } = useToast();
  const [overview, setOverview] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [overviewRes, usersRes] = await Promise.all([
        api.get('/admin/overview'),
        api.get('/admin/users'),
      ]);
      setOverview(overviewRes.data.overview);
      setUsers(usersRes.data.users || []);
    } catch (err) {
      console.error('Failed to load admin overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const toggleUserStatus = async (user) => {
    try {
      await api.patch(`/admin/users/${user._id}/status`, { isActive: !user.isActive });
      toastSuccess(`Updated account status for ${user.name}`);
      await loadAll();
    } catch (err) {
      toastError(err.response?.data?.message || 'Could not update status');
    }
  };

  if (loading) {
    return (
      <div className="container empty-state" style={{ marginTop: 60 }}>
        <span className="material-symbols-outlined icon" style={{ animation: 'pulseGlow 1.5s infinite' }}>
          admin_panel_settings
        </span>
        <p>Loading Master Admin Panel...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 30, paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span className="badge badge-danger">Root Level Authority</span>
        </div>
        <h1 className="page-title" style={{ margin: 0 }}>
          Admin Command Center
        </h1>
        <p style={{ color: 'var(--color-text-dim)', fontSize: '0.95rem', marginTop: 4 }}>
          Global oversight of platform revenue, merchant shops, inventory, and users.
        </p>
      </div>

      {/* KPI Stats Overview */}
      {overview && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 20,
            marginBottom: 36,
          }}
        >
          <div className="glass-panel" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ color: 'var(--color-text-dim)', fontSize: '0.85rem', fontWeight: 600 }}>Total Revenue</span>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-accent)' }}>
                account_balance
              </span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}>
              {formatPrice(overview.totalRevenue || 0)}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ color: 'var(--color-text-dim)', fontSize: '0.85rem', fontWeight: 600 }}>Registered Users</span>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-secondary)' }}>
                group
              </span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-text)', fontFamily: 'var(--font-mono)' }}>
              {overview.userCount || 0}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ color: 'var(--color-text-dim)', fontSize: '0.85rem', fontWeight: 600 }}>Active Shops</span>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-success)' }}>
                store
              </span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-success)', fontFamily: 'var(--font-mono)' }}>
              {overview.shopCount || 0}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ color: 'var(--color-text-dim)', fontSize: '0.85rem', fontWeight: 600 }}>Vault Products</span>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-text-dim)' }}>
                inventory_2
              </span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-text)', fontFamily: 'var(--font-mono)' }}>
              {overview.productCount || 0}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ color: 'var(--color-text-dim)', fontSize: '0.85rem', fontWeight: 600 }}>Total Orders</span>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-secondary)' }}>
                shopping_cart
              </span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-secondary)', fontFamily: 'var(--font-mono)' }}>
              {overview.totalOrders || 0}
            </div>
          </div>
        </div>
      )}

      {/* User Management Section */}
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>
          User Directory & Access Control
        </h2>
        <span className="badge badge-amber">{users.length} accounts</span>
      </div>

      <div className="glass-panel" style={{ padding: 0, overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>User Name</th>
              <th>Email</th>
              <th>System Role</th>
              <th>Account Status</th>
              <th style={{ textAlign: 'right' }}>Security Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: 'var(--color-surface-3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                      }}
                    >
                      {u.name?.charAt(0).toUpperCase()}
                    </div>
                    <strong>{u.name}</strong>
                  </div>
                </td>
                <td style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}>{u.email}</td>
                <td>
                  <span
                    className={`badge ${
                      u.role === 'admin'
                        ? 'badge-danger'
                        : u.role === 'seller'
                        ? 'badge-cyan'
                        : 'badge-amber'
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td>
                  <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>
                    {u.isActive ? 'Active' : 'Suspended'}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  {u.role !== 'admin' && (
                    <button
                      className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-primary'}`}
                      onClick={() => toggleUserStatus(u)}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                        {u.isActive ? 'block' : 'check_circle'}
                      </span>
                      {u.isActive ? 'Deactivate' : 'Reactivate'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
