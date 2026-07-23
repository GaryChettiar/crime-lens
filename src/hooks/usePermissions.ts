import { useMemo } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';
import { useGetCurrentUserQuery } from '@/services/authApi';
import { useGetRoleByIdQuery } from '@/services/rolesApi';

/* =============================================================================
   CrimeLens — usePermissions Hook
   =============================================================================
   Resolves the current user's permissions from their API-provided role data.
   No longer depends on the rbacSlice — permissions come from the backend.
   ============================================================================= */

export function usePermissions() {
  const { data: currentUser, isLoading: isCurrentUserLoading } = useGetCurrentUserQuery();
  const roleId = currentUser?.roles?.[0]?.id;
  const { data: role, isLoading: isRoleLoading } = useGetRoleByIdQuery(roleId ?? skipToken);

  const permissions = useMemo(() => {
    if (!currentUser) return [];

    // Use explicit permissions from the user's profile if available
    if (currentUser.permissions && currentUser.permissions.length > 0) {
      return currentUser.permissions;
    }

    if (!role) {
      return [];
    }

    const permissions = Array.isArray(role.permissions)
      ? role.permissions
          .map((permission) => permission.permission_name)
          .filter(Boolean)
      : [];

    return permissions;
  }, [currentUser, role]);

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
    isLoading: isCurrentUserLoading || Boolean(roleId && isRoleLoading),
  };
}
