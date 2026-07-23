import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { hasStoredAuthSession } from '@/services/authStorage';

export function ProtectedRoute() {
  const location = useLocation();
  const isAuthenticated = hasStoredAuthSession();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
