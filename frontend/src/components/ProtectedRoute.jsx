import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Wrap a route element to require authentication, optionally restricted to
 * specific roles. Usage:
 *   <Route path="/seller/dashboard" element={
 *     <ProtectedRoute roles={['seller']}><SellerDashboard /></ProtectedRoute>
 *   } />
 */
export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="container empty-state">Loading...</div>;

  if (!user) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

