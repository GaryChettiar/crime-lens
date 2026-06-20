import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useGetCurrentUserQuery } from '@/services/authApi';
import { Shield } from 'lucide-react';
import { getRouteConfig } from '@/config/routes';
import { PermissionGuard } from './PermissionGuard';

export function ProtectedRoute() {
  const { data: user, isLoading, isError } = useGetCurrentUserQuery();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-background text-foreground gap-4">
        <div className="relative flex items-center justify-center">
          <div className="absolute h-16 w-16 animate-ping rounded-full bg-primary/10 border border-primary/20" />
          <div className="absolute h-12 w-12 animate-pulse rounded-full bg-primary/20 border border-primary/45" />
          <Shield className="h-8 w-8 text-primary animate-pulse relative z-10" />
        </div>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest animate-pulse font-sans">
          Verifying Credential Clearance...
        </span>
      </div>
    );
  }

  if (isError || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const routeConfig = getRouteConfig(location.pathname);
  
  if (routeConfig?.requiredPermission) {
    return (
      <PermissionGuard permissions={[routeConfig.requiredPermission]}>
        <Outlet />
      </PermissionGuard>
    );
  }

  return <Outlet />;
}

