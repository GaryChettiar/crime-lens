import * as React from 'react';
import { AdminLayout } from '@/components/templates/AdminLayout/AdminLayout';
import {
  useGetAllPermissionsQuery,
  useCreatePermissionsMutation,
  useUpdatePermissionMutation,
  useHardDeletePermissionMutation,
  type Permission,
} from '@/services/permissionsApi';
import { TableSkeleton, EmptyState, ErrorState } from '@/components/molecules/DataStates';
import {
  Plus,
  Pencil,
  Trash2,
  Key,
  Search,
  RefreshCw,
  Check,
  X,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Create / Edit Modal ──────────────────────────────────────────────────────

interface PermissionFormModalProps {
  mode: 'create' | 'edit';
  existing?: Permission;
  onClose: () => void;
}

function PermissionFormModal({ mode, existing, onClose }: PermissionFormModalProps) {
  const isEdit = mode === 'edit';

  const [createPermissions, { isLoading: isCreating }] = useCreatePermissionsMutation();
  const [updatePermission, { isLoading: isUpdating }] = useUpdatePermissionMutation();

  // In create mode we support bulk — one row per permission
  const [rows, setRows] = React.useState<{ name: string; description: string }[]>(
    isEdit && existing
      ? [{ name: existing.name, description: existing.description ?? '' }]
      : [{ name: '', description: '' }],
  );
  const [error, setError] = React.useState('');

  const addRow = () => setRows((r) => [...r, { name: '', description: '' }]);
  const removeRow = (i: number) => setRows((r) => r.filter((_, idx) => idx !== i));
  const updateRow = (i: number, field: 'name' | 'description', val: string) => {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [field]: val } : row)));
  };

  const isSaving = isCreating || isUpdating;

  const handleSave = async () => {
    setError('');
    const validRows = rows.filter((r) => r.name.trim());
    if (validRows.length === 0) {
      setError('At least one permission name is required.');
      return;
    }

    try {
      if (isEdit && existing) {
        await updatePermission({
          id: existing.id,
          body: { name: validRows[0].name.trim(), description: validRows[0].description.trim() || undefined },
        }).unwrap();
      } else {
        await createPermissions(
          validRows.map((r) => ({
            name: r.name.trim(),
            description: r.description.trim() || undefined,
          })),
        ).unwrap();
      }
      onClose();
    } catch (e: any) {
      setError(e?.data?.message || e?.message || 'Failed to save. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Key className="h-4 w-4 text-violet-400" />
            </div>
            <h2 className="text-base font-bold text-foreground">
              {isEdit ? 'Edit Permission' : 'Create Permissions'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {!isEdit && (
            <p className="text-xs text-muted-foreground">
              Add one or more permissions. Duplicate names will be skipped automatically.
            </p>
          )}

          {error && (
            <div className="flex items-center gap-2 text-xs text-danger bg-danger/10 border border-danger/25 rounded-lg px-3 py-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </div>
          )}

          {/* Permission rows */}
          <div className="space-y-2">
            {rows.map((row, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="flex-1 space-y-1.5">
                  <input
                    className="admin-input font-mono text-xs"
                    placeholder="PERMISSION_NAME (e.g. VIEW_CRIMES)"
                    value={row.name}
                    onChange={(e) => updateRow(i, 'name', e.target.value.toUpperCase())}
                  />
                  <input
                    className="admin-input text-xs"
                    placeholder="Description (optional)"
                    value={row.description}
                    onChange={(e) => updateRow(i, 'description', e.target.value)}
                  />
                </div>
                {!isEdit && rows.length > 1 && (
                  <button
                    type="button"
                    className="mt-1 p-1.5 rounded-md hover:bg-danger/10 text-danger shrink-0"
                    onClick={() => removeRow(i)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {!isEdit && (
            <button
              type="button"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              onClick={addRow}
            >
              <Plus className="h-3.5 w-3.5" />
              Add another
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-border">
          <button className="admin-btn admin-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="admin-btn admin-btn-primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : isEdit ? (
              'Save Changes'
            ) : (
              'Create'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function PermissionsPage() {
  const { data: permissions, isLoading, isError, refetch } = useGetAllPermissionsQuery();
  const [hardDeletePermission] = useHardDeletePermissionMutation();

  const [search, setSearch] = React.useState('');
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [editingPerm, setEditingPerm] = React.useState<Permission | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
  const [confirmDeleteName, setConfirmDeleteName] = React.useState('');

  const allPerms = React.useMemo(() => {
    const sys = permissions?.system ?? [];
    const biz = permissions?.business ?? [];
    return [...sys, ...biz];
  }, [permissions]);

  const filtered = React.useMemo(() => {
    if (!search) return allPerms;
    const q = search.toLowerCase();
    return allPerms.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q),
    );
  }, [allPerms, search]);

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await hardDeletePermission(confirmDeleteId).unwrap();
      setConfirmDeleteId(null);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">Permissions</h1>
            <p className="text-sm mt-0.5 text-muted-foreground">
              Define granular access controls assigned to roles.
            </p>
          </div>
          <button
            className="admin-btn admin-btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="h-4 w-4" />
            Add Permission
          </button>
        </div>

        {/* Toolbar */}
        <div className="admin-card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              className="admin-input pl-10"
              placeholder="Search permissions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {!isLoading && !isError && (
              <span className="px-2.5 py-1 rounded-full bg-muted font-semibold">
                {allPerms.length} total
              </span>
            )}
            <button className="admin-btn admin-btn-secondary" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Loading */}
        {isLoading && <TableSkeleton columns={4} rows={6} />}

        {/* Error */}
        {isError && (
          <ErrorState
            title="Failed to load permissions"
            message="Could not fetch permissions from the server."
            onRetry={refetch}
          />
        )}

        {/* Empty */}
        {!isLoading && !isError && filtered.length === 0 && (
          <EmptyState
            icon={Key}
            title="No permissions found"
            description={
              search
                ? 'No permissions match your search.'
                : 'No permissions have been created yet.'
            }
            action={
              !search ? (
                <button
                  className="admin-btn admin-btn-primary text-xs"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus className="h-3.5 w-3.5" /> Add Permission
                </button>
              ) : undefined
            }
          />
        )}

        {/* Table */}
        {!isLoading && !isError && filtered.length > 0 && (
          <div className="admin-card overflow-hidden">
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Permission</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th className="w-[100px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((perm) => (
                    <tr key={perm.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-md bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                            <Key className="h-3.5 w-3.5 text-violet-400" />
                          </div>
                          <span className="font-mono text-xs font-semibold text-foreground">
                            {perm.name}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="text-sm text-muted-foreground">
                          {perm.description || <span className="italic opacity-50">—</span>}
                        </span>
                      </td>
                      <td>
                        <span
                          className={cn(
                            'admin-badge',
                            perm.enabled ? 'admin-badge-active' : 'admin-badge-inactive',
                          )}
                        >
                          {perm.enabled ? (
                            <><Check className="h-3 w-3" /> Active</>
                          ) : (
                            'Inactive'
                          )}
                        </span>
                      </td>
                      <td>
                        <span className="text-sm text-muted-foreground">
                          {perm.createdAt
                            ? new Date(perm.createdAt).toLocaleDateString()
                            : '—'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button
                            className="p-1.5 rounded-md hover:bg-muted transition-colors"
                            title="Edit"
                            onClick={() => setEditingPerm(perm)}
                          >
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                          </button>
                          <button
                            className="p-1.5 rounded-md hover:bg-danger/10 transition-colors"
                            title="Delete"
                            onClick={() => {
                              setConfirmDeleteId(perm.id);
                              setConfirmDeleteName(perm.name);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-danger" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <PermissionFormModal mode="create" onClose={() => setShowCreateModal(false)} />
      )}

      {/* Edit Modal */}
      {editingPerm && (
        <PermissionFormModal
          mode="edit"
          existing={editingPerm}
          onClose={() => setEditingPerm(null)}
        />
      )}

      {/* Delete Confirmation */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold mb-1 text-foreground">Delete Permission</h2>
            <p className="text-sm text-muted-foreground mb-1">
              Permanently delete{' '}
              <span className="font-mono font-semibold text-foreground">{confirmDeleteName}</span>?
            </p>
            <p className="text-xs text-warning mb-5">
              This will also remove it from all roles it is assigned to.
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="admin-btn admin-btn-secondary"
                onClick={() => setConfirmDeleteId(null)}
              >
                Cancel
              </button>
              <button className="admin-btn admin-btn-danger" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
