import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useGetCurrentUserQuery } from '@/services/authApi';

/** Blocks every command-center route until Catalyst verifies a live session. */
export function ProtectedRoute() {
  const { data: user, isLoading, isError } = useGetCurrentUserQuery();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-background text-foreground">
        <div className="relative flex items-center justify-center">
          <div className="absolute h-16 w-16 animate-ping rounded-full border border-primary/20 bg-primary/10" />
          <div className="absolute h-12 w-12 animate-pulse rounded-full border border-primary/45 bg-primary/20" />
          <Shield className="relative z-10 h-8 w-8 animate-pulse text-primary" />
        </div>
        <span className="font-sans text-xs font-semibold uppercase tracking-widest text-muted-foreground animate-pulse">
          Verifying credential clearance...
        </span>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  return <Outlet />;
}
