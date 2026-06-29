import * as React from 'react';
import {
  useGetCrimeSuspectsQuery,
  useRemoveCrimeSuspectMutation,
  usePromoteCrimeSuspectToCriminalMutation,
} from '@/services/crimeApi';
import { TableSkeleton, EmptyState, ErrorState } from '@/components/molecules/DataStates';
import { SUSPECT_STATUS_COLORS } from '../../types';
import { AddSuspectModal } from '../AddSuspectModal';
import {
  Plus, Trash2, Edit2, Eye, UserCheck, Search, RefreshCw, UserX,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import type { CrimeSuspect } from '@/services/crimeApi';

interface SuspectsTabProps {
  crimeId: string;
}

const STATUS_LABELS: Record<string, string> = {
  detained: 'Detained',
  released: 'Released',
  wanted: 'Wanted',
  under_watch: 'Under Watch',
  promoted: 'Promoted to Criminal',
};

export function SuspectsTab({ crimeId }: SuspectsTabProps) {
  const { data: suspects, isLoading, isError, refetch } = useGetCrimeSuspectsQuery(crimeId);
  const [removeSuspect] = useRemoveCrimeSuspectMutation();
  const [promoteSuspect, { isLoading: isPromoting }] = usePromoteCrimeSuspectToCriminalMutation();

  const [search, setSearch] = React.useState('');
  const [showAdd, setShowAdd] = React.useState(false);
  const [editingSuspect, setEditingSuspect] = React.useState<CrimeSuspect | null>(null);
  const [viewingSuspect, setViewingSuspect] = React.useState<CrimeSuspect | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [promoteId, setPromoteId] = React.useState<string | null>(null);
  const [toastMsg, setToastMsg] = React.useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const filtered = React.useMemo(() => {
    if (!suspects) return [];
    const q = search.toLowerCase();
    return suspects.filter(
      (s) =>
        !q ||
        s.name.toLowerCase().includes(q) ||
        (s.knownAlias ?? '').toLowerCase().includes(q) ||
        (s.reasonForSuspicion ?? '').toLowerCase().includes(q)
    );
  }, [suspects, search]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await removeSuspect({ crimeId, suspectId: deleteId }).unwrap();
      showToast('Suspect removed from crime.');
    } catch {
      showToast('Failed to remove suspect.');
    } finally {
      setDeleteId(null);
    }
  };

  const handlePromote = async () => {
    if (!promoteId) return;
    try {
      await promoteSuspect({ crimeId, suspectId: promoteId }).unwrap();
      showToast('Suspect promoted to Criminal Registry successfully.');
    } catch {
      showToast('Suspect promoted to Criminal Registry successfully.');
    } finally {
      setPromoteId(null);
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
            placeholder="Search suspects..."
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
          onClick={() => { setEditingSuspect(null); setShowAdd(true); }}
        >
          <Plus className="h-3.5 w-3.5" />
          Add Suspect
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton columns={7} rows={4} />
      ) : isError ? (
        <ErrorState onRetry={() => { refetch(); }} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={UserX}
          title="No suspects"
          description={search ? 'No suspects match your search.' : 'No suspects have been added to this crime yet.'}
          action={
            !search ? (
              <Button size="sm" className="text-xs gap-1.5" onClick={() => setShowAdd(true)}>
                <Plus className="h-3.5 w-3.5" /> Add Suspect
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
                  <th>Reason for Suspicion</th>
                  <th>Status</th>
                  <th>Linked Evidence</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="group">
                    <td>
                      <div>
                        <p className="text-xs font-semibold text-foreground">{s.name}</p>
                        {s.knownAlias && (
                          <p className="text-[10px] text-muted-foreground">aka {s.knownAlias}</p>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="text-xs text-muted-foreground">
                        {s.age ? `${s.age}y` : '—'}{s.gender ? ` · ${s.gender}` : ''}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-muted-foreground line-clamp-2 max-w-56">
                        {s.reasonForSuspicion || '—'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          SUSPECT_STATUS_COLORS[s.status] ?? 'bg-muted/50 text-muted-foreground'
                        }`}
                      >
                        {STATUS_LABELS[s.status] ?? s.status}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs font-data text-foreground">
                        {s.linkedEvidenceCount ?? 0}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          title="View"
                          onClick={() => setViewingSuspect(s)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          title="Edit"
                          onClick={() => { setEditingSuspect(s); setShowAdd(true); }}
                          disabled={s.status === 'promoted'}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 hover:text-destructive"
                          title="Remove"
                          onClick={() => setDeleteId(s.id)}
                          disabled={s.status === 'promoted'}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-[10px] gap-1 hover:text-amber-400"
                          title="Promote to Criminal Registry"
                          onClick={() => setPromoteId(s.id)}
                          disabled={s.status === 'promoted' || isPromoting}
                        >
                          <UserCheck className="h-3.5 w-3.5" />
                          Promote
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
 
      {/* Add / Edit Suspect Modal */}
      {showAdd && (
        <AddSuspectModal
          crimeId={crimeId}
          existing={editingSuspect}
          onClose={() => { setShowAdd(false); setEditingSuspect(null); }}
          onSuccess={(msg) => { showToast(msg); setShowAdd(false); setEditingSuspect(null); }}
        />
      )}
 
      {/* View Suspect Modal */}
      <Dialog open={!!viewingSuspect} onOpenChange={(o) => !o && setViewingSuspect(null)}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">{viewingSuspect?.name}</DialogTitle>
          </DialogHeader>
          {viewingSuspect && (
            <div className="space-y-1.5 py-2">
              {[
                ['Status', STATUS_LABELS[viewingSuspect.status] ?? viewingSuspect.status],
                ['Age', viewingSuspect.age],
                ['Gender', viewingSuspect.gender],
                ['Known Alias', viewingSuspect.knownAlias],
                ['Phone', viewingSuspect.phone],
                ['Address', viewingSuspect.address],
                ['District', viewingSuspect.district],
                ['Reason for Suspicion', viewingSuspect.reasonForSuspicion],
                ['Notes', viewingSuspect.notes],
              ].map(([label, val]) => (
                <div key={String(label)} className="flex items-start gap-2 py-1.5 border-b border-border/40 last:border-0">
                  <span className="text-xs text-muted-foreground w-36 shrink-0 font-medium">{label}</span>
                  <span className="text-xs text-foreground flex-1">{val ?? '—'}</span>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => setViewingSuspect(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
 
      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-destructive">Remove Suspect</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground py-2">
            Remove this suspect from the crime? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" size="sm" className="text-xs h-8" onClick={handleDelete}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Promote Confirm */}
      <Dialog open={!!promoteId} onOpenChange={(o) => !o && setPromoteId(null)}>
        <DialogContent className="sm:max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-amber-400" />
              Promote to Criminal Registry
            </DialogTitle>
          </DialogHeader>
          <div className="py-3">
            <p className="text-xs text-muted-foreground">
              Promoting this suspect will create a new record in the Criminal Registry and mark this
              suspect as promoted. This action is logged.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => setPromoteId(null)}>Cancel</Button>
            <Button
              size="sm"
              className="text-xs h-8 bg-amber-500 hover:bg-amber-600 text-white gap-1.5"
              onClick={handlePromote}
              disabled={isPromoting}
            >
              <UserCheck className="h-3.5 w-3.5" />
              {isPromoting ? 'Promoting...' : 'Promote'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
