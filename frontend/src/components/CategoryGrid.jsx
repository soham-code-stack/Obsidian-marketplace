import { Link } from 'react-router-dom';

const CATEGORY_DEFAULT_IMAGES = {
  'Electronics': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
  'Home & Living': 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=800&q=80',
  'Apparel & Fashion': 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80',
  'Outdoors & Travel': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
  'Plants & Botanicals': 'https://images.unsplash.com/photo-1463320726281-696a485928c7?auto=format&fit=crop&w=800&q=80',
  'Coffee & Brewing': 'https://images.unsplash.com/photo-1572119865084-43c285814d63?auto=format&fit=crop&w=800&q=80',
};

/**
 * Renders a responsive grid of vibrant category tiles. Each tile links to
 * /category/:name, which shows only products in that category.
 */
export default function CategoryGrid({ categories }) {
  if (!categories || categories.length === 0) return null;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 20,
      }}
    >
      {categories.map((c) => {
        const image =
          c.image ||
          CATEGORY_DEFAULT_IMAGES[c.category] ||
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';

        return (
          <Link
            key={c.category}
            to={`/category/${encodeURIComponent(c.category)}`}
            className="group"
            style={{
              position: 'relative',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              aspectRatio: '4 / 3',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface-2)',
              boxShadow: 'var(--shadow-sm)',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: 16,
              transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = 'var(--color-secondary)';
              e.currentTarget.style.boxShadow = 'var(--shadow-glow-cyan)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'var(--color-border)';
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
            }}
          >
            {/* Background Image */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url("${image}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                opacity: 0.9,
                transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
              }}
              className="group-hover:scale-105 group-hover:opacity-75"
            />

            {/* Dark Gradient Overlay */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, rgba(10,10,12,0.05) 0%, rgba(10,10,12,0.55) 100%)',
              }}
            />

            {/* Category Info */}
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '1.1rem', color: '#fff', letterSpacing: '-0.02em' }}>
                  {c.category}
                </strong>
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: 18,
                    color: 'var(--color-secondary)',
                    transform: 'translateX(-4px)',
                    opacity: 0,
                    transition: 'all 0.2s ease',
                  }}
                >
                  arrow_forward
                </span>
              </div>
              <p
                style={{
                  color: 'var(--color-text-dim)',
                  fontSize: '0.82rem',
                  marginTop: 3,
                  fontWeight: 500,
                }}
              >
                {c.count} {c.count === 1 ? 'Artifact' : 'Artifacts'}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}