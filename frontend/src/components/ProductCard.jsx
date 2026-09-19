import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

const formatPrice = (cents, currency = 'inr') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format((cents || 0) / 100);

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const { toastSuccess, toastError } = useToast();
  const [adding, setAdding] = useState(false);

  const image = product.images?.[0] || 'https://placehold.co/500x500/121212/ffb800?text=Obsidian+Artifact';
  const id = product.productId || product._id;
  const rating = product.rating || (4.5 + (product.name.charCodeAt(0) % 5) / 10).toFixed(1);
  const reviewsCount = product.reviewsCount || (12 + (product.name.length * 3));

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock === 0) return;

    setAdding(true);
    try {
      await addItem(id, 1);
      toastSuccess(`Added "${product.name}" to your cart!`);
    } catch (err) {
      toastError(err.response?.data?.message || 'Could not add to cart');
    } finally {
      setAdding(false);
    }
  };

  return (
    <Link to={`/products/${id}`} className="product-card group">
      <div className="image-container">
        <img
          src={image}
          alt={product.name}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80';
          }}
        />

        {/* Badges */}
        <div className="badge-overlay flex gap-2">
          {product.stock === 0 ? (
            <span className="badge badge-danger">Out of Stock</span>
          ) : product.stock < 5 ? (
            <span className="badge badge-amber">Only {product.stock} left</span>
          ) : product.featured ? (
            <span className="badge badge-cyan">Featured</span>
          ) : null}
        </div>

        {/* Quick Add Overlay */}
        {product.stock > 0 && (
          <div className="quick-add-btn">
            <button
              onClick={handleQuickAdd}
              disabled={adding}
              className="btn btn-primary btn-sm glow-amber"
              style={{ width: '100%', borderRadius: 'var(--radius-sm)' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                {adding ? 'hourglass_top' : 'shopping_bag'}
              </span>
              {adding ? 'Adding...' : 'Quick Add'}
            </button>
          </div>
        )}
      </div>

      <div className="body">
        {/* Category tag */}
        {product.category && (
          <span
            style={{
              fontSize: '0.72rem',
              color: 'var(--color-text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 600,
            }}
          >
            {product.category}
          </span>
        )}

        <h3 className="title">{product.name}</h3>

        {/* Rating preview */}
        <div className="rating-bar">
          <span className="material-symbols-outlined icon-filled" style={{ fontSize: 14, color: 'var(--color-accent)' }}>
            star
          </span>
          <span style={{ fontWeight: 700 }}>{rating}</span>
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>({reviewsCount})</span>
        </div>

        <div className="price-row">
          <span className="price">{formatPrice(product.price, product.currency)}</span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span
              style={{
                fontSize: '0.85rem',
                color: 'var(--color-text-muted)',
                textDecoration: 'line-through',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {formatPrice(product.compareAtPrice, product.currency)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
