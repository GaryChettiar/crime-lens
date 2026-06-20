/* =============================================================================
   CrimeLens — RBAC Type System
   =============================================================================
   Enterprise role-based access control types.
   
   Architecture:
   - Permissions are hierarchical: parent.child (e.g., "users.view")
   - Roles bundle permissions into named sets
   - Default roles cannot be deleted
   - Users are assigned exactly one role
   ============================================================================= */

// ---------------------------------------------------------------------------
// Permission System
// ---------------------------------------------------------------------------

/**
 * Individual permission string using dot notation.
 * Format: "{category}.{action}"
 */
export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'export';

export interface PermissionDefinition {
  id: string;
  label: string;
  description?: string;
  children: {
    id: string;
    label: string;
    action: PermissionAction;
  }[];
}

export interface PermissionCategory {
  id: string;
  label: string;
  type: 'system' | 'business';
  permissions: PermissionDefinition[];
}

// (Default seeds and hardcoded categories removed in favor of live backend configuration APIs)

// ---------------------------------------------------------------------------
// Role Types
// ---------------------------------------------------------------------------

export type RoleType =
  | 'super_admin'
  | 'admin'
  | 'manager'
  | 'analyst'
  | 'officer'
  | 'viewer';

export interface Role {
  id: string;
  name: string;
  type: RoleType;
  description: string;
  permissions: string[];
  isDefault: boolean;
  usersCount: number;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// User Management Types
// ---------------------------------------------------------------------------

export type UserStatus = 'active' | 'inactive' | 'pending' | 'first_login_required';

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  roleId: string;
  roleName: string;
  status: UserStatus;
  department: string;
  phone?: string;
  lastActive?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserInvite {
  id: string;
  email: string;
  roleId: string;
  roleName: string;
  invitedBy: string;
  invitedAt: string;
  message?: string;
  status: 'pending' | 'accepted' | 'expired';
}

export interface UserRequest {
  id: string;
  name: string;
  email: string;
  department: string;
  requestedRole: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  message?: string;
}

// ---------------------------------------------------------------------------
// Audit Types
// ---------------------------------------------------------------------------

export type AuditAction =
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'user.approved'
  | 'user.rejected'
  | 'user.invited'
  | 'user.role_changed'
  | 'user.status_changed'
  | 'role.created'
  | 'role.updated'
  | 'role.deleted'
  | 'role.cloned'
  | 'role.permissions_changed'
  | 'settings.updated'
  | 'branding.updated'
  | 'branding.reset'
  | 'security.updated'
  | 'email.updated'
  | 'email.test_sent';

export interface AuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: AuditAction;
  entity: string;
  entityId: string;
  previousValue?: string;
  newValue?: string;
  details?: string;
}

// ---------------------------------------------------------------------------
// Branding Types
// ---------------------------------------------------------------------------

export interface BrandingConfig {
  organizationName: string;
  logoUrl: string;
  foreground: string;
  background: string;
  borderRadius: string;
}

export const DEFAULT_BRANDING: BrandingConfig = {
  organizationName: 'CrimeLens',
  logoUrl: '',
  foreground: '#3b82f6',
  background: '#0f172a',
  borderRadius: '0.375rem',
};
