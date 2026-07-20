import { useMemo } from 'react';
import { useGetCurrentUserQuery } from '@/services/authApi';

/* =============================================================================
   CrimeLens — usePermissions Hook
   =============================================================================
   Resolves the current user's permissions from their API-provided role data.
   No longer depends on the rbacSlice — permissions come from the backend.
   ============================================================================= */

export function usePermissions() {
  const { data: currentUser } = useGetCurrentUserQuery();

  const permissions = useMemo(() => {
    if (!currentUser) return [];

    // Use explicit permissions from the user's profile if available
    if (currentUser.permissions && currentUser.permissions.length > 0) {
      return currentUser.permissions;
    }

    return [];
  }, [currentUser]);

  const hasPermission = useMemo(
    () => (permission: string): boolean => {
      if (!currentUser) return false;
      // Admin roles always have all permissions
      const role = currentUser.role?.toLowerCase();
      if (
        role === 'super_admin' ||
        role === 'admin' ||
        role === 'superadmin' ||
        role === 'app administrator'
      ) {
        return true;
      }
      return permissions.includes(permission);
    },
    [currentUser, permissions],
  );

  const hasAnyPermission = useMemo(
    () => (perms: string[]): boolean => {
      return perms.some((p) => hasPermission(p));
    },
    [hasPermission],
  );

  const hasAllPermissions = useMemo(
    () => (perms: string[]): boolean => {
      return perms.every((p) => hasPermission(p));
    },
    [hasPermission],
  );

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    currentUser,
  };
}
