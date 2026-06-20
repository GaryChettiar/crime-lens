import * as React from 'react';
import { AdminLayout } from '@/components/templates/AdminLayout/AdminLayout';
import { useGetRanksQuery, useCreateRankMutation, useDeleteRankMutation } from '@/services/policeRanksApi';
import { TableSkeleton, EmptyState, ErrorState } from '@/components/molecules/DataStates';
import { Plus, Trash2, Award, Loader2 } from 'lucide-react';

export function PoliceRanksPage() {
  const { data: ranks, isLoading, isError, refetch } = useGetRanksQuery();
  const [createRank, { isLoading: isCreating }] = useCreateRankMutation();
  const [deleteRank] = useDeleteRankMutation();

  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
  const [newName, setNewName] = React.useState('');
  const [newLevel, setNewLevel] = React.useState('1');
  const [newDesc, setNewDesc] = React.useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await createRank({
        name: newName.trim(),
        level: newLevel ? parseInt(newLevel, 10) : undefined,
        description: newDesc.trim() || undefined,
      }).unwrap();
      setNewName('');
      setNewLevel('1');
      setNewDesc('');
      setShowCreateModal(false);
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRank(id).unwrap();
      setConfirmDeleteId(null);
    } catch (e) { console.error(e); }
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">Police Ranks</h1>
            <p className="text-sm mt-0.5 text-muted-foreground">Manage hierarchy, officer ranks, and command levels.</p>
          </div>
          <button className="admin-btn admin-btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4" /> Add Rank
          </button>
        </div>

        {isLoading && <TableSkeleton columns={4} rows={5} />}
        {isError && <ErrorState title="Failed to load police ranks" onRetry={refetch} />}
        {!isLoading && !isError && ranks && ranks.length === 0 && (
          <EmptyState icon={Award} title="No police ranks" description="No ranks have been configured yet." />
        )}
        {!isLoading && !isError && ranks && ranks.length > 0 && (
          <div className="admin-card overflow-hidden">
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead><tr><th>Rank Name</th><th>Command Level</th><th>Description</th><th className="w-[100px]">Actions</th></tr></thead>
                <tbody>
                  {ranks.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-primary/15 shrink-0">
                            <Award className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-semibold text-sm text-foreground">{r.name}</span>
                        </div>
                      </td>
                      <td><span className="text-sm text-muted-foreground font-mono">Level {r.level ?? 1}</span></td>
                      <td><span className="text-sm text-muted-foreground">{r.description || '—'}</span></td>
                      <td>
                        <button className="p-1.5 rounded-md hover:bg-danger/10" onClick={() => setConfirmDeleteId(r.id)} title="Delete">
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
            <h2 className="text-lg font-bold mb-4 text-foreground">Add Police Rank</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">Rank Name *</label>
                <input className="admin-input" required value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Inspector" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">Command Level (1-10)</label>
                <input type="number" min="1" max="20" className="admin-input" value={newLevel} onChange={(e) => setNewLevel(e.target.value)} />
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
            <h2 className="text-lg font-bold mb-2 text-foreground">Delete Police Rank</h2>
            <p className="text-sm text-muted-foreground mb-5">Are you sure? Officer profiles associated with this rank could lose rank specifications.</p>
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
