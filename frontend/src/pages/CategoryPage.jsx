import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import ProductCard from '../components/ProductCard';

export default function CategoryPage() {
  const { name } = useParams();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async (page = 1) => {
      setLoading(true);
      try {
        const { data } = await api.get('/products', {
          params: { category: name, page, limit: 24 },
        });
        setProducts(data.products || []);
        setPagination(data.pagination || { page: 1, pages: 1, total: data.products?.length || 0 });
      } catch (e) {
        console.error('Failed to load category products:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [name]);

  const goToPage = async (page) => {
    setLoading(true);
    try {
      const { data } = await api.get('/products', {
        params: { category: name, page, limit: 24 },
      });
      setProducts(data.products || []);
      setPagination(data.pagination);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: 30, paddingBottom: 80 }}>
      {/* Category Hero Banner */}
      <div
        className="glass-floating"
        style={{
          padding: '36px 32px',
          marginBottom: 36,
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid var(--color-border-hover)',
        }}
      >
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '0.85rem',
              color: 'var(--color-text-dim)',
              marginBottom: 16,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              arrow_back
            </span>
            Return to Vault Home
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ fontSize: '2.4rem', fontWeight: 800, margin: 0, textTransform: 'capitalize' }}>
              {decodeURIComponent(name)}
            </h1>
            {pagination.total !== undefined && (
              <span className="badge badge-amber">{pagination.total} artifacts</span>
            )}
          </div>
          <p style={{ color: 'var(--color-text-dim)', fontSize: '0.95rem', marginTop: 6 }}>
            Viewing all verified releases under the {decodeURIComponent(name)} sector.
          </p>
        </div>
      </div>

      {/* Grid or Empty/Loading State */}
      {loading ? (
        <div className="empty-state">
          <span className="material-symbols-outlined icon" style={{ animation: 'pulseGlow 1.5s infinite' }}>
            hourglass_top
          </span>
          <p>Retrieving sector inventory...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <span className="material-symbols-outlined icon">category</span>
          <h2>No items in this sector yet</h2>
          <p style={{ marginTop: 8 }}>Check back soon or explore other domain sectors.</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: 20 }}>
            Explore All Categories
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-products">
            {products.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 40 }}>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`btn ${p === pagination.page ? 'btn-primary' : 'btn-glass'}`}
                  style={{ minWidth: 40, padding: '8px 14px' }}
                  onClick={() => goToPage(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}