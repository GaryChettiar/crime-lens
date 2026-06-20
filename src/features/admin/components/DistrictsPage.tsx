import * as React from 'react';
import { AdminLayout } from '@/components/templates/AdminLayout/AdminLayout';
import { useGetDistrictsQuery, useCreateDistrictMutation, useDeleteDistrictMutation } from '@/services/districtsApi';
import { TableSkeleton, EmptyState, ErrorState } from '@/components/molecules/DataStates';
import { Plus, Trash2, MapPin, Loader2 } from 'lucide-react';

export function DistrictsPage() {
  const { data: districts, isLoading, isError, refetch } = useGetDistrictsQuery();
  const [createDistrict, { isLoading: isCreating }] = useCreateDistrictMutation();
  const [deleteDistrict] = useDeleteDistrictMutation();

  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
  const [newName, setNewName] = React.useState('');
  const [newCode, setNewCode] = React.useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await createDistrict({ name: newName.trim(), code: newCode.trim() || undefined, state: 'Karnataka' }).unwrap();
      setNewName('');
      setNewCode('');
      setShowCreateModal(false);
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDistrict(id).unwrap();
      setConfirmDeleteId(null);
    } catch (e) { console.error(e); }
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">Districts</h1>
            <p className="text-sm mt-0.5 text-muted-foreground">Manage geographic districts for crime mapping.</p>
          </div>
          <button className="admin-btn admin-btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4" /> Add District
          </button>
        </div>

        {isLoading && <TableSkeleton columns={4} rows={5} />}
        {isError && <ErrorState title="Failed to load districts" onRetry={refetch} />}
        {!isLoading && !isError && districts && districts.length === 0 && (
          <EmptyState icon={MapPin} title="No districts" description="No districts have been configured yet." />
        )}
        {!isLoading && !isError && districts && districts.length > 0 && (
          <div className="admin-card overflow-hidden">
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead><tr><th>District</th><th>Code</th><th>State</th><th className="w-[100px]">Actions</th></tr></thead>
                <tbody>
                  {districts.map((d) => (
                    <tr key={d.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-primary/15 shrink-0">
                            <MapPin className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-semibold text-sm text-foreground">{d.name}</span>
                        </div>
                      </td>
                      <td><span className="text-sm text-muted-foreground font-mono">{d.code || '—'}</span></td>
                      <td><span className="text-sm text-muted-foreground">{d.state || 'Karnataka'}</span></td>
                      <td>
                        <button className="p-1.5 rounded-md hover:bg-danger/10" onClick={() => setConfirmDeleteId(d.id)} title="Delete">
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
            <h2 className="text-lg font-bold mb-4 text-foreground">Add District</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">District Name *</label>
                <input className="admin-input" required value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Bangalore Urban" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">Code</label>
                <input className="admin-input" value={newCode} onChange={(e) => setNewCode(e.target.value)} placeholder="e.g. BLR" />
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
            <h2 className="text-lg font-bold mb-2 text-foreground">Delete District</h2>
            <p className="text-sm text-muted-foreground mb-5">Are you sure? This may affect station and crime mappings.</p>
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
