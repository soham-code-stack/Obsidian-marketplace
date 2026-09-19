import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

const formatPrice = (cents, currency = 'inr') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format((cents || 0) / 100);

export default function Cart() {
  const { cart, updateItem, removeItem, itemCount } = useCart();
  const { toastSuccess, toastInfo } = useToast();
  const navigate = useNavigate();

  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);

  const subtotal = (cart?.items || []).reduce(
    (sum, item) => sum + (item.product?.price || 0) * item.quantity,
    0
  );

  const discount = promoApplied ? subtotal * 0.1 : 0;
  const shipping = subtotal > 500000 ? 0 : 49900; // Free above ₹5,000
  const finalTotal = subtotal - discount + (subtotal > 0 ? shipping : 0);

  const handleApplyPromo = (e) => {
    e.preventDefault();
    if (!promoCode.trim()) return;
    if (promoCode.toUpperCase() === 'OBSIDIAN10' || promoCode.toUpperCase() === 'VAULT') {
      setPromoApplied(true);
      toastSuccess('Promo code applied: 10% Vault Discount!');
    } else {
      toastInfo('Invalid code. Try "OBSIDIAN10" for 10% off.');
    }
  };

  const handleRemove = (productId, productName) => {
    removeItem(productId);
    toastSuccess(`Removed "${productName || 'Item'}" from cart`);
  };

  if (!cart?.items || cart.items.length === 0) {
    return (
      <div className="container" style={{ paddingTop: 60, paddingBottom: 80 }}>
        <div className="empty-state" style={{ maxWidth: 600, margin: '0 auto' }}>
          <span className="material-symbols-outlined icon" style={{ fontSize: 56 }}>
            shopping_bag
          </span>
          <h2 style={{ fontSize: '1.8rem', marginBottom: 8 }}>Your Vault Cart is Empty</h2>
          <p style={{ color: 'var(--color-text-dim)', marginBottom: 24 }}>
            Explore our curated catalog to discover extraordinary technology and limited artifacts.
          </p>
          <Link to="/search" className="btn btn-primary btn-lg glow-amber">
            <span className="material-symbols-outlined">explore</span>
            Explore The Vault
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 30, paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 28 }}>
        <h1 className="page-title" style={{ margin: 0 }}>
          Your Vault Cart
        </h1>
        <span className="badge badge-amber">{itemCount} items</span>
      </div>

      {/* Cart Grid: Items on Left, Order Summary on Right */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1fr)',
          gap: 32,
          alignItems: 'start',
        }}
        className="cart-layout"
      >
        {/* Left Column: Cart Items */}
        <div className="glass-panel" style={{ overflow: 'hidden', padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-lowest)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-dim)' }}>
              Artifact Items
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {cart.items.map((item) => {
              const p = item.product || {};
              const image = p.images?.[0] || 'https://placehold.co/100x100?text=Item';

              return (
                <div
                  key={p._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 18,
                    padding: '20px',
                    borderBottom: '1px solid var(--color-border)',
                  }}
                  className="cart-item-row"
                >
                  <img
                    src={image}
                    alt={p.name}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 'var(--radius-sm)',
                      objectFit: 'cover',
                      background: 'var(--color-surface-2)',
                    }}
                  />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link
                      to={`/products/${p._id}`}
                      style={{
                        fontSize: '1.05rem',
                        fontWeight: 600,
                        color: 'var(--color-text)',
                        display: 'block',
                        marginBottom: 4,
                      }}
                    >
                      {p.name}
                    </Link>
                    <div style={{ color: 'var(--color-accent)', fontWeight: 700, fontSize: '0.95rem', fontFamily: 'var(--font-mono)' }}>
                      {formatPrice(p.price, p.currency)}
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-surface-2)',
                      padding: 2,
                    }}
                  >
                    <button
                      className="btn-glass"
                      style={{ width: 28, height: 28, padding: 0 }}
                      onClick={() => updateItem(p._id, Math.max(1, item.quantity - 1))}
                    >
                      -
                    </button>
                    <span style={{ minWidth: 32, textAlign: 'center', fontWeight: 600, fontSize: '0.9rem' }}>
                      {item.quantity}
                    </span>
                    <button
                      className="btn-glass"
                      style={{ width: 28, height: 28, padding: 0 }}
                      onClick={() => updateItem(p._id, Math.min(p.stock || 99, item.quantity + 1))}
                    >
                      +
                    </button>
                  </div>

                  {/* Subtotal */}
                  <div style={{ minWidth: 100, textAlign: 'right', fontWeight: 800, color: 'var(--color-text)', fontFamily: 'var(--font-mono)' }}>
                    {formatPrice((p.price || 0) * item.quantity, p.currency)}
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => handleRemove(p._id, p.name)}
                    className="btn-icon btn-glass"
                    style={{ width: 34, height: 34, color: 'var(--color-danger)' }}
                    title="Remove item"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                      delete
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Order Summary Card */}
        <div className="glass-floating" style={{ padding: '28px 24px' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: 20 }}>
            Order Summary
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24, fontSize: '0.95rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-dim)' }}>
              <span>Artifacts Subtotal</span>
              <span style={{ color: 'var(--color-text)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                {formatPrice(subtotal)}
              </span>
            </div>

            {promoApplied && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-success)' }}>
                <span>Vault Promo (10%)</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  -{formatPrice(discount)}
                </span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-dim)' }}>
              <span>Stealth Courier Delivery</span>
              <span style={{ color: shipping === 0 ? 'var(--color-success)' : 'var(--color-text)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                {shipping === 0 ? 'FREE' : formatPrice(shipping)}
              </span>
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', margin: '8px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Total</span>
              <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}>
                {formatPrice(finalTotal)}
              </span>
            </div>
          </div>

          {/* Promo Code Input */}
          <form onSubmit={handleApplyPromo} style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            <input
              type="text"
              placeholder="Promo code (OBSIDIAN10)"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text)',
                fontSize: '0.88rem',
              }}
            />
            <button type="submit" className="btn btn-glass btn-sm">
              Apply
            </button>
          </form>

          {/* Checkout Button */}
          <button
            onClick={() => navigate('/checkout')}
            className="btn btn-primary btn-lg glow-amber"
            style={{ width: '100%' }}
          >
            <span className="material-symbols-outlined">lock</span>
            Proceed to Secure Checkout
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              marginTop: 16,
              fontSize: '0.78rem',
              color: 'var(--color-text-muted)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--color-success)' }}>
              lock
            </span>
            Guaranteed safe checkout powered by Stripe
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .cart-layout {
            grid-template-columns: 1fr !important;
          }
          .cart-item-row {
            flex-wrap: wrap;
          }
        }
      `}</style>
    </div>
  );
}
