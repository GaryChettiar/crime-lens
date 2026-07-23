import * as React from 'react';
import { AdminLayout } from '@/components/templates/AdminLayout/AdminLayout';
import {
  useGetAllRolesQuery,
  useDeleteRoleMutation,
  type Role,
} from '@/services/rolesApi';
import { TableSkeleton, EmptyState, ErrorState } from '@/components/molecules/DataStates';
import { RolePermissionModal } from './RolePermissionModal';
import {
  Plus,
  Pencil,
  Trash2,
  Shield,
  Lock,
  ChevronDown,
  ChevronRight,
  Users,
  Key,
  Search,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SYSTEM_ROLES = ['SUPER_ADMIN'];

const flattenPermissionTree = (
  perms?: Array<{ name?: string; permission_name?: string; children?: any[] }>,
): string[] => {
  if (!Array.isArray(perms)) return [];
  const result: string[] = [];

  const walk = (items: Array<{ name?: string; permission_name?: string; children?: any[] }>) => {
    for (const item of items) {
      const name = item.name ?? item.permission_name;
      if (name) result.push(name);
      if (Array.isArray(item.children) && item.children.length > 0) {
        walk(item.children);
      }
    }
  };

  walk(perms);
  return result;
};

const getUniquePermissionNames = (
  systemPermissions?: Array<{ name?: string; permission_name?: string; children?: any[] }>,
  businessPermissions?: Array<{ name?: string; permission_name?: string; children?: any[] }>,
) => {
  return Array.from(
    new Set([
      ...flattenPermissionTree(systemPermissions),
      ...flattenPermissionTree(businessPermissions),
    ]),
  );
};

export function RolesPage() {
  const {
    data: roles,
    isLoading,
    isError,
    refetch,
  } = useGetAllRolesQuery({ isDetailed: true });

  const [deleteRole, { isLoading: isDeleting }] = useDeleteRoleMutation();

  const [editingRoleId, setEditingRoleId] = React.useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
  const [expandedRoleId, setExpandedRoleId] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');

  const handleDelete = async (roleId: string) => {
    try {
      await deleteRole(roleId).unwrap();
      setConfirmDeleteId(null);
    } catch (e: any) {
      console.error('Failed to delete role:', e);
    }
  };

  const filteredRoles = React.useMemo(() => {
    if (!roles) return [];
    if (!search) return roles;
    const q = search.toLowerCase();
    return roles.filter((r) => r.name.toLowerCase().includes(q));
  }, [roles, search]);

  const confirmRole = roles?.find((r) => r.id === confirmDeleteId);

  return (
    <AdminLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">Roles</h1>
            <p className="text-sm mt-0.5 text-muted-foreground">
              Manage platform roles and their assigned permissions.
            </p>
          </div>
          <button className="admin-btn admin-btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4" />
            Create Role
          </button>
        </div>

        {/* Toolbar */}
        <div className="admin-card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              className="admin-input pl-10"
              placeholder="Search roles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="admin-btn admin-btn-secondary" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {/* Stats row */}
        {!isLoading && !isError && roles && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total Roles', value: roles.length, icon: Shield, color: 'text-primary bg-primary/10 border-primary/20' },
              {
                label: 'Total Permissions',
                value: roles.reduce(
                  (acc, r) =>
                    acc +
                    (r.systemPermissions?.length ?? 0) +
                    (r.businessPermissions?.length ?? 0),
                  0,
                ),
                icon: Key,
                color: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
              },
              {
                label: 'Users Assigned',
                value: roles.reduce((acc, r) => acc + (r.users?.length ?? 0), 0),
                icon: Users,
                color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
              },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className={`admin-card p-4 border flex items-center gap-3 ${stat.color.split(' ').slice(1).join(' ')}`}
                >
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${stat.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {stat.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Loading */}
        {isLoading && <TableSkeleton columns={4} rows={5} />}

        {/* Error */}
        {isError && (
          <ErrorState
            title="Failed to load roles"
            message="Could not fetch roles. Please check your connection."
            onRetry={refetch}
          />
        )}

        {/* Empty */}
        {!isLoading && !isError && filteredRoles.length === 0 && (
          <EmptyState
            icon={Shield}
            title="No roles found"
            description={search ? 'Try a different search term.' : 'Create your first role to manage access.'}
            action={
              !search ? (
                <button
                  className="admin-btn admin-btn-primary text-xs"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus className="h-3.5 w-3.5" /> Create Role
                </button>
              ) : undefined
            }
          />
        )}

        {/* Roles list — expandable cards */}
        {!isLoading && !isError && filteredRoles.length > 0 && (
          <div className="space-y-2">
            {filteredRoles.map((role) => {
              const isExpanded = expandedRoleId === role.id;
              const isSystem = SYSTEM_ROLES.includes(role.name);
              const permissionNames = getUniquePermissionNames(
                role.systemPermissions,
                role.businessPermissions,
              );
              const permCount = permissionNames.length;
              const userCount = role.users?.length ?? 0;

              return (
                <div
                  key={role.id}
                  className={cn(
                    'admin-card border transition-all duration-200',
                    isExpanded ? 'border-primary/30' : 'border-border',
                  )}
                >
                  {/* Role header row */}
                  <div className="flex items-center gap-3 p-4">
                    {/* Expand toggle */}
                    <button
                      className="p-1 rounded hover:bg-muted text-muted-foreground"
                      onClick={() => setExpandedRoleId(isExpanded ? null : role.id)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>

                    {/* Icon */}
                    <div
                      className={cn(
                        'h-9 w-9 rounded-lg flex items-center justify-center shrink-0',
                        isSystem ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-primary/10 border border-primary/20',
                      )}
                    >
                      {isSystem ? (
                        <Lock className="h-4 w-4 text-amber-400" />
                      ) : (
                        <Shield className="h-4 w-4 text-primary" />
                      )}
                    </div>

                    {/* Name & badges */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-foreground font-mono">
                          {role.name}
                        </span>
                        {isSystem && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                            SYSTEM
                          </span>
                        )}
                        {role.isDefault && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-info/10 text-info border border-info/20 font-semibold">
                            DEFAULT
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Key className="h-3 w-3" />
                          {permCount} permission{permCount !== 1 ? 's' : ''}
                        </span>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {userCount} user{userCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    {role.isEditable && (
                      <div className="flex items-center gap-1">
                        <button
                          className="p-1.5 rounded-md hover:bg-muted transition-colors"
                          title="Edit role & permissions"
                          onClick={() => setEditingRoleId(role.id)}
                        >
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <button
                          className="p-1.5 rounded-md hover:bg-danger/10 transition-colors"
                          title="Delete role"
                          onClick={() => setConfirmDeleteId(role.id)}
                        >
                          <Trash2 className="h-4 w-4 text-danger" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Expanded — permissions + users */}
                  {isExpanded && (
                    <div className="border-t border-border px-4 pb-4 pt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Permissions */}
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                          Permissions ({permCount})
                        </p>
                        {permCount === 0 ? (
                          <p className="text-xs text-muted-foreground italic">No permissions assigned.</p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                            {permissionNames.map((permissionName) => (
                              <span
                                key={permissionName}
                                title={permissionName}
                                className="text-[10px] px-2 py-0.5 rounded-md bg-primary/5 border border-primary/15 text-primary font-mono font-medium"
                              >
                                {permissionName}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Assigned users */}
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                          Assigned Users ({userCount})
                        </p>
                        {userCount === 0 ? (
                          <p className="text-xs text-muted-foreground italic">No users assigned to this role.</p>
                        ) : (
                          <div className="space-y-1.5 max-h-36 overflow-y-auto">
                            {(role.users ?? []).map((u) => (
                              <div key={u.id} className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-foreground shrink-0">
                                  {(u.email || '?')[0].toUpperCase()}
                                </div>
                                <span className="text-xs text-foreground truncate">{u.email}</span>
                                {u.isArchived && (
                                  <span className="text-[10px] text-muted-foreground">(archived)</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Role Modal */}
      {editingRoleId && (
        <RolePermissionModal roleId={editingRoleId} onClose={() => setEditingRoleId(null)} />
      )}

      {/* Create Role Modal */}
      {showCreateModal && (
        <RolePermissionModal roleId={null} onClose={() => setShowCreateModal(false)} />
      )}

      {/* Delete Confirmation */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold mb-1 text-foreground">Delete Role</h2>
            <p className="text-sm text-muted-foreground mb-1">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-foreground font-mono">{confirmRole?.name}</span>?
            </p>
            <p className="text-xs text-warning mb-5">
              All users in this role will be reassigned to CONTRIBUTOR.
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="admin-btn admin-btn-secondary"
                onClick={() => setConfirmDeleteId(null)}
              >
                Cancel
              </button>
              <button
                className="admin-btn admin-btn-danger"
                disabled={isDeleting}
                onClick={() => handleDelete(confirmDeleteId)}
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
