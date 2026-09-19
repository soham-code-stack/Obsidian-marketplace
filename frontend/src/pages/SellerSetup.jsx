import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';

export default function SellerSetup() {
  const navigate = useNavigate();
  const { toastSuccess, toastError } = useToast();
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/shops', form);
      toastSuccess('Shop initialized successfully! Welcome to the Seller Network.');
      navigate('/seller/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not create shop';
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
        minHeight: '80vh',
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
          maxWidth: 500,
          padding: '40px 32px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: 'linear-gradient(135deg, var(--color-secondary) 0%, var(--color-accent) 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(0, 238, 252, 0.35)',
              marginBottom: 16,
            }}
          >
            <span className="material-symbols-outlined icon-filled" style={{ color: '#000', fontSize: 28 }}>
              storefront
            </span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 6 }}>
            Initialize Merchant Shop
          </h1>
          <p style={{ color: 'var(--color-text-dim)', fontSize: '0.92rem' }}>
            Set up your brand presence and start listing artifacts in the Obsidian Vault.
          </p>
        </div>

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
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Shop / Studio Name</label>
            <input
              type="text"
              name="name"
              placeholder="e.g. Apex Hardware Labs"
              value={form.name}
              onChange={handleChange}
              required
              className="input"
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Brand Bio & Origin Story</label>
            <textarea
              name="description"
              placeholder="Tell buyers about your craftsmanship, philosophy, and expertise..."
              rows={4}
              value={form.description}
              onChange={handleChange}
              className="input"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg glow-amber"
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? 'Initializing Studio...' : 'Launch Merchant Shop'}
          </button>
        </form>
      </div>
    </div>
  );
}
