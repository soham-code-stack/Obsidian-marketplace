import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import CartDrawer from './CartDrawer';
import api from '../services/api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const searchRef = useRef(null);
  const userMenuRef = useRef(null);

  // Scroll effect for navbar opacity
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setSearchOpen(false);
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search for live navbar preview
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get('/search', { params: { q: searchQuery, limit: 5 } });
        setSearchResults(data.hits || []);
      } catch {
        setSearchResults([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchOpen(false);
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
    navigate('/');
  };

  return (
    <>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          transition: 'all 0.3s ease',
          background: scrolled ? 'rgba(10, 10, 12, 0.88)' : 'rgba(19, 20, 25, 0.72)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--color-border)',
          boxShadow: scrolled ? 'var(--shadow-md)' : 'none',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 72,
            gap: 20,
          }}
        >
          {/* Logo & Brand */}
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              textDecoration: 'none',
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #ffb800 0%, #00eefc 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(255, 184, 0, 0.4)',
              }}
            >
              <span
                className="material-symbols-outlined icon-filled"
                style={{ color: '#0b0c10', fontSize: 24 }}
              >
                diamond
              </span>
            </div>
            <div>
              <div
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  background: 'linear-gradient(90deg, #ffffff 0%, #ffb800 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                OBSIDIAN
              </div>
              <div
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  letterSpacing: '0.18em',
                  color: 'var(--color-text-dim)',
                  textTransform: 'uppercase',
                  marginTop: -3,
                }}
              >
                Marketplace
              </div>
            </div>
          </Link>

          {/* Center: Live Search Bar */}
          <div
            ref={searchRef}
            style={{
              position: 'relative',
              flex: 1,
              maxWidth: 480,
              display: 'none',
            }}
            className="navbar-search-wrapper"
          >
            <form onSubmit={handleSearchSubmit}>
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{
                    position: 'absolute',
                    left: 14,
                    color: 'var(--color-text-dim)',
                    fontSize: 20,
                    pointerEvents: 'none',
                  }}
                >
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search vault, neural tech, artifacts..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchOpen(true);
                  }}
                  onFocus={() => setSearchOpen(true)}
                  style={{
                    width: '100%',
                    padding: '10px 16px 10px 42px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text)',
                    fontSize: '0.9rem',
                    transition: 'all 0.2s ease',
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: 12,
                      color: 'var(--color-text-muted)',
                      padding: 2,
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                      close
                    </span>
                  </button>
                )}
              </div>
            </form>

            {/* Live Search Autocomplete Popup */}
            {searchOpen && searchQuery.trim() && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: 0,
                  right: 0,
                  background: 'var(--color-surface-glass-floating)',
                  backdropFilter: 'var(--blur-floating)',
                  WebkitBackdropFilter: 'var(--blur-floating)',
                  border: '1px solid var(--color-border-hover)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '12px',
                  zIndex: 200,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: 'var(--color-text-dim)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '4px 8px',
                  }}
                >
                  Quick Matches
                </div>
                {searchResults.length === 0 ? (
                  <div style={{ padding: '12px 8px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    No quick results found. Press enter to search all.
                  </div>
                ) : (
                  searchResults.map((item) => (
                    <Link
                      key={item.id || item._id}
                      to={`/products/${item.id || item._id}`}
                      onClick={() => setSearchOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '8px',
                        borderRadius: 'var(--radius-xs)',
                        textDecoration: 'none',
                        color: 'var(--color-text)',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-2)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <img
                        src={item.image || item.images?.[0] || 'https://placehold.co/40x40?text=Item'}
                        alt={item.name}
                        style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--color-accent)', fontWeight: 700 }}>
                          ₹{((item.price || 0) / 100).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </Link>
                  ))
                )}
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 8, marginTop: 4 }}>
                  <Link
                    to={`/search?q=${encodeURIComponent(searchQuery)}`}
                    onClick={() => setSearchOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      fontSize: '0.85rem',
                      color: 'var(--color-secondary)',
                      fontWeight: 600,
                      padding: '6px',
                    }}
                  >
                    View all results for "{searchQuery}"
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                      arrow_forward
                    </span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Navigation Links */}
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
            className="navbar-desktop-links"
          >
            <Link
              to="/search"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '0.92rem',
                fontWeight: 600,
                color: location.pathname === '/search' ? 'var(--color-accent)' : 'var(--color-text)',
                padding: '6px 10px',
                borderRadius: 'var(--radius-xs)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                explore
              </span>
              Explore
            </Link>

            {/* Cart Button with Animated Drawer */}
            <button
              onClick={() => setCartDrawerOpen(true)}
              className="btn-glass"
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 14px',
                borderRadius: 'var(--radius-full)',
              }}
              title="Open cart drawer"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                shopping_cart
              </span>
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Cart</span>
              {itemCount > 0 && (
                <span
                  style={{
                    background: 'var(--color-accent)',
                    color: '#000',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: 'var(--radius-full)',
                    marginLeft: 2,
                    boxShadow: '0 0 8px var(--color-accent-glow)',
                  }}
                >
                  {itemCount}
                </span>
              )}
            </button>

            {/* User Profile / Auth State */}
            {user ? (
              <div ref={userMenuRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '6px 12px 6px 6px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--color-accent) 0%, #ff6b00 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#000',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                    }}
                  >
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, lineHeight: 1.1 }}>
                      {user.name?.split(' ')[0] || 'Account'}
                    </div>
                    <div
                      style={{
                        fontSize: '0.7rem',
                        color: user.role === 'admin' ? 'var(--color-danger)' : user.role === 'seller' ? 'var(--color-secondary)' : 'var(--color-text-dim)',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                      }}
                    >
                      {user.role}
                    </div>
                  </div>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--color-text-dim)' }}>
                    expand_more
                  </span>
                </button>

                {/* Account Dropdown Menu */}
                {userMenuOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 'calc(100% + 8px)',
                      width: 220,
                      background: 'var(--color-surface-glass-floating)',
                      backdropFilter: 'var(--blur-floating)',
                      WebkitBackdropFilter: 'var(--blur-floating)',
                      border: '1px solid var(--color-border-hover)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-lg)',
                      padding: 8,
                      zIndex: 200,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--color-border)' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-dim)' }}>{user.email}</div>
                    </div>

                    <Link
                      to="/orders"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-xs)',
                        fontSize: '0.88rem',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--color-accent)' }}>
                        receipt_long
                      </span>
                      My Orders
                    </Link>

                    {user.role === 'seller' && (
                      <Link
                        to="/seller/dashboard"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '8px 10px',
                          borderRadius: 'var(--radius-xs)',
                          fontSize: '0.88rem',
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--color-secondary)' }}>
                          storefront
                        </span>
                        Seller Dashboard
                      </Link>
                    )}

                    {user.role === 'admin' && (
                      <Link
                        to="/admin/dashboard"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '8px 10px',
                          borderRadius: 'var(--radius-xs)',
                          fontSize: '0.88rem',
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--color-danger)' }}>
                          admin_panel_settings
                        </span>
                        Admin Control
                      </Link>
                    )}

                    <div style={{ borderTop: '1px solid var(--color-border)', margin: '4px 0' }} />

                    <button
                      onClick={handleLogout}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-xs)',
                        fontSize: '0.88rem',
                        color: 'var(--color-danger)',
                        width: '100%',
                        textAlign: 'left',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                        logout
                      </span>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Link to="/login" className="btn btn-glass btn-sm">
                  Log In
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm glow-amber">
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile Menu Hamburger */}
            <button
              className="navbar-mobile-toggle btn-icon btn-glass"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ display: 'none' }}
              aria-label="Toggle menu"
            >
              <span className="material-symbols-outlined">
                {mobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </nav>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div
            style={{
              padding: '16px 20px 24px',
              background: 'var(--color-surface-glass-floating)',
              backdropFilter: 'var(--blur-floating)',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
            className="navbar-mobile-drawer"
          >
            <form onSubmit={handleSearchSubmit} style={{ marginBottom: 8 }}>
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                }}
              />
            </form>
            <Link to="/search" className="btn btn-glass" style={{ justifyContent: 'flex-start' }}>
              <span className="material-symbols-outlined">explore</span> Explore Vault
            </Link>
            <Link to="/cart" className="btn btn-glass" style={{ justifyContent: 'flex-start' }}>
              <span className="material-symbols-outlined">shopping_cart</span> Cart ({itemCount})
            </Link>
            {user && (
              <Link to="/orders" className="btn btn-glass" style={{ justifyContent: 'flex-start' }}>
                <span className="material-symbols-outlined">receipt_long</span> My Orders
              </Link>
            )}
            {user?.role === 'seller' && (
              <Link to="/seller/dashboard" className="btn btn-glass" style={{ justifyContent: 'flex-start' }}>
                <span className="material-symbols-outlined">storefront</span> Seller Dashboard
              </Link>
            )}
            {user?.role === 'admin' && (
              <Link to="/admin/dashboard" className="btn btn-glass" style={{ justifyContent: 'flex-start' }}>
                <span className="material-symbols-outlined">admin_panel_settings</span> Admin Panel
              </Link>
            )}
            {!user ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
                <Link to="/login" className="btn btn-glass">Log In</Link>
                <Link to="/register" className="btn btn-primary">Sign Up</Link>
              </div>
            ) : (
              <button className="btn btn-danger" onClick={handleLogout} style={{ marginTop: 8 }}>
                Logout
              </button>
            )}
          </div>
        )}
      </header>

      {/* Cart Drawer Component */}
      <CartDrawer isOpen={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />

      <style>{`
        @media (min-width: 860px) {
          .navbar-search-wrapper {
            display: block !important;
          }
        }
        @media (max-width: 859px) {
          .navbar-mobile-toggle {
            display: inline-flex !important;
          }
        }
      `}</style>
    </>
  );
}
