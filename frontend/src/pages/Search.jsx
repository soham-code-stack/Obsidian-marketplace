import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import ProductCard from '../components/ProductCard';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch available categories for filter chips
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await api.get('/products/categories');
        setCategories(data.categories || []);
      } catch (e) {
        console.error(e);
      }
    };
    fetchCategories();
  }, []);

  const runSearch = useCallback(async (q, sortValue, catValue) => {
    setLoading(true);
    try {
      const { data } = await api.get('/search', {
        params: {
          q: q || undefined,
          sort: sortValue || undefined,
          category: catValue || undefined,
        },
      });
      setResults(data.hits || []);
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update query when searchParams change
  useEffect(() => {
    const q = searchParams.get('q') || '';
    setQuery(q);
  }, [searchParams]);

  // Debounced live search
  useEffect(() => {
    const timer = setTimeout(() => {
      runSearch(query, sort, category);
      if (query) {
        setSearchParams({ q: query }, { replace: true });
      } else {
        setSearchParams({}, { replace: true });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, sort, category, runSearch, setSearchParams]);

  return (
    <div className="container" style={{ paddingTop: 30, paddingBottom: 80 }}>
      {/* Search Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 className="page-title" style={{ marginBottom: 8 }}>
          Artifact Discovery
        </h1>
        <p style={{ color: 'var(--color-text-dim)', fontSize: '0.95rem' }}>
          Query neural tech, wearables, limited editions, and curated collectibles.
        </p>
      </div>

      {/* Search & Filter Controls */}
      <div
        className="glass-panel"
        style={{
          padding: 20,
          borderRadius: 'var(--radius-md)',
          marginBottom: 32,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {/* Main search bar */}
          <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
            <span
              className="material-symbols-outlined"
              style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-muted)',
                fontSize: 20,
              }}
            >
              search
            </span>
            <input
              type="text"
              placeholder="Search across all categories, tags, or names..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px 12px 42px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
                fontSize: '0.95rem',
              }}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-text-muted)',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  close
                </span>
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{
              padding: '12px 18px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-surface-2)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
              fontSize: '0.92rem',
              cursor: 'pointer',
            }}
          >
            <option value="">Sort: Relevance</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="newest">Newest Drops</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>

        {/* Category Filter Chips */}
        {categories.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', paddingTop: 8, borderTop: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Category:
            </span>
            <button
              onClick={() => setCategory('')}
              className={`btn btn-sm ${category === '' ? 'btn-primary' : 'btn-glass'}`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.category}
                onClick={() => setCategory(c.category === category ? '' : c.category)}
                className={`btn btn-sm ${category === c.category ? 'btn-primary' : 'btn-glass'}`}
              >
                {c.category} ({c.count})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>
            {query ? `Results for "${query}"` : 'All Catalog Items'}
          </span>
          <span className="badge badge-amber">{results.length} found</span>
        </div>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="empty-state">
          <span className="material-symbols-outlined icon" style={{ animation: 'pulseGlow 1.5s infinite' }}>
            manage_search
          </span>
          <p>Querying the vault index...</p>
        </div>
      ) : results.length === 0 ? (
        <div className="empty-state">
          <span className="material-symbols-outlined icon">search_off</span>
          <h2>No matching artifacts found</h2>
          <p style={{ marginTop: 8 }}>Try adjusting your keywords or clearing the category filters.</p>
          <button
            onClick={() => {
              setQuery('');
              setCategory('');
              setSort('');
            }}
            className="btn btn-glass"
            style={{ marginTop: 18 }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-products">
          {results.map((p) => (
            <ProductCard key={p.id || p._id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
