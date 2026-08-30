import * as React from 'react';
import {
  useGetWitnessesByIncidentQuery,
  useDeleteCaseWitnessMutation,
} from '@/services/crimeApi';
import { TableSkeleton, EmptyState, ErrorState } from '@/components/molecules/DataStates';
import { AddWitnessModal } from '../AddWitnessModal';
import {
  Plus, Trash2, Edit2, Eye, Search, RefreshCw, UserX, MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import type { CaseWitness } from '@/services/crimeApi';

interface WitnessTabProps {
  incidentId: string;
  items?: CaseWitness[];
}

export function WitnessTab({ incidentId, items }: WitnessTabProps) {
  const { data: fetchedWitnesses, isLoading, isError, refetch } = useGetWitnessesByIncidentQuery(incidentId, {
    skip: items !== undefined,
  });
  const witnesses = fetchedWitnesses ?? items ?? [];
  const [deleteWitness] = useDeleteCaseWitnessMutation();

  const [search, setSearch] = React.useState('');
  const [showAdd, setShowAdd] = React.useState(false);
  const [editingWitness, setEditingWitness] = React.useState<CaseWitness | null>(null);
  const [viewingWitness, setViewingWitness] = React.useState<CaseWitness | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [toastMsg, setToastMsg] = React.useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const filtered = React.useMemo(() => {
    if (!witnesses) return [];
    const q = search.toLowerCase();
    return witnesses.filter(
      (w) =>
        !q ||
        w.fullName.toLowerCase().includes(q) ||
        (w.witnessType ?? '').toLowerCase().includes(q) ||
        (w.statement ?? '').toLowerCase().includes(q) ||
        (w.mobileNumber ?? '').toLowerCase().includes(q)
    );
  }, [witnesses, search]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteWitness({ id: deleteId, incidentId }).unwrap();
      showToast('Witness record removed.');
    } catch {
      showToast('Failed to remove witness.');
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toastMsg && (
        <div className="p-3 bg-success/15 border border-success/30 rounded-lg text-xs text-success animate-in fade-in slide-in-from-top-2 duration-200">
          {toastMsg}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search witnesses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-8 px-3 text-xs gap-1.5"
          onClick={() => refetch()}
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="sm"
          className="h-8 px-3 text-xs gap-1.5"
          onClick={() => { setEditingWitness(null); setShowAdd(true); }}
        >
          <Plus className="h-3.5 w-3.5" />
          Add Witness
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton columns={6} rows={4} />
      ) : isError ? (
        <ErrorState onRetry={() => { refetch(); }} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={UserX}
          title="No witnesses logged"
          description={search ? 'No witnesses match your search query.' : 'No witnesses have been recorded for this incident.'}
          action={
            !search ? (
              <Button size="sm" className="text-xs gap-1.5" onClick={() => setShowAdd(true)}>
                <Plus className="h-3.5 w-3.5" /> Add Witness
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="admin-card overflow-hidden">
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Age / Gender</th>
                  <th>Witness Type</th>
                  <th>Statement Excerpt</th>
                  <th>Contact</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((w) => (
                  <tr key={w.id} className="group">
                    <td>
                      <div>
                        <p className="text-xs font-semibold text-foreground">{w.fullName}</p>
                        {w.occupation && (
                          <p className="text-[10px] text-muted-foreground">{w.occupation}</p>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="text-xs text-muted-foreground">
                        {w.age ? `${w.age}y` : '—'}{w.gender ? ` · ${w.gender}` : ''}
                      </span>
                    </td>
                    <td>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-primary/10 text-primary border-primary/20">
                        {w.witnessType || 'Witness'}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-muted-foreground line-clamp-2 max-w-64">
                        {w.statement || 'No statement recorded yet.'}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-muted-foreground">
                        {w.mobileNumber || w.email || '—'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          title="View Statement"
                          onClick={() => setViewingWitness(w)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          title="Edit"
                          onClick={() => { setEditingWitness(w); setShowAdd(true); }}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 hover:text-destructive"
                          title="Remove"
                          onClick={() => setDeleteId(w.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Witness Modal */}
      {showAdd && (
        <AddWitnessModal
          incidentId={incidentId}
          existing={editingWitness}
          onClose={() => { setShowAdd(false); setEditingWitness(null); }}
          onSuccess={(msg) => { showToast(msg); setShowAdd(false); setEditingWitness(null); }}
        />
      )}

      {/* View Witness Statement Modal */}
      <Dialog open={!!viewingWitness} onOpenChange={(o) => !o && setViewingWitness(null)}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              {viewingWitness?.fullName}
            </DialogTitle>
          </DialogHeader>
          {viewingWitness && (
            <div className="space-y-3 py-2">
              <div className="space-y-1.5 border-b border-border/40 pb-2">
                {[
                  ['Witness Type', viewingWitness.witnessType],
                  ['Age / Gender', `${viewingWitness.age ? `${viewingWitness.age}y` : ''} ${viewingWitness.gender || ''}`.trim() || '—'],
                  ['Occupation', viewingWitness.occupation],
                  ['Contact', viewingWitness.mobileNumber || viewingWitness.email],
                  ['Address', viewingWitness.address],
                ].map(([label, val]) => (
                  <div key={String(label)} className="flex items-start gap-2 py-1">
                    <span className="text-xs text-muted-foreground w-28 shrink-0 font-medium">{label}</span>
                    <span className="text-xs text-foreground flex-1">{val ? String(val) : '—'}</span>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-xs font-semibold text-foreground mb-1">Recorded Statement</p>
                <div className="p-3 bg-muted/30 border border-border/60 rounded-lg text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                  {viewingWitness.statement || 'No detailed statement on record.'}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => setViewingWitness(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-destructive">Remove Witness Record</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground py-2">
            Are you sure you want to remove this witness from the incident record?
          </p>
          <DialogFooter>
            <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" size="sm" className="text-xs h-8" onClick={handleDelete}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
