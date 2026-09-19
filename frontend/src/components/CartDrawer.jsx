import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const formatPrice = (cents, currency = 'inr') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format((cents || 0) / 100);

export default function CartDrawer({ isOpen, onClose }) {
  const { cart, updateItem, removeItem, itemCount } = useCart();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const total = (cart?.items || []).reduce(
    (sum, item) => sum + (item.product?.price || 0) * item.quantity,
    0
  );

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  const handleViewCart = () => {
    onClose();
    navigate('/cart');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        justifyContent: 'flex-end',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          height: '100%',
          background: 'var(--color-surface-glass-floating)',
          backdropFilter: 'var(--blur-floating)',
          WebkitBackdropFilter: 'var(--blur-floating)',
          borderLeft: '1px solid var(--color-border-hover)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
          animation: 'slideLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--color-accent)' }}>
              shopping_bag
            </span>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Your Vault Cart</h3>
            <span className="badge badge-amber">{itemCount} items</span>
          </div>
          <button
            className="btn-icon btn-glass"
            onClick={onClose}
            style={{ width: 34, height: 34, borderRadius: '50%' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              close
            </span>
          </button>
        </div>

        {/* Item List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {(!cart?.items || cart.items.length === 0) ? (
            <div className="empty-state" style={{ margin: 'auto 0' }}>
              <span className="material-symbols-outlined icon">shopping_cart</span>
              <p>Your cart is empty.</p>
              <button
                className="btn btn-primary btn-sm"
                style={{ marginTop: 14 }}
                onClick={onClose}
              >
                Start Exploring
              </button>
            </div>
          ) : (
            cart.items.map((item) => {
              const product = item.product || {};
              const image = product.images?.[0] || 'https://placehold.co/100x100?text=Item';
              return (
                <div
                  key={product._id}
                  style={{
                    display: 'flex',
                    gap: 14,
                    padding: 12,
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--color-surface-2)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <img
                    src={image}
                    alt={product.name}
                    style={{
                      width: 68,
                      height: 68,
                      borderRadius: 'var(--radius-xs)',
                      objectFit: 'cover',
                      background: 'var(--color-surface-3)',
                    }}
                  />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Link
                          to={`/products/${product._id}`}
                          onClick={onClose}
                          style={{
                            fontWeight: 600,
                            fontSize: '0.92rem',
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {product.name}
                        </Link>
                        <button
                          onClick={() => removeItem(product._id)}
                          style={{ color: 'var(--color-text-muted)', padding: 2 }}
                          title="Remove item"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                            delete
                          </span>
                        </button>
                      </div>
                      <div style={{ color: 'var(--color-accent)', fontWeight: 700, fontSize: '0.95rem', marginTop: 2 }}>
                        {formatPrice(product.price, product.currency)}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                      <button
                        className="btn-glass"
                        style={{ width: 26, height: 26, padding: 0, borderRadius: 4 }}
                        onClick={() => updateItem(product._id, Math.max(1, item.quantity - 1))}
                      >
                        -
                      </button>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, minWidth: 20, textAlign: 'center' }}>
                        {item.quantity}
                      </span>
                      <button
                        className="btn-glass"
                        style={{ width: 26, height: 26, padding: 0, borderRadius: 4 }}
                        onClick={() => updateItem(product._id, Math.min(product.stock || 99, item.quantity + 1))}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {cart?.items?.length > 0 && (
          <div
            style={{
              padding: '20px 24px',
              borderTop: '1px solid var(--color-border)',
              background: 'var(--color-surface-lowest)',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--color-text-dim)', fontSize: '0.95rem' }}>Subtotal</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}>
                {formatPrice(total)}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-glass" style={{ flex: 1 }} onClick={handleViewCart}>
                View Cart
              </button>
              <button className="btn btn-primary glow-amber" style={{ flex: 1 }} onClick={handleCheckout}>
                Checkout
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideLeft {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
