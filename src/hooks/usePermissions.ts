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

export default function usePermissions() {
  const { data: currentUser, isLoading: isCurrentUserLoading } = useGetCurrentUserQuery();
  const roleId = currentUser?.roles?.[0]?.id;
  const { data: role, isLoading: isRoleLoading } = useGetRoleByIdQuery(roleId ?? skipToken);
  // Keep a ref of the last resolved permissions so callers don't briefly
  // see an empty permission set while the roles query is still loading.
  const lastPermissionsRef = (globalThis as any).__crimeLens_lastPermissionsRef || ({ current: [] } as { current: string[] });
  if (!(globalThis as any).__crimeLens_lastPermissionsRef) {
    (globalThis as any).__crimeLens_lastPermissionsRef = lastPermissionsRef;
  }

  const permissions = useMemo(() => {
    if (!currentUser) return [];

    // If role details are present, use them as the authoritative source.
    if (role && Array.isArray(role.permissions) && role.permissions.length > 0) {
      const resolved = role.permissions.map((p: any) => p.permission_name).filter(Boolean);
      lastPermissionsRef.current = resolved;
      return resolved;
    }

    // If we have a roleId but role is still loading, return the last-known
    // permissions (may be empty on first load) so callers don't get a
    // transient empty array that would incorrectly deny access.
    if (roleId && isRoleLoading) {
      return lastPermissionsRef.current ?? [];
    }

    // Fall back to any explicit permissions returned on the user object (rare)
    if (currentUser.permissions && currentUser.permissions.length > 0) {
      lastPermissionsRef.current = currentUser.permissions;
      return currentUser.permissions;
    }

    // No permissions found; clear last-known so future loads reflect new data
    lastPermissionsRef.current = lastPermissionsRef.current ?? [];
    return lastPermissionsRef.current;
  }, [currentUser, role, roleId, isRoleLoading]);

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
