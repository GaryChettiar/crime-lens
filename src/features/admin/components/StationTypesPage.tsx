import * as React from 'react';
import { AdminLayout } from '@/components/templates/AdminLayout/AdminLayout';
import { useGetStationTypesQuery, useCreateStationTypeMutation, useDeleteStationTypeMutation } from '@/services/stationTypesApi';
import { TableSkeleton, EmptyState, ErrorState } from '@/components/molecules/DataStates';
import { Plus, Trash2, ShieldAlert, Loader2 } from 'lucide-react';

export function StationTypesPage() {
  const { data: types, isLoading, isError, refetch } = useGetStationTypesQuery();
  const [createType, { isLoading: isCreating }] = useCreateStationTypeMutation();
  const [deleteType] = useDeleteStationTypeMutation();

  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
  const [newName, setNewName] = React.useState('');
  const [newDesc, setNewDesc] = React.useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await createType({ name: newName.trim(), description: newDesc.trim() || undefined }).unwrap();
      setNewName('');
      setNewDesc('');
      setShowCreateModal(false);
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteType(id).unwrap();
      setConfirmDeleteId(null);
    } catch (e) { console.error(e); }
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">Station Types</h1>
            <p className="text-sm mt-0.5 text-muted-foreground">Manage police station classifications and designations.</p>
          </div>
          <button className="admin-btn admin-btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4" /> Add Station Type
          </button>
        </div>

        {isLoading && <TableSkeleton columns={3} rows={4} />}
        {isError && <ErrorState title="Failed to load station types" onRetry={refetch} />}
        {!isLoading && !isError && types && types.length === 0 && (
          <EmptyState icon={ShieldAlert} title="No station types" description="No station types have been configured yet." />
        )}
        {!isLoading && !isError && types && types.length > 0 && (
          <div className="admin-card overflow-hidden">
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead><tr><th>Type</th><th>Description</th><th className="w-[100px]">Actions</th></tr></thead>
                <tbody>
                  {types.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-primary/15 shrink-0">
                            <ShieldAlert className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-semibold text-sm text-foreground">{t.name}</span>
                        </div>
                      </td>
                      <td><span className="text-sm text-muted-foreground">{t.description || '—'}</span></td>
                      <td>
                        <button className="p-1.5 rounded-md hover:bg-danger/10" onClick={() => setConfirmDeleteId(t.id)} title="Delete">
                          <Trash2 className="h-4 w-4 text-danger" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4 text-foreground">Add Station Type</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">Type Name *</label>
                <input className="admin-input" required value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Law & Order" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">Description</label>
                <textarea className="admin-input min-h-[80px] py-2" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Enter details..." />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={isCreating}>
                  {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold mb-2 text-foreground">Delete Station Type</h2>
            <p className="text-sm text-muted-foreground mb-5">Are you sure? Station classifications linked to this type might be impacted.</p>
            <div className="flex justify-end gap-2">
              <button className="admin-btn admin-btn-secondary" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
              <button className="admin-btn admin-btn-danger" onClick={() => handleDelete(confirmDeleteId)}>
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
