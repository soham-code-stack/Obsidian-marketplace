import { useEffect, useState, useRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

function CheckoutForm({ orderId }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError('');

    // FIX: redirect: 'if_required' tells Stripe to only navigate away for
    // payment methods that truly require it (e.g. 3D Secure / bank
    // redirects). For a standard test card, this means confirmPayment
    // resolves right here in the SPA instead of doing a full page reload —
    // which was wiping the in-memory access token and causing the
    // "logged out after paying" bug. We now navigate programmatically on
    // success, which is a client-side route change and does NOT reload the
    // page or clear auth state.
    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/orders/${orderId}`,
      },
      redirect: 'if_required',
    });

    if (stripeError) {
      setError(stripeError.message);
      setSubmitting(false);
      return;
    }

    if (paymentIntent && paymentIntent.status === 'succeeded') {
      // Client-side navigation — no page reload, session stays intact.
      navigate(`/orders/${orderId}`);
    } else {
      // Payment method required an off-app redirect (handled automatically
      // by Stripe already), or is still processing — nothing more to do here.
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form" style={{ maxWidth: 480 }}>
      <PaymentElement />
      {error && <span className="error-text">{error}</span>}
      <button type="submit" className="btn btn-primary" disabled={!stripe || submitting}>
        {submitting ? 'Processing...' : 'Pay Now'}
      </button>
      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-dim)' }}>
        Test mode — use card number 4242 4242 4242 4242, any future expiry, any CVC.
      </p>
    </form>
  );
}

export default function Checkout() {
  const [clientSecret, setClientSecret] = useState('');
  const [orderId, setOrderId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const hasCreatedSession = useRef(false);

  useEffect(() => {
    if (hasCreatedSession.current) return;
    hasCreatedSession.current = true;

    const createSession = async () => {
      try {
        const { data } = await api.post('/orders/checkout', {});
        setClientSecret(data.clientSecret);
        setOrderId(data.orderId);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not start checkout');
      } finally {
        setLoading(false);
      }
    };
    createSession();
  }, []);

  if (loading) return <div className="container empty-state">Preparing checkout...</div>;
  if (error) return <div className="container empty-state error-text">{error}</div>;

  return (
    <div className="container" style={{ paddingTop: 30, paddingBottom: 60 }}>
      <h1 className="page-title">Checkout</h1>
      {clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night' } }}>
          <CheckoutForm orderId={orderId} />
        </Elements>
      )}
    </div>
  );
}