import * as React from 'react';
import { AdminLayout } from '@/components/templates/AdminLayout/AdminLayout';
import { useGetAllRolesQuery, useDeleteRoleMutation, useRestoreRoleMutation } from '@/services/rolesApi';
import { TableSkeleton, EmptyState, ErrorState } from '@/components/molecules/DataStates';
import { RolePermissionModal } from './RolePermissionModal';
import { Plus, Pencil, Trash2, Shield, Lock, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * RolesPage — Enterprise RBAC role management.
 * All data from backend via RTK Query — no mock data.
 */
export function RolesPage() {
  const { data: roles, isLoading, isError, refetch } = useGetAllRolesQuery();
  const [deleteRole] = useDeleteRoleMutation();
  const [restoreRole] = useRestoreRoleMutation();

  const [editingRoleId, setEditingRoleId] = React.useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);

  const handleDelete = async (roleId: string) => {
    try {
      await deleteRole(roleId).unwrap();
      setConfirmDeleteId(null);
    } catch (e) {
      console.error('Failed to delete role:', e);
    }
  };

  const handleRestore = async (roleId: string) => {
    try {
      await restoreRole(roleId).unwrap();
    } catch (e) {
      console.error('Failed to restore role:', e);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">Roles & Permissions</h1>
            <p className="text-sm mt-0.5 text-muted-foreground">
              Manage platform roles and their permission assignments.
            </p>
          </div>
          <button
            className="admin-btn admin-btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="h-4 w-4" />
            Create Role
          </button>
        </div>

        {/* Loading State */}
        {isLoading && <TableSkeleton columns={5} rows={5} />}

        {/* Error State */}
        {isError && (
          <ErrorState
            title="Failed to load roles"
            message="Could not fetch roles from the server. Please check your connection and try again."
            onRetry={refetch}
          />
        )}

        {/* Empty State */}
        {!isLoading && !isError && roles && roles.length === 0 && (
          <EmptyState
            icon={Shield}
            title="No roles configured"
            description="Create your first role to start managing access permissions."
            action={
              <button className="admin-btn admin-btn-primary text-xs" onClick={() => setShowCreateModal(true)}>
                <Plus className="h-3.5 w-3.5" /> Create Role
              </button>
            }
          />
        )}

        {/* Roles Table */}
        {!isLoading && !isError && roles && roles.length > 0 && (
          <div className="admin-card overflow-hidden">
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Role Name</th>
                    <th>Permissions</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th className="w-[160px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((role) => (
                    <tr key={role.id} className={role.isArchived ? 'opacity-50' : ''}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div
                            className={cn(
                              "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                              role.isArchived ? "bg-muted" : "bg-primary/15"
                            )}
                          >
                            <Shield className={cn("h-4 w-4", role.isArchived ? "text-muted-foreground" : "text-primary")} />
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-foreground">{role.name}</p>
                            {role.description && (
                              <p className="text-xs text-muted-foreground">{role.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-info/10 text-info border border-info/20">
                          {role.permissions?.length ?? 0} permissions
                        </span>
                      </td>
                      <td>
                        <span className={cn(
                          "admin-badge",
                          role.isArchived ? "admin-badge-inactive" : "admin-badge-active"
                        )}>
                          {role.isArchived ? 'Archived' : 'Active'}
                        </span>
                      </td>
                      <td>
                        <span className="text-sm text-muted-foreground">
                          {role.createdAt ? new Date(role.createdAt).toLocaleDateString() : '—'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          {role.isArchived ? (
                            <button
                              className="p-1.5 rounded-md hover:bg-success/10"
                              title="Restore role"
                              onClick={() => handleRestore(role.id)}
                            >
                              <RotateCcw className="h-4 w-4 text-success" />
                            </button>
                          ) : (
                            <>
                              <button
                                className="p-1.5 rounded-md hover:bg-muted"
                                title="Edit permissions"
                                onClick={() => setEditingRoleId(role.id)}
                              >
                                <Pencil className="h-4 w-4 text-muted-foreground" />
                              </button>
                              <button
                                className="p-1.5 rounded-md hover:bg-danger/10"
                                title="Delete role"
                                onClick={() => setConfirmDeleteId(role.id)}
                              >
                                <Trash2 className="h-4 w-4 text-danger" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Role Legend */}
        {!isLoading && !isError && roles && roles.length > 0 && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-primary" />
              Active role
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              Archived role (restorable)
            </span>
          </div>
        )}
      </div>

      {/* Edit Role Modal */}
      {editingRoleId && (
        <RolePermissionModal
          roleId={editingRoleId}
          onClose={() => setEditingRoleId(null)}
        />
      )}

      {/* Create Role Modal */}
      {showCreateModal && (
        <RolePermissionModal
          roleId={null}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold mb-2 text-foreground">Delete Role</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Are you sure you want to delete this role? This action can be reversed using the restore function.
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
                onClick={() => handleDelete(confirmDeleteId)}
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
