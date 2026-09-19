export default function Modal({ children, onClose }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 20,
      }}
      onClick={onClose}
    >
      <div className="card" style={{ maxWidth: 420, width: '100%' }} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
