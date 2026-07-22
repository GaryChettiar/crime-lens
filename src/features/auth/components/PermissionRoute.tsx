import { Outlet } from 'react-router-dom';
import { PermissionGuard } from './PermissionGuard';

interface PermissionRouteProps {
  permissions: string[];
  requireAll?: boolean;
}

/**
 * Route-level permission gate. Nest routes inside this component to protect
 * an entire page or route group with the supplied backend permission names.
 */
export function PermissionRoute({ permissions, requireAll = false }: PermissionRouteProps) {
  return (
    <PermissionGuard permissions={permissions} requireAll={requireAll}>
      <Outlet />
    </PermissionGuard>
  );
}
