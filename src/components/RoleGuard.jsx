import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isAdmin } from '../services/userService';

export default function RoleGuard({ children, requireAdmin = false }) {
  const { userProfile, currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  if (requireAdmin && !isAdmin(userProfile)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="card max-w-md mx-auto text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this page. Admin access required.
          </p>
          <p className="text-gray-500 text-sm mb-4">
            This page is restricted to administrators only. As a cashier, you have access to POS, Order History, and Online Orders.
          </p>
          <a href="/pos" className="btn-primary inline-block">
            Go to POS
          </a>
        </div>
      </div>
    );
  }

  return children;
}