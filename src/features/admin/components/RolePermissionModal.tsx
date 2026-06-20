import * as React from 'react';
import {
  useGetRoleByIdQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useMapPermissionsToRoleMutation,
} from '@/services/rolesApi';
import { useGetAllPermissionsQuery } from '@/services/permissionsApi';
import { X, Search, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * RolePermissionModal — Enterprise permission assignment dialog.
 * Supports create and edit modes. Loads permissions from API.
 */

interface RolePermissionModalProps {
  roleId: string | null; // null = create mode
  onClose: () => void;
  onSave?: (roleId: string) => void;
}

export function RolePermissionModal({ roleId, onClose, onSave }: RolePermissionModalProps) {
  const isCreate = !roleId;

  // Fetch existing role data (edit mode)
  const { data: existingRole } = useGetRoleByIdQuery(roleId!, { skip: isCreate });

  // Fetch all available permissions from backend
  const { data: allPermissions, isLoading: permissionsLoading } = useGetAllPermissionsQuery();

  // Mutations
  const [createRole, { isLoading: isCreating }] = useCreateRoleMutation();
  const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation();
  const [mapPermissions] = useMapPermissionsToRoleMutation();

  // Local state
  const [roleName, setRoleName] = React.useState('');
  const [roleDescription, setRoleDescription] = React.useState('');
  const [selectedPermissions, setSelectedPermissions] = React.useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = React.useState('');

  // Populate form when existing role data loads
  React.useEffect(() => {
    if (existingRole) {
      setRoleName(existingRole.name || '');
      setRoleDescription(existingRole.description || '');
      const existingPermIds = (existingRole.permissions || []).map((p) => p.id);
      setSelectedPermissions(new Set(existingPermIds));
    }
  }, [existingRole]);

  // Toggle a single permission
  const togglePermission = (permId: string) => {
    const next = new Set(selectedPermissions);
    if (next.has(permId)) {
      next.delete(permId);
    } else {
      next.add(permId);
    }
    setSelectedPermissions(next);
  };

  // Filter permissions by search
  const filteredPermissions = React.useMemo(() => {
    if (!allPermissions) return [];
    if (!searchQuery) return allPermissions;
    const q = searchQuery.toLowerCase();
    return allPermissions.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)),
    );
  }, [allPermissions, searchQuery]);

  const isSaving = isCreating || isUpdating;

  const handleSave = async () => {
    if (!roleName.trim()) return;

    try {
      const permissionIds = Array.from(selectedPermissions);

      if (isCreate) {
        // Create the role first
        const result = await createRole({
          name: roleName.trim(),
          description: roleDescription.trim(),
        }).unwrap();

        const newRoleId = result.data?.id;
        if (newRoleId && permissionIds.length > 0) {
          // Map permissions to the new role
          await mapPermissions({
            roleId: newRoleId,
            body: { permissionIds },
          }).unwrap();
        }

        onSave?.(newRoleId || '');
      } else if (roleId) {
        // Update role metadata
        await updateRole({
          id: roleId,
          body: {
            name: roleName.trim(),
            description: roleDescription.trim(),
          },
        }).unwrap();

        // Map permissions
        await mapPermissions({
          roleId,
          body: { permissionIds },
        }).unwrap();

        onSave?.(roleId);
      }

      onClose();
    } catch (e) {
      console.error('Failed to save role:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div
        className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {isCreate ? 'Create Role' : 'Edit Role'}
            </h2>
            <p className="text-xs mt-0.5 text-muted-foreground">
              {selectedPermissions.size} Permission{selectedPermissions.size !== 1 ? 's' : ''} Selected
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Role Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">
                Role Name
              </label>
              <input
                className="admin-input"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="e.g. Custom Analyst"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">
                Description
              </label>
              <input
                className="admin-input"
                value={roleDescription}
                onChange={(e) => setRoleDescription(e.target.value)}
                placeholder="Role description..."
              />
            </div>
          </div>

          {/* Permission Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              className="admin-input pl-10"
              placeholder="Search permissions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Permissions List */}
          {permissionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Loading permissions...</span>
            </div>
          ) : filteredPermissions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'No permissions match your search.' : 'No permissions available.'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredPermissions.map((perm) => {
                const isSelected = selectedPermissions.has(perm.id);
                return (
                  <button
                    key={perm.id}
                    type="button"
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left",
                      isSelected
                        ? "border-primary/30 bg-primary/5"
                        : "border-border bg-card hover:bg-muted/50"
                    )}
                    onClick={() => togglePermission(perm.id)}
                  >
                    <div
                      className={cn(
                        "h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors duration-150",
                        isSelected
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-border bg-card'
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{perm.name}</p>
                      {perm.description && (
                        <p className="text-xs text-muted-foreground truncate">{perm.description}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-border">
          <span className="text-sm font-semibold text-primary">
            {selectedPermissions.size} permission{selectedPermissions.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <button className="admin-btn admin-btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              className="admin-btn admin-btn-primary"
              onClick={handleSave}
              disabled={!roleName.trim() || isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                isCreate ? 'Create Role' : 'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
