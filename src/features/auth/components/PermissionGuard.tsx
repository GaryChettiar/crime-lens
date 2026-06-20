import * as React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { ShieldAlert } from 'lucide-react';
import { AdminLayout } from '@/components/templates/AdminLayout/AdminLayout';

interface PermissionGuardProps {
  permissions: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGuard({
  permissions,
  requireAll = false,
  fallback,
  children,
}: PermissionGuardProps) {
  const { hasAnyPermission, hasAllPermissions } = usePermissions();

  const isAuthorized = React.useMemo(() => {
    if (permissions.length === 0) return true;
    if (requireAll) {
      return hasAllPermissions(permissions);
    }
    return hasAnyPermission(permissions);
  }, [permissions, requireAll, hasAnyPermission, hasAllPermissions]);

  if (isAuthorized) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  // Default premium Access Denied page aligned with dynamic theme variables
  return (
    <AdminLayout>
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
        <div className="max-w-md w-full p-8 text-center space-y-6 flex flex-col items-center rounded-xl border border-border bg-card shadow-lg">
          <div className="h-16 w-16 rounded-full bg-danger/10 flex items-center justify-center border border-danger/25 animate-pulse">
            <ShieldAlert className="h-8 w-8 text-danger" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">
              Access Restricted
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your account does not possess the administrative clearance required to view this panel.
            </p>
          </div>

          <div className="text-xs p-4 rounded-lg border bg-muted/10 font-mono text-left w-full border-border">
            <p className="font-semibold text-foreground mb-1.5">Required Clearance:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              {permissions.map((perm) => (
                <li key={perm} className="break-all font-semibold text-primary">{perm}</li>
              ))}
            </ul>
          </div>

          <a
            href="/dashboard"
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-center transition-colors bg-primary text-primary-foreground hover:bg-primary/95 flex items-center justify-center"
          >
            Return to Operations Center
          </a>
        </div>
      </div>
    </AdminLayout>
  );
}
