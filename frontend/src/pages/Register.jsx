import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Register() {
  const { register } = useAuth();
  const { toastSuccess, toastError } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'buyer' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await register(form);
      toastSuccess('Account initialized successfully!');
      navigate(user.role === 'seller' ? '/seller/setup' : '/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      setError(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="container"
      style={{
        minHeight: '85vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
      }}
    >
      <div
        className="glass-floating"
        style={{
          width: '100%',
          maxWidth: 480,
          padding: '40px 32px',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid var(--color-border-hover)',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #00eefc 0%, #ffb800 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(0, 238, 252, 0.4)',
              marginBottom: 16,
            }}
          >
            <span className="material-symbols-outlined icon-filled" style={{ color: '#0b0c10', fontSize: 28 }}>
              badge
            </span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 6 }}>
            Create Vault Account
          </h1>
          <p style={{ color: 'var(--color-text-dim)', fontSize: '0.9rem' }}>
            Join Obsidian Flux to buy or sell extraordinary artifacts
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 77, 79, 0.15)',
              border: '1px solid rgba(255, 77, 79, 0.4)',
              color: 'var(--color-danger)',
              fontSize: '0.88rem',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>error</span>
            {error}
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Full Name</label>
            <input
              type="text"
              name="name"
              placeholder="e.g. Alex Thorne"
              value={form.name}
              onChange={handleChange}
              required
              className="input"
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="alex@example.com"
              value={form.email}
              onChange={handleChange}
              required
              className="input"
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Password (Min 8 chars)</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              minLength={8}
              value={form.password}
              onChange={handleChange}
              required
              className="input"
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Account Purpose</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="input"
              style={{ cursor: 'pointer' }}
            >
              <option value="buyer">Collector / Buyer — Explore and purchase artifacts</option>
              <option value="seller">Creator / Seller — List and monetize items</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg glow-amber"
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? 'Registering...' : 'Initialize Membership'}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center', fontSize: '0.9rem', color: 'var(--color-text-dim)' }}>
          Already registered?{' '}
          <Link to="/login" style={{ color: 'var(--color-accent)', fontWeight: 600 }}>
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}
