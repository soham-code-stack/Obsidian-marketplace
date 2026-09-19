import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import ProductCard from '../components/ProductCard';
import CategoryGrid from '../components/CategoryGrid';

const formatPrice = (cents, currency = 'inr') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format((cents || 0) / 100);

export default function Home() {
  const { user } = useAuth();
  const { addItem } = useCart();
  const { toastSuccess, toastError } = useToast();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [spotlightAdding, setSpotlightAdding] = useState(false);

  // Flash Deals Countdown Timer
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 35, seconds: 18 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 12, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [categoriesRes, productsRes] = await Promise.all([
          api.get('/products/categories'),
          api.get('/products', { params: { limit: 100 } }),
        ]);
        setCategories(categoriesRes.data.categories || []);
        setProducts(productsRes.data.products || []);

        if (user) {
          try {
            const rec = await api.get('/recommendations/for-you');
            setRecommended(rec.data.products || []);
          } catch {
            setRecommended([]);
          }
        }
      } catch (err) {
        console.error('Failed loading homepage data:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterSubscribed(true);
    toastSuccess('Transmission received. Welcome to the Obsidian Vault.');
    setNewsletterEmail('');
  };

  const filteredProducts =
    selectedCategory === 'All'
      ? products
      : products.filter(
          (p) =>
            p.category &&
            p.category.trim().toLowerCase() === selectedCategory.trim().toLowerCase()
        );

  const spotlightProduct =
    products.find(
      (p) =>
        p.name?.toLowerCase().includes('sonic obsidian pro') ||
        p.name?.toLowerCase().includes('sonic')
    ) ||
    products.find((p) => p.category === 'Electronics') ||
    products[0] || {
      _id: '',
      name: 'Sonic Obsidian Pro ANC Headphones',
      price: 2499900,
      compareAtPrice: 2999900,
      images: [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
      ],
      description:
        'Audiophile-grade acoustic fidelity with zero-gravity titanium frame and adaptive active noise cancellation.',
      category: 'Electronics',
      stock: 15,
    };

  const featuredDealProduct =
    products.find(
      (p) =>
        p.name?.toLowerCase().includes('turntable') ||
        p.name?.toLowerCase().includes('walnut')
    ) ||
    products[1] ||
    products[0] || {
      _id: '',
      name: 'Portable Bluetooth Turntable',
      price: 499900,
      compareAtPrice: 599900,
      images: [
        'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=800&q=80',
      ],
      description: 'Compact belt-drive vinyl record turntable with built-in Bluetooth.',
    };

  const handleSpotlightQuickAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!spotlightProduct._id || spotlightProduct.stock === 0) return;
    setSpotlightAdding(true);
    try {
      await addItem(spotlightProduct._id, 1);
      toastSuccess(`Added "${spotlightProduct.name}" to your cart!`);
    } catch (err) {
      toastError(err.response?.data?.message || 'Could not add to cart');
    } finally {
      setSpotlightAdding(false);
    }
  };

  return (
    <div style={{ paddingBottom: 80, overflowX: 'hidden' }}>
      {/* 1. HERO SECTION */}
      <section
        style={{
          position: 'relative',
          padding: '60px 0 80px',
          overflow: 'hidden',
        }}
      >
        {/* Glow Spheres */}
        <div
          style={{
            position: 'absolute',
            top: '-10%',
            left: '15%',
            width: 450,
            height: 450,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 184, 0, 0.15) 0%, transparent 70%)',
            filter: 'blur(80px)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '0%',
            right: '10%',
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0, 238, 252, 0.12) 0%, transparent 70%)',
            filter: 'blur(90px)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />

        <div
          className="hero-grid container"
          style={{
            position: 'relative',
            zIndex: 1,
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)',
            gap: 40,
            alignItems: 'center',
          }}
        >
          {/* Left: Headline & Actions */}
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(255, 184, 0, 0.1)',
                border: '1px solid rgba(255, 184, 0, 0.3)',
                marginBottom: 20,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: 'var(--color-accent)',
                  boxShadow: '0 0 10px var(--color-accent)',
                }}
              />
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--color-accent)',
                }}
              >
                Vanguard Obsidian Collection
              </span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(2.5rem, 5vw, 3.8rem)',
                fontWeight: 800,
                lineHeight: 1.1,
                marginBottom: 20,
                letterSpacing: '-0.04em',
              }}
            >
              Discover <br />
              <span className="text-gradient-vibrant">Extraordinary</span> <br />
              Products.
            </h1>

            <p
              style={{
                fontSize: '1.1rem',
                color: 'var(--color-text-dim)',
                maxWidth: 520,
                lineHeight: 1.6,
                marginBottom: 32,
              }}
            >
              Curated artifacts and cutting-edge tech for the modern aesthete.
              Experience high-end craftsmanship, verified sellers, and seamless payments.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
              <a href="#vault" className="btn btn-primary btn-lg glow-amber">
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                  lock_open
                </span>
                Explore The Vault
              </a>
              <Link to="/search" className="btn btn-secondary btn-lg glow-cyan">
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                  explore
                </span>
                Search Catalog
              </Link>
            </div>

            {/* Quick Metrics */}
            <div
              style={{
                display: 'flex',
                gap: 28,
                marginTop: 40,
                paddingTop: 24,
                borderTop: '1px solid var(--color-border)',
              }}
            >
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text)' }}>
                  100%
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>
                  Buyer Protection
                </div>
              </div>
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-accent)' }}>
                  ₹0
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>
                  Free Express Shipping
                </div>
              </div>
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-secondary)' }}>
                  Instant
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-dim)' }}>
                  Stripe Checkout
                </div>
              </div>
            </div>
          </div>

          {/* Right: Floating Glass Spotlight */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <div
              className="glass-floating"
              style={{
                width: '100%',
                maxWidth: 390,
                padding: 24,
                position: 'relative',
                animation: 'floatAnim 6s ease-in-out infinite',
                cursor: 'pointer',
              }}
              onClick={() => {
                if (spotlightProduct._id) {
                  navigate(`/products/${spotlightProduct._id}`);
                }
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
              >
                <span className="badge badge-amber">Exclusive Spotlight</span>
                <span className="material-symbols-outlined" style={{ color: 'var(--color-accent)' }}>
                  workspace_premium
                </span>
              </div>

              <div
                style={{
                  width: '100%',
                  aspectRatio: '4 / 3',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                  marginBottom: 16,
                  background: 'var(--color-surface-3)',
                }}
              >
                <img
                  src={spotlightProduct.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'}
                  alt={spotlightProduct.name}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80';
                  }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                {spotlightProduct.category && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                    {spotlightProduct.category}
                  </span>
                )}
                {spotlightProduct.stock > 0 && (
                  <span className="badge badge-success" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                    In Stock
                  </span>
                )}
              </div>

              <h3 style={{ fontSize: '1.25rem', marginBottom: 6 }}>{spotlightProduct.name}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-dim)', marginBottom: 16, lineHeight: 1.45 }}>
                {spotlightProduct.description || 'Audiophile-grade acoustic fidelity with zero-gravity titanium frame.'}
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div>
                  {spotlightProduct.compareAtPrice && spotlightProduct.compareAtPrice > spotlightProduct.price && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', textDecoration: 'line-through' }}>
                      {formatPrice(spotlightProduct.compareAtPrice, spotlightProduct.currency)}
                    </span>
                  )}
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}>
                    {formatPrice(spotlightProduct.price, spotlightProduct.currency)}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {spotlightProduct._id && (
                    <button
                      onClick={handleSpotlightQuickAdd}
                      disabled={spotlightAdding || spotlightProduct.stock === 0}
                      className="btn btn-glass btn-sm"
                      title="Add to Cart"
                      style={{ padding: '8px 12px' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                        {spotlightAdding ? 'hourglass_top' : 'shopping_bag'}
                      </span>
                    </button>
                  )}
                  <Link
                    to={spotlightProduct._id ? `/products/${spotlightProduct._id}` : '/search'}
                    className="btn btn-primary btn-sm glow-amber"
                    onClick={(e) => e.stopPropagation()}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    Inspect & Buy
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TRUST HIGHLIGHTS BAR */}
      <section className="container" style={{ marginBottom: 50 }}>
        <div
          className="glass-panel"
          style={{
            padding: '20px 28px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'var(--color-accent)' }}>
              verified_user
            </span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Verified Authentic</div>
              <div style={{ color: 'var(--color-text-dim)', fontSize: '0.78rem' }}>100% vetted sellers & items</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'var(--color-secondary)' }}>
              bolt
            </span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Lightning Dispatch</div>
              <div style={{ color: 'var(--color-text-dim)', fontSize: '0.78rem' }}>Priority courier tracking</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'var(--color-success)' }}>
              lock
            </span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Stripe Encrypted</div>
              <div style={{ color: 'var(--color-text-dim)', fontSize: '0.78rem' }}>Bank-grade payment security</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 32, color: 'var(--color-accent)' }}>
              replay
            </span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Hassle-Free Returns</div>
              <div style={{ color: 'var(--color-text-dim)', fontSize: '0.78rem' }}>7-day seamless policy</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FLASH PROTOCOL DEALS SECTION */}
      <section className="container" style={{ marginBottom: 60 }}>
        <div
          className="glass-floating"
          style={{
            padding: '36px 32px',
            border: '1px solid rgba(255, 77, 79, 0.25)',
            background: 'linear-gradient(135deg, rgba(26, 28, 36, 0.95) 0%, rgba(40, 15, 20, 0.6) 100%)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -50,
              right: -50,
              width: 250,
              height: 250,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255, 77, 79, 0.2) 0%, transparent 70%)',
              filter: 'blur(50px)',
              pointerEvents: 'none',
            }}
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 32,
              alignItems: 'center',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span className="material-symbols-outlined icon-filled" style={{ color: 'var(--color-danger)', fontSize: 20 }}>
                  local_fire_department
                </span>
                <span className="badge badge-danger">Flash Protocol Active</span>
              </div>

              <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 10, letterSpacing: '-0.02em' }}>
                Terminal Velocity Drop
              </h2>
              <p style={{ color: 'var(--color-text-dim)', fontSize: '0.95rem', marginBottom: 24, maxWidth: 460 }}>
                Access restricted prototype drops before the countdown terminates. Stock is strictly capped.
              </p>

              {/* Countdown UI */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    padding: '10px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-surface-lowest)',
                    border: '1px solid var(--color-border)',
                    textAlign: 'center',
                    minWidth: 70,
                  }}
                >
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                    {String(timeLeft.hours).padStart(2, '0')}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                    Hours
                  </div>
                </div>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-dim)' }}>:</span>
                <div
                  style={{
                    padding: '10px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-surface-lowest)',
                    border: '1px solid var(--color-border)',
                    textAlign: 'center',
                    minWidth: 70,
                  }}
                >
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                    Mins
                  </div>
                </div>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-dim)' }}>:</span>
                <div
                  style={{
                    padding: '10px 16px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-surface-lowest)',
                    border: '1px solid rgba(255, 77, 79, 0.4)',
                    textAlign: 'center',
                    minWidth: 70,
                  }}
                >
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-danger)', fontFamily: 'var(--font-mono)' }}>
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-danger)', textTransform: 'uppercase' }}>
                    Secs
                  </div>
                </div>
              </div>
            </div>

            {/* Featured Flash Item */}
            <div
              style={{
                display: 'flex',
                gap: 20,
                alignItems: 'center',
                padding: 16,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(10, 10, 12, 0.6)',
                border: '1px solid var(--color-border)',
              }}
            >
              <img
                src={featuredDealProduct.images?.[0] || 'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=800&q=80'}
                alt={featuredDealProduct.name}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=800&q=80';
                }}
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 'var(--radius-sm)',
                  objectFit: 'cover',
                }}
              />
              <div style={{ flex: 1 }}>
                <span className="badge badge-amber" style={{ marginBottom: 6 }}>
                  30% OFF Limited Drop
                </span>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>
                  {featuredDealProduct.name}
                </h4>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}>
                    {formatPrice(featuredDealProduct.price, featuredDealProduct.currency)}
                  </span>
                  {featuredDealProduct.compareAtPrice && featuredDealProduct.compareAtPrice > featuredDealProduct.price && (
                    <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', textDecoration: 'line-through' }}>
                      {formatPrice(featuredDealProduct.compareAtPrice, featuredDealProduct.currency)}
                    </span>
                  )}
                </div>
                <Link
                  to={featuredDealProduct._id ? `/products/${featuredDealProduct._id}` : '/search'}
                  className="btn btn-primary btn-sm glow-amber"
                >
                  Claim Deal
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CATEGORIES SECTION */}
      {categories.length > 0 && (
        <section className="container" style={{ marginBottom: 60 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
            <div>
              <h2 className="page-title" style={{ marginBottom: 4 }}>
                Shop by Domain
              </h2>
              <p style={{ color: 'var(--color-text-dim)', fontSize: '0.95rem' }}>
                Curated departments engineered for excellence.
              </p>
            </div>
            <Link
              to="/search"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                color: 'var(--color-secondary)',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              Browse All <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
            </Link>
          </div>
          <CategoryGrid categories={categories} />
        </section>
      )}

      {/* 5. RECOMMENDED FOR YOU (FOR LOGGED IN USERS) */}
      {recommended.length > 0 && (
        <section className="container" style={{ marginBottom: 60 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <span className="material-symbols-outlined icon-filled" style={{ color: 'var(--color-accent)', fontSize: 26 }}>
              auto_awesome
            </span>
            <h2 className="page-title" style={{ margin: 0 }}>
              Tailored for You
            </h2>
          </div>
          <div className="grid grid-products">
            {recommended.map((p) => (
              <ProductCard key={p._id || p.productId} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* 6. THE VAULT / ALL PRODUCTS GRID */}
      <section id="vault" className="container" style={{ marginBottom: 70 }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            marginBottom: 28,
          }}
        >
          <div>
            <h2 className="page-title" style={{ marginBottom: 4 }}>
              The Vault
            </h2>
            <p style={{ color: 'var(--color-text-dim)', fontSize: '0.95rem' }}>
              Explore the entire index of vanguard artifacts.
            </p>
          </div>

          {/* Interactive Category Filter Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button
              onClick={() => setSelectedCategory('All')}
              className={`btn btn-sm ${selectedCategory === 'All' ? 'btn-primary' : 'btn-glass'}`}
            >
              All Items ({products.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.category}
                onClick={() => setSelectedCategory(cat.category)}
                className={`btn btn-sm ${selectedCategory.toLowerCase() === cat.category.toLowerCase() ? 'btn-primary' : 'btn-glass'}`}
              >
                {cat.category} ({cat.count})
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            <span className="material-symbols-outlined icon" style={{ animation: 'pulseGlow 1.5s infinite' }}>
              hourglass_top
            </span>
            <p>Accessing the vault...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-state">
            <span className="material-symbols-outlined icon">inventory_2</span>
            <p>No products found in this category.</p>
          </div>
        ) : (
          <div className="grid grid-products">
            {filteredProducts.map((p) => (
              <ProductCard key={p._id || p.productId} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* 7. NEWSLETTER TRANSMISSION */}
      <section className="container" style={{ marginBottom: 30 }}>
        <div
          className="glass-floating"
          style={{
            padding: '48px 32px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid rgba(255, 184, 0, 0.25)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 400,
              height: 400,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255, 184, 0, 0.08) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          <span
            className="material-symbols-outlined icon-filled"
            style={{ fontSize: 36, color: 'var(--color-accent)', marginBottom: 14 }}
          >
            all_inclusive
          </span>

          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 10, letterSpacing: '-0.02em' }}>
            Join the Obsidian Transmission
          </h2>
          <p style={{ color: 'var(--color-text-dim)', fontSize: '1rem', maxWidth: 500, margin: '0 auto 28px' }}>
            Subscribe for classified drops, secret release windows, and invite-only hardware auctions.
          </p>

          {newsletterSubscribed ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 24px',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(0, 230, 118, 0.15)',
                border: '1px solid rgba(0, 230, 118, 0.4)',
                color: 'var(--color-success)',
                fontWeight: 600,
              }}
            >
              <span className="material-symbols-outlined">check_circle</span>
              Transmission Active. You are on the priority list.
            </div>
          ) : (
            <form
              onSubmit={handleNewsletterSubmit}
              style={{
                display: 'flex',
                maxWidth: 480,
                margin: '0 auto',
                gap: 10,
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              <input
                type="email"
                placeholder="Enter transmission address (email)..."
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                required
                style={{
                  flex: 1,
                  minWidth: 240,
                  padding: '12px 18px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-surface-lowest)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                  fontSize: '0.95rem',
                }}
              />
              <button type="submit" className="btn btn-primary glow-amber" style={{ padding: '12px 24px' }}>
                Initialize
              </button>
            </form>
          )}
        </div>
      </section>

      <style>{`
        @media (max-width: 900px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            text-align: center;
          }
          .hero-grid p {
            margin-left: auto;
            margin-right: auto;
          }
          .hero-grid div {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}