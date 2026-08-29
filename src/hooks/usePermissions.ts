import { useMemo } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import { useGetCurrentUserQuery } from "@/services/authApi";
import { useGetRoleByIdQuery } from "@/services/rolesApi";

/* =============================================================================
   CrimeLens — usePermissions Hook
   =============================================================================
   Resolves the current user's permissions from their API-provided role data.
   No longer depends on the rbacSlice — permissions come from the backend.
   ============================================================================= */

export default function usePermissions() {
  const skipAuth = import.meta.env.VITE_SKIP_AUTH === "true";
  const { data: currentUser, isLoading: isCurrentUserLoading } =
    useGetCurrentUserQuery(undefined, { skip: skipAuth });
  const roleId = currentUser?.roles?.[0]?.id;
  const { data: role, isLoading: isRoleLoading } = useGetRoleByIdQuery(
    roleId ?? skipToken,
    { skip: skipAuth },
  );
  // Keep a ref of the last resolved permissions so callers don't briefly
  // see an empty permission set while the roles query is still loading.
  const lastPermissionsRef =
    (globalThis as any).__crimeLens_lastPermissionsRef ||
    ({ current: [] } as { current: string[] });
  if (!(globalThis as any).__crimeLens_lastPermissionsRef) {
    (globalThis as any).__crimeLens_lastPermissionsRef = lastPermissionsRef;
  }

  const flattenPermissionNames = (
    perms?: Array<{
      name?: string;
      permission_name?: string;
      children?: any[];
    }>,
  ) => {
    if (!Array.isArray(perms)) return [] as string[];
    const result: string[] = [];

    const walk = (
      items: Array<{
        name?: string;
        permission_name?: string;
        children?: any[];
      }>,
    ) => {
      for (const item of items) {
        const name = item.name ?? item.permission_name;
        if (name) {
          result.push(name);
        }
        if (Array.isArray(item.children) && item.children.length > 0) {
          walk(item.children);
        }
      }
    };

    walk(perms);
    return result;
  };

  const permissions = useMemo(() => {
    if (!currentUser) return [];

    // If role details are present, use them as the authoritative source.
    if (role) {
      const systemNames = flattenPermissionNames(
        (role as any).systemPermissions,
      );
      const businessNames = flattenPermissionNames(
        (role as any).businessPermissions,
      );
      const legacyNames = Array.isArray((role as any).permissions)
        ? flattenPermissionNames((role as any).permissions)
        : [];
      const resolved = Array.from(
        new Set([...systemNames, ...businessNames, ...legacyNames]),
      );
      if (resolved.length > 0) {
        lastPermissionsRef.current = resolved;
        return resolved;
      }
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
    () =>
      (permission: string): boolean => {
        if (!currentUser) return false;
        return permissions.includes(permission);
      },
    [currentUser, permissions],
  );

  const hasAnyPermission = useMemo(
    () =>
      (perms: string[]): boolean => {
        return perms.some((p) => hasPermission(p));
      },
    [hasPermission],
  );

  const hasAllPermissions = useMemo(
    () =>
      (perms: string[]): boolean => {
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
