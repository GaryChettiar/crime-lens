import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { hasStoredAuthSession } from '@/services/authStorage';
import { useGetCurrentUserQuery } from '@/services/authApi';
import { getDefaultRedirectPath, getRouteConfig } from '@/config/routes';
import usePermissions from '@/hooks/usePermissions';

export function ProtectedRoute() {
  const location = useLocation();
  const skipAuth = import.meta.env.VITE_SKIP_AUTH === 'true';

  if (skipAuth) {
    return <Outlet />;
  }

  const isAuthenticated = hasStoredAuthSession();
  const {
    data: currentUser,
    isLoading,
    isFetching,
    isError,
  } = useGetCurrentUserQuery(undefined, { skip: !isAuthenticated });
  const { hasPermission, isLoading: permsLoading } = usePermissions();

  if (!hasStoredAuthSession()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Wait for /auth/me (including silent token refresh + retry on 401/403)
  if (isLoading || isFetching || (!currentUser && !isError)) {
    return null;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // wait for permissions to load if role lookup is in progress
  if (permsLoading) return null;

  const route = getRouteConfig(location.pathname);
  if (route?.requiredPermission && !hasPermission(route.requiredPermission)) {
    console.log(route.requiredPermission, currentUser.permissions);
    return <Navigate to={getDefaultRedirectPath(hasPermission)} replace />;
  }

  return <Outlet />;
}
