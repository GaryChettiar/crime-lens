import * as React from 'react';
import {
  useGetVictimsByIncidentQuery,
  useDeleteCaseVictimMutation,
} from '@/services/crimeApi';
import { TableSkeleton, EmptyState, ErrorState } from '@/components/molecules/DataStates';
import { AddVictimModal } from '../AddVictimModal';
import {
  Plus, Trash2, Edit2, Eye, Search, RefreshCw, UserX, HeartPulse,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import type { CaseVictim } from '@/services/crimeApi';

interface VictimsTabProps {
  incidentId: string;
}

export function VictimsTab({ incidentId }: VictimsTabProps) {
  const { data: victims, isLoading, isError, refetch } = useGetVictimsByIncidentQuery(incidentId);
  const [deleteVictim] = useDeleteCaseVictimMutation();

  const [search, setSearch] = React.useState('');
  const [showAdd, setShowAdd] = React.useState(false);
  const [editingVictim, setEditingVictim] = React.useState<CaseVictim | null>(null);
  const [viewingVictim, setViewingVictim] = React.useState<CaseVictim | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [toastMsg, setToastMsg] = React.useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const filtered = React.useMemo(() => {
    if (!victims) return [];
    const q = search.toLowerCase();
    return victims.filter(
      (v) =>
        !q ||
        v.fullName.toLowerCase().includes(q) ||
        (v.occupation ?? '').toLowerCase().includes(q) ||
        (v.injuryType ?? '').toLowerCase().includes(q) ||
        (v.mobileNumber ?? '').toLowerCase().includes(q)
    );
  }, [victims, search]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteVictim({ id: deleteId, incidentId }).unwrap();
      showToast('Victim record removed.');
    } catch {
      showToast('Failed to remove victim.');
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
            placeholder="Search victims..."
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
          onClick={() => { setEditingVictim(null); setShowAdd(true); }}
        >
          <Plus className="h-3.5 w-3.5" />
          Add Victim
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
          title="No victims logged"
          description={search ? 'No victims match your search query.' : 'No victims have been added to this incident record.'}
          action={
            !search ? (
              <Button size="sm" className="text-xs gap-1.5" onClick={() => setShowAdd(true)}>
                <Plus className="h-3.5 w-3.5" /> Add Victim
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
                  <th>Gender / Contact</th>
                  <th>Occupation</th>
                  <th>Injury Status</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => (
                  <tr key={v.id} className="group">
                    <td>
                      <div>
                        <p className="text-xs font-semibold text-foreground">{v.fullName}</p>
                        {v.address && (
                          <p className="text-[10px] text-muted-foreground truncate max-w-48">{v.address}</p>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="text-xs text-muted-foreground">
                        {v.gender || '—'}{v.mobileNumber ? ` · ${v.mobileNumber}` : ''}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-muted-foreground">
                        {v.occupation || '—'}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-muted-foreground">
                        {v.injuryType || '—'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          v.alive
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                        }`}
                      >
                        <HeartPulse className="h-3 w-3 mr-1" />
                        {v.alive ? 'Alive' : 'Deceased'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          title="View Details"
                          onClick={() => setViewingVictim(v)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          title="Edit"
                          onClick={() => { setEditingVictim(v); setShowAdd(true); }}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 hover:text-destructive"
                          title="Remove"
                          onClick={() => setDeleteId(v.id)}
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

      {/* Add / Edit Victim Modal */}
      {showAdd && (
        <AddVictimModal
          incidentId={incidentId}
          existing={editingVictim}
          onClose={() => { setShowAdd(false); setEditingVictim(null); }}
          onSuccess={(msg) => { showToast(msg); setShowAdd(false); setEditingVictim(null); }}
        />
      )}

      {/* View Victim Modal */}
      <Dialog open={!!viewingVictim} onOpenChange={(o) => !o && setViewingVictim(null)}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">{viewingVictim?.fullName}</DialogTitle>
          </DialogHeader>
          {viewingVictim && (
            <div className="space-y-1.5 py-2">
              {[
                ['Status', viewingVictim.alive ? 'Alive' : 'Deceased'],
                ['Gender', viewingVictim.gender],
                ['Mobile', viewingVictim.mobileNumber],
                ['Email', viewingVictim.email],
                ['Occupation', viewingVictim.occupation],
                ['Address', viewingVictim.address],
                ['Injury Type', viewingVictim.injuryType],
                ['Medical Report #', viewingVictim.medicalReportNumber],
              ].map(([label, val]) => (
                <div key={String(label)} className="flex items-start gap-2 py-1.5 border-b border-border/40 last:border-0">
                  <span className="text-xs text-muted-foreground w-36 shrink-0 font-medium">{label}</span>
                  <span className="text-xs text-foreground flex-1">{val ? String(val) : '—'}</span>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => setViewingVictim(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-destructive">Remove Victim Record</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground py-2">
            Are you sure you want to remove this victim from the incident record?
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
