import * as React from 'react';
import {
  useGetRoleByIdQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useMapPermissionsToRoleMutation,
} from '@/services/rolesApi';
import { useGetAllPermissionsQuery, type Permission } from '@/services/permissionsApi';
import { X, Search, Check, Minus, Loader2, Shield, ChevronDown, ChevronRight } from 'lucide-react';
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

      const flattenRolePermissionNames = (
        perms?: Array<{ name?: string; permission_name?: string; children?: any[] }>,
      ) => {
        if (!Array.isArray(perms)) return [] as string[];
        const result: string[] = [];

        const walk = (items: Array<{ name?: string; permission_name?: string; children?: any[] }>) => {
          for (const item of items) {
            const name = item.permission_name ?? item.name;
            if (name) result.push(name);
            if (Array.isArray(item.children) && item.children.length > 0) {
              walk(item.children);
            }
          }
        };

        walk(perms);
        return result;
      };

      const explicitNames = (existingRole.permissions || []).map(
        (p: any) => p.permission_name ?? p.name ?? '',
      );
      const systemNames = flattenRolePermissionNames(existingRole.systemPermissions);
      const businessNames = flattenRolePermissionNames(existingRole.businessPermissions);

      setSelectedPermNames(
        new Set(
          [...explicitNames, ...systemNames, ...businessNames].filter(Boolean),
        ),
      );
    }
  }, [existingRole]);

  interface PermissionNode extends Permission {
    children: PermissionNode[];
  }

  const buildPermissionTree = (perms: Permission[]) => {
    const nodeMap = new Map<string, PermissionNode>();

    perms.forEach((perm) => {
      nodeMap.set(perm.id, { ...perm, children: [] });
    });

    const roots: PermissionNode[] = [];
    nodeMap.forEach((node) => {
      if (node.parentId && nodeMap.has(node.parentId)) {
        nodeMap.get(node.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    const sortTree = (items: PermissionNode[]) => {
      items.sort((a, b) => a.name.localeCompare(b.name));
      items.forEach((item) => sortTree(item.children));
    };

    sortTree(roots);
    return roots;
  };

  const filterPermissionTree = (items: PermissionNode[], query: string): PermissionNode[] => {
    if (!query) return items;
    const lowerQuery = query.toLowerCase();

    const result: PermissionNode[] = [];

    for (const item of items) {
      const childMatches = filterPermissionTree(item.children, query);
      const selfMatches =
        item.name.toLowerCase().includes(lowerQuery) ||
        (item.description?.toLowerCase().includes(lowerQuery) ?? false);

      if (selfMatches || childMatches.length > 0) {
        result.push({
          ...item,
          children: childMatches,
        });
      }
    }

    return result;
  };

  const systemPermissionTree = React.useMemo(
    () => buildPermissionTree(allPermissions?.system ?? []),
    [allPermissions],
  );

  const businessPermissionTree = React.useMemo(
    () => buildPermissionTree(allPermissions?.business ?? []),
    [allPermissions],
  );

  const filteredSystemTree = React.useMemo(
    () => filterPermissionTree(systemPermissionTree, searchQuery),
    [searchQuery, systemPermissionTree],
  );

  const filteredBusinessTree = React.useMemo(
    () => filterPermissionTree(businessPermissionTree, searchQuery),
    [searchQuery, businessPermissionTree],
  );

  const [expandedNodeIds, setExpandedNodeIds] = React.useState<Set<string>>(new Set());

  const toggleExpand = (nodeId: string) => {
    setExpandedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  const selectedCount = React.useMemo(
    () => selectedPermNames.size,
    [selectedPermNames],
  );

  // Recursively collect the names of all leaf permissions under a node (excludes the node itself).
  const getLeafDescendantNames = (node: PermissionNode): string[] => {
    if (node.children.length === 0) return [];
    const names: string[] = [];
    for (const child of node.children) {
      if (child.children.length === 0) {
        names.push(child.name);
      } else {
        names.push(...getLeafDescendantNames(child));
      }
    }
    return names;
  };

  // Tri-state: 'checked' | 'indeterminate' | 'unchecked'.
  // Leaf nodes reflect their own selection; parent nodes are derived purely from
  // their leaf descendants, so manually checking every child auto-checks the parent.
  type CheckState = 'checked' | 'indeterminate' | 'unchecked';
  const getNodeCheckState = (node: PermissionNode, selected: Set<string>): CheckState => {
    const leafNames = getLeafDescendantNames(node);
    if (leafNames.length === 0) {
      return selected.has(node.name) ? 'checked' : 'unchecked';
    }
    const selectedCount = leafNames.filter((n) => selected.has(n)).length;
    if (selectedCount === 0) return 'unchecked';
    if (selectedCount === leafNames.length) return 'checked';
    return 'indeterminate';
  };

  // Clicking a node toggles itself + its whole subtree together (cascading select/deselect).
  const toggleNode = (node: PermissionNode) => {
    setSelectedPermNames((prev) => {
      const state = getNodeCheckState(node, prev);
      const leafNames = getLeafDescendantNames(node);
      const namesToToggle = [node.name, ...leafNames];
      const next = new Set(prev);
      if (state === 'checked') {
        namesToToggle.forEach((n) => next.delete(n));
      } else {
        namesToToggle.forEach((n) => next.add(n));
      }
      return next;
    });
  };

  // --- Tree row: plain checkbox list to match the reference layout ---
  // Structure per row: [chevron toggle] [checkbox] [name + description]
  // No per-row card/border/background — just spacing + indentation.
  const PermissionTreeRow = ({
    perm,
    depth,
    selectedPermNames,
    onToggle,
  }: {
    perm: PermissionNode;
    depth: number;
    selectedPermNames: Set<string>;
    onToggle: (node: PermissionNode) => void;
  }) => {
    const checkState = getNodeCheckState(perm, selectedPermNames);
    const isChecked = checkState === 'checked';
    const isIndeterminate = checkState === 'indeterminate';
    const isExpanded = expandedNodeIds.has(perm.id);
    const hasChildren = perm.children.length > 0;

    return (
      <div>
        <div
          className="flex items-start gap-2 py-1.5"
          style={{ paddingLeft: `${depth * 24}px` }}
        >
          {hasChildren ? (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => toggleExpand(perm.id)}
              className="mt-0.5 h-4 w-4 flex items-center justify-center shrink-0 text-muted-foreground hover:text-foreground"
              aria-expanded={isExpanded}
            >
              {isExpanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
          ) : (
            <span className="h-4 w-4 shrink-0" />
          )}

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onToggle(perm)}
            className={cn(
              'mt-0.5 h-4 w-4 rounded border flex items-center justify-center shrink-0 transition-colors',
              isChecked || isIndeterminate
                ? 'bg-primary border-primary text-primary-foreground'
                : 'border-border bg-background hover:border-primary/40',
            )}
          >
            {isChecked && <Check className="h-3 w-3" />}
            {isIndeterminate && <Minus className="h-3 w-3" />}
          </button>

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onToggle(perm)}
            className="flex-1 text-left min-w-0"
          >
            <p className="text-sm font-semibold text-foreground leading-tight truncate">
              {perm.name}
            </p>
            {perm.description && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {perm.description}
              </p>
            )}
          </button>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {perm.children.map((child) => (
              <PermissionTreeRow
                key={child.id}
                perm={child}
                depth={depth + 1}
                selectedPermNames={selectedPermNames}
                onToggle={onToggle}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const systemSelectedCount = React.useMemo(
    () => (allPermissions?.system ?? []).filter((p) => selectedPermNames.has(p.name)).length,
    [allPermissions, selectedPermNames],
  );

  const businessSelectedCount = React.useMemo(
    () => (allPermissions?.business ?? []).filter((p) => selectedPermNames.has(p.name)).length,
    [allPermissions, selectedPermNames],
  );

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
        className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-4xl max-h-[88vh] flex flex-col"
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
          <div className="space-y-4">
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-muted-foreground">
              Permissions *
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                className="admin-input pl-10"
                placeholder="Search permissions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_1fr]">
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      System Permissions
                    </p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {systemSelectedCount}/{allPermissions?.system?.length ?? 0}
                    </p>
                  </div>
                </div>
                <div className="max-h-[340px] overflow-y-auto pr-2">
                  {filteredSystemTree.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No system permissions match.</p>
                  ) : (
                    filteredSystemTree.map((perm) => (
                      <PermissionTreeRow
                        key={perm.id}
                        perm={perm}
                        depth={0}
                        selectedPermNames={selectedPermNames}
                        onToggle={toggleNode}
                      />
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Business Permissions
                    </p>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {businessSelectedCount}/{allPermissions?.business?.length ?? 0}
                    </p>
                  </div>
                </div>
                <div className="max-h-[340px] overflow-y-auto pr-2">
                  {filteredBusinessTree.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No business permissions match.</p>
                  ) : (
                    filteredBusinessTree.map((perm) => (
                      <PermissionTreeRow
                        key={perm.id}
                        perm={perm}
                        depth={0}
                        selectedPermNames={selectedPermNames}
                        onToggle={toggleNode}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20">
          <span className="text-xs font-semibold text-primary">
            {selectedCount} permission{selectedCount !== 1 ? 's' : ''} selected
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