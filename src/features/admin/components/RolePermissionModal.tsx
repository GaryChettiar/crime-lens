import * as React from 'react';
import {
  useGetRoleByIdQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useMapPermissionsToRoleMutation,
} from '@/services/rolesApi';
import { useGetAllPermissionsQuery, type Permission } from '@/services/permissionsApi';
import { X, Search, Check, Loader2, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RolePermissionModalProps {
  roleId: string | null; // null = create mode
  onClose: () => void;
  onSave?: (roleId: string) => void;
}

/**
 * RolePermissionModal — aligned with backend:
 * - mapPermissions uses permissionNames (not IDs)
 * - getAllPermissions returns { system, business }
 * - getRoleById returns permissions as raw ZCQL objects
 */
export function RolePermissionModal({ roleId, onClose, onSave }: RolePermissionModalProps) {
  const isCreate = !roleId;

  // Fetch existing role (edit mode) — includes permissions as raw Catalyst rows
  const { data: existingRole } = useGetRoleByIdQuery(roleId!, { skip: isCreate });

  // Fetch all available permissions — { system: [], business: [] }
  const { data: allPermissions, isLoading: permissionsLoading } = useGetAllPermissionsQuery();

  const [createRole, { isLoading: isCreating }] = useCreateRoleMutation();
  const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation();
  const [mapPermissions] = useMapPermissionsToRoleMutation();

  // Local state — selected by permission NAME (not ID, as backend mapPermissions uses names)
  const [roleName, setRoleName] = React.useState('');
  const [selectedPermNames, setSelectedPermNames] = React.useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = React.useState('');
  const [error, setError] = React.useState('');

  // Pre-populate form when editing
  React.useEffect(() => {
    if (existingRole) {
      setRoleName(existingRole.name || '');
      // existingRole.permissions are raw ZCQL objects: { ROWID, permission_name, ... }
      const names = (existingRole.permissions || []).map(
        (p: any) => p.permission_name ?? p.name ?? ''
      );
      setSelectedPermNames(new Set(names.filter(Boolean)));
    }
  }, [existingRole]);

  // All permissions as flat list for UI
  const allPermsFlat: Permission[] = React.useMemo(() => {
    if (!allPermissions) return [];
    return [...(allPermissions.system ?? []), ...(allPermissions.business ?? [])];
  }, [allPermissions]);

  const filteredPermissions = React.useMemo(() => {
    if (!searchQuery) return allPermsFlat;
    const q = searchQuery.toLowerCase();
    return allPermsFlat.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)),
    );
  }, [allPermsFlat, searchQuery]);

  const togglePermission = (permName: string) => {
    const next = new Set(selectedPermNames);
    if (next.has(permName)) next.delete(permName);
    else next.add(permName);
    setSelectedPermNames(next);
  };

  const isSaving = isCreating || isUpdating;

  const handleSave = async () => {
    setError('');
    if (!roleName.trim()) {
      setError('Role name is required.');
      return;
    }
    const permissionNames = Array.from(selectedPermNames);

    try {
      if (isCreate) {
        const result = await createRole({ name: roleName.trim() }).unwrap();
        const newRoleId = result?.id;

        if (newRoleId && permissionNames.length > 0) {
          await mapPermissions({ roleId: newRoleId, permissionNames }).unwrap();
        }
        onSave?.(newRoleId || '');
      } else if (roleId) {
        await updateRole({
          id: roleId,
          body: { name: roleName.trim() },
        }).unwrap();

        if (permissionNames.length > 0) {
          await mapPermissions({ roleId, permissionNames }).unwrap();
        }
        onSave?.(roleId);
      }
      onClose();
    } catch (e: any) {
      setError(e?.data?.message || e?.message || 'Failed to save role. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                {isCreate ? 'Create Role' : 'Edit Role'}
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {selectedPermNames.size} permission{selectedPermNames.size !== 1 ? 's' : ''} selected
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Role name */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-muted-foreground">
              Role Name *
            </label>
            <input
              className="admin-input"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="e.g. DISTRICT_ANALYST"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-danger bg-danger/10 border border-danger/25 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Permission search */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-muted-foreground">
              Assign Permissions
            </label>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                className="admin-input pl-10"
                placeholder="Search permissions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Quick select all / clear */}
            {allPermsFlat.length > 0 && (
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  className="text-[10px] font-semibold text-primary hover:underline"
                  onClick={() => setSelectedPermNames(new Set(allPermsFlat.map((p) => p.name)))}
                >
                  Select All ({allPermsFlat.length})
                </button>
                <span className="text-muted-foreground">·</span>
                <button
                  type="button"
                  className="text-[10px] font-semibold text-muted-foreground hover:underline"
                  onClick={() => setSelectedPermNames(new Set())}
                >
                  Clear
                </button>
              </div>
            )}

            {/* Permissions list */}
            {permissionsLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mr-2" />
                <span className="text-sm text-muted-foreground">Loading permissions...</span>
              </div>
            ) : filteredPermissions.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? 'No permissions match your search.' : 'No permissions found.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[320px] overflow-y-auto pr-1">
                {filteredPermissions.map((perm) => {
                  const isSelected = selectedPermNames.has(perm.name);
                  return (
                    <button
                      key={perm.id}
                      type="button"
                      className={cn(
                        'flex items-center gap-2.5 p-2.5 rounded-lg border transition-all duration-100 text-left',
                        isSelected
                          ? 'border-primary/30 bg-primary/5 shadow-sm'
                          : 'border-border bg-card hover:bg-muted/50',
                      )}
                      onClick={() => togglePermission(perm.name)}
                    >
                      <div
                        className={cn(
                          'h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors',
                          isSelected
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-border bg-background',
                        )}
                      >
                        {isSelected && <Check className="h-2.5 w-2.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate font-mono">
                          {perm.name}
                        </p>
                        {perm.description && (
                          <p className="text-[10px] text-muted-foreground truncate">
                            {perm.description}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20">
          <span className="text-xs font-semibold text-primary">
            {selectedPermNames.size} permission{selectedPermNames.size !== 1 ? 's' : ''} selected
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
              ) : isCreate ? (
                'Create Role'
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
