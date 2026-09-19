import { useState, useEffect } from 'react';

const emptyForm = {
  name: '',
  description: '',
  price: '',
  category: '',
  tags: '',
  images: '',
  stock: '',
};

export default function ProductForm({ initial, onSubmit, submitLabel = 'Save Product' }) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initial) {
      setForm({
        name: initial.name || '',
        description: initial.description || '',
        price: initial.price ? (initial.price / 100).toString() : '',
        category: initial.category || '',
        tags: (initial.tags || []).join(', '),
        images: (initial.images || []).join(', '),
        stock: initial.stock?.toString() || '',
      });
    }
  }, [initial]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const priceInCents = Math.round(parseFloat(form.price) * 100);
    if (!form.name || !form.description || !form.category || isNaN(priceInCents)) {
      setError('Please fill in name, description, category, and a valid price in INR');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        name: form.name,
        description: form.description,
        price: priceInCents,
        category: form.category,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        images: form.images.split(',').map((i) => i.trim()).filter(Boolean),
        stock: parseInt(form.stock, 10) || 0,
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save product');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {error && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255, 77, 79, 0.15)',
            border: '1px solid rgba(255, 77, 79, 0.4)',
            color: 'var(--color-danger)',
            fontSize: '0.88rem',
          }}
        >
          {error}
        </div>
      )}

      <div className="form-group" style={{ margin: 0 }}>
        <label className="form-label">Artifact Name</label>
        <input
          type="text"
          name="name"
          placeholder="e.g. Sonic Obsidian Pro"
          value={form.name}
          onChange={handleChange}
          required
          className="input"
        />
      </div>

      <div className="form-group" style={{ margin: 0 }}>
        <label className="form-label">Detailed Description</label>
        <textarea
          name="description"
          placeholder="Technical specifications, features, materials, craftsmanship..."
          rows={4}
          value={form.description}
          onChange={handleChange}
          required
          className="input"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Price (INR ₹)</label>
          <input
            type="number"
            step="0.01"
            name="price"
            placeholder="e.g. 24999.00"
            value={form.price}
            onChange={handleChange}
            required
            className="input"
          />
        </div>

        <div className="form-group" style={{ margin: 0 }}>
          <label className="form-label">Stock Quantity</label>
          <input
            type="number"
            name="stock"
            placeholder="e.g. 25"
            value={form.stock}
            onChange={handleChange}
            required
            className="input"
          />
        </div>
      </div>

      <div className="form-group" style={{ margin: 0 }}>
        <label className="form-label">Sector Category</label>
        <input
          type="text"
          name="category"
          placeholder="e.g. Neural Tech, Vanguard Apparel, Timepieces"
          value={form.category}
          onChange={handleChange}
          required
          className="input"
        />
      </div>

      <div className="form-group" style={{ margin: 0 }}>
        <label className="form-label">Tags (comma-separated)</label>
        <input
          type="text"
          name="tags"
          placeholder="titanium, limited, wireless, obsidian"
          value={form.tags}
          onChange={handleChange}
          className="input"
        />
      </div>

      <div className="form-group" style={{ margin: 0 }}>
        <label className="form-label">Image URLs (comma-separated)</label>
        <input
          type="text"
          name="images"
          placeholder="https://images.unsplash.com/..., https://..."
          value={form.images}
          onChange={handleChange}
          className="input"
        />
      </div>

      <button
        type="submit"
        className="btn btn-primary btn-lg glow-amber"
        disabled={submitting}
        style={{ marginTop: 8 }}
      >
        <span className="material-symbols-outlined">{initial ? 'save' : 'add_circle'}</span>
        {submitting ? 'Committing...' : submitLabel}
      </button>
    </form>
  );
}
