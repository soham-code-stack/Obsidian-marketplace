import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import ProductCard from '../components/ProductCard';

const formatPrice = (cents, currency = 'inr') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format((cents || 0) / 100);

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addItem } = useCart();
  const { toastSuccess, toastError } = useToast();

  const [product, setProduct] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('overview');
  const [adding, setAdding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [productRes, similarRes] = await Promise.all([
          api.get(`/products/${id}`),
          api.get(`/recommendations/similar/${id}`).catch(() => ({ data: { products: [] } })),
        ]);
        setProduct(productRes.data.product);
        setSimilar(similarRes.data.products || []);
        setActiveImageIndex(0);
        setQuantity(1);
      } catch (err) {
        console.error('Failed to load product:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  const handleAddToCart = async () => {
    if (!product || product.stock === 0) return;
    setAdding(true);
    try {
      await addItem(product._id, quantity);
      toastSuccess(`Added ${quantity}x "${product.name}" to your cart!`);
    } catch (err) {
      toastError(err.response?.data?.message || 'Could not add to cart');
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="container empty-state" style={{ marginTop: 60 }}>
        <span className="material-symbols-outlined icon" style={{ animation: 'pulseGlow 1.5s infinite' }}>
          hourglass_top
        </span>
        <p>Loading artifact dossier...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container empty-state" style={{ marginTop: 60 }}>
        <span className="material-symbols-outlined icon">error</span>
        <h2>Artifact not found</h2>
        <p style={{ marginTop: 8 }}>The requested item does not exist or has been vaulted.</p>
        <Link to="/" className="btn btn-primary" style={{ marginTop: 20 }}>
          Back to Vault
        </Link>
      </div>
    );
  }

  const images = product.images && product.images.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'];

  const rating = product.rating || (4.6 + (product.name.charCodeAt(0) % 4) / 10).toFixed(1);
  const reviewsCount = product.reviewsCount || (18 + product.name.length * 4);

  return (
    <div className="container" style={{ paddingTop: 30, paddingBottom: 80 }}>
      {/* Breadcrumb Navigation */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: '0.85rem',
          color: 'var(--color-text-dim)',
          marginBottom: 24,
        }}
      >
        <Link to="/" style={{ color: 'var(--color-text-muted)' }}>Home</Link>
        <span>/</span>
        {product.category && (
          <>
            <Link to={`/category/${encodeURIComponent(product.category)}`} style={{ color: 'var(--color-text-muted)' }}>
              {product.category}
            </Link>
            <span>/</span>
          </>
        )}
        <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{product.name}</span>
      </div>

      {/* Main Product Showcase Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: 48,
          alignItems: 'start',
        }}
      >
        {/* Left: Gallery View */}
        <div>
          {/* Main Large Image */}
          <div
            className="glass-panel"
            style={{
              position: 'relative',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              aspectRatio: '1 / 1',
              background: 'var(--color-surface-2)',
              marginBottom: 16,
            }}
          >
            <img
              src={images[activeImageIndex] || images[0]}
              alt={product.name}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
              }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.4s ease',
              }}
            />

            {/* Badges on main image */}
            <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 8 }}>
              {product.stock === 0 ? (
                <span className="badge badge-danger">Vault Depleted</span>
              ) : product.stock < 5 ? (
                <span className="badge badge-amber">Low Stock: {product.stock} left</span>
              ) : (
                <span className="badge badge-success">In Stock</span>
              )}
              {product.featured && <span className="badge badge-cyan">Featured Artifact</span>}
            </div>
          </div>

          {/* Thumbnail Gallery Row */}
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  style={{
                    width: 76,
                    height: 76,
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    border: activeImageIndex === idx ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                    background: 'var(--color-surface-2)',
                    padding: 0,
                    cursor: 'pointer',
                    opacity: activeImageIndex === idx ? 1 : 0.6,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <img
                    src={img}
                    alt={`${product.name} ${idx + 1}`}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
                    }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Details & Controls */}
        <div>
          {/* Seller / Domain Tag */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            {product.category && <span className="badge badge-cyan">{product.category}</span>}
            {product.shop && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', color: 'var(--color-text-dim)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--color-secondary)' }}>
                  verified
                </span>
                Sold by <strong style={{ color: 'var(--color-text)' }}>{product.shop.name}</strong>
              </div>
            )}
          </div>

          <h1 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)', fontWeight: 800, marginBottom: 12, lineHeight: 1.15 }}>
            {product.name}
          </h1>

          {/* Star Ratings */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', color: 'var(--color-accent)' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} className="material-symbols-outlined icon-filled" style={{ fontSize: 18 }}>
                  star
                </span>
              ))}
            </div>
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{rating}</span>
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
              ({reviewsCount} verified reviews)
            </span>
          </div>

          {/* Pricing Block */}
          <div
            className="glass-panel"
            style={{
              padding: '18px 24px',
              borderRadius: 'var(--radius-md)',
              marginBottom: 24,
              display: 'flex',
              alignItems: 'baseline',
              gap: 16,
            }}
          >
            <span style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}>
              {formatPrice(product.price, product.currency)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)', textDecoration: 'line-through', fontFamily: 'var(--font-mono)' }}>
                {formatPrice(product.compareAtPrice, product.currency)}
              </span>
            )}
            <span className="badge badge-amber" style={{ marginLeft: 'auto' }}>
              Tax Included
            </span>
          </div>

          {/* Description */}
          <p style={{ color: 'var(--color-text-dim)', fontSize: '1rem', lineHeight: 1.65, marginBottom: 28 }}>
            {product.description}
          </p>

          {/* Quantity Controls & Action Buttons */}
          {product.stock > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-dim)' }}>
                  Quantity:
                </span>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface-2)',
                    padding: 4,
                  }}
                >
                  <button
                    className="btn-glass"
                    style={{ width: 34, height: 34, borderRadius: 'var(--radius-xs)', fontSize: '1.1rem' }}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span style={{ minWidth: 44, textAlign: 'center', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    {quantity}
                  </span>
                  <button
                    className="btn-glass"
                    style={{ width: 34, height: 34, borderRadius: 'var(--radius-xs)', fontSize: '1.1rem' }}
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    disabled={quantity >= product.stock}
                  >
                    +
                  </button>
                </div>
                <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                  {product.stock} units available in vault
                </span>
              </div>

              {/* Purchase Action Buttons */}
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <button
                  className="btn btn-primary btn-lg glow-amber"
                  style={{ flex: 1, minWidth: 200 }}
                  onClick={handleAddToCart}
                  disabled={adding}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                    shopping_bag
                  </span>
                  {adding ? 'Securing...' : user ? 'Add to Vault Cart' : 'Log In to Purchase'}
                </button>
                <Link
                  to="/cart"
                  className="btn btn-secondary btn-lg glow-cyan"
                  onClick={handleAddToCart}
                >
                  Buy Now
                </Link>
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: '16px 20px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 77, 79, 0.12)',
                border: '1px solid rgba(255, 77, 79, 0.3)',
                color: 'var(--color-danger)',
                marginBottom: 32,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <span className="material-symbols-outlined">info</span>
              <div>
                <strong>Currently Out of Stock</strong>
                <p style={{ fontSize: '0.85rem', margin: 0 }}>This artifact has been temporarily depleted. Check back soon for the next drop.</p>
              </div>
            </div>
          )}

          {/* Interactive Specification Tabs */}
          <div className="glass-panel" style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-lowest)' }}>
              {[
                { id: 'overview', label: 'Specifications' },
                { id: 'shipping', label: 'Shipping & Delivery' },
                { id: 'guarantee', label: 'Authenticity' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    flex: 1,
                    padding: '14px 16px',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    color: activeTab === tab.id ? 'var(--color-accent)' : 'var(--color-text-dim)',
                    borderBottom: activeTab === tab.id ? '2px solid var(--color-accent)' : 'none',
                    background: activeTab === tab.id ? 'var(--color-surface-2)' : 'transparent',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div style={{ padding: 20, fontSize: '0.92rem', color: 'var(--color-text-dim)', lineHeight: 1.6 }}>
              {activeTab === 'overview' && (
                <div>
                  <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <li><strong>Product ID:</strong> {product._id}</li>
                    <li><strong>Domain Category:</strong> {product.category || 'General Artifact'}</li>
                    <li><strong>Vault Inventory:</strong> {product.stock} units tracked</li>
                    <li><strong>Materials & Craft:</strong> Precision machined Obsidian & aerospace titanium alloys.</li>
                  </ul>
                </div>
              )}
              {activeTab === 'shipping' && (
                <div>
                  <p>All items in the Obsidian Vault are dispatched in tamper-evident, sealed stealth packaging.</p>
                  <p style={{ marginTop: 8 }}>Estimated dispatch within 24 hours of payment authorization.</p>
                </div>
              )}
              {activeTab === 'guarantee' && (
                <div>
                  <p>Every piece is cryptographically verified by our automated vault inspector. Comes with certificate of origin.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Related / Similar Products Section */}
      {similar.length > 0 && (
        <section style={{ marginTop: 80 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
            <span className="material-symbols-outlined icon-filled" style={{ color: 'var(--color-secondary)' }}>
              hub
            </span>
            <h2 className="page-title" style={{ margin: 0 }}>
              You Might Also Like
            </h2>
          </div>
          <div className="grid grid-products">
            {similar.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
