import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { hasStoredAuthSession } from '@/services/authStorage';
import { useGetCurrentUserQuery } from '@/services/authApi';
import { getRouteConfig } from '@/config/routes';
import usePermissions from '@/hooks/usePermissions';

export function ProtectedRoute() {
  const location = useLocation();
  const isAuthenticated = hasStoredAuthSession();
  const { data: currentUser } = useGetCurrentUserQuery(undefined, { skip: !isAuthenticated });
  const { hasPermission, isLoading: permsLoading } = usePermissions();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // wait for current user to load
  if (!currentUser) return null;

  // wait for permissions to load if role lookup is in progress
  if (permsLoading) return null;

  const route = getRouteConfig(location.pathname);
  if (route?.requiredPermission && !hasPermission(route.requiredPermission)) {
    console.log(route.requiredPermission, currentUser.permissions);
    return <Navigate to="/no-access" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
