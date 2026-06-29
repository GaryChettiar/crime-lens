import * as React from 'react';
import {
  useGetCrimeLegalSectionsQuery,
  useRemoveCrimeLegalSectionMutation,
} from '@/services/crimeApi';
import { TableSkeleton, EmptyState, ErrorState } from '@/components/molecules/DataStates';
import { SEVERITY_COLORS } from '../../types';
import { AddLegalSectionModal } from '../AddLegalSectionModal';
import { Plus, Trash2, Search, RefreshCw, Scale, Check, X as XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface LegalSectionsTabProps {
  crimeId: string;
}

const SEVERITY_LABELS: Record<string, string> = {
  minor: 'Minor',
  moderate: 'Moderate',
  serious: 'Serious',
  grievous: 'Grievous',
};

export function LegalSectionsTab({ crimeId }: LegalSectionsTabProps) {
  const { data: sections, isLoading, isError, refetch } = useGetCrimeLegalSectionsQuery(crimeId);
  const [removeSection] = useRemoveCrimeLegalSectionMutation();

  const [search, setSearch] = React.useState('');
  const [showAdd, setShowAdd] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [toastMsg, setToastMsg] = React.useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const filtered = React.useMemo(() => {
    if (!sections) return [];
    const q = search.toLowerCase();
    return sections.filter(
      (s) =>
        !q ||
        s.act.toLowerCase().includes(q) ||
        s.section.toLowerCase().includes(q) ||
        s.title.toLowerCase().includes(q)
    );
  }, [sections, search]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await removeSection({ crimeId, sectionId: deleteId }).unwrap();
      showToast('Legal section removed.');
    } catch {
      showToast('Failed to remove section.');
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
            placeholder="Search legal sections..."
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
          onClick={() => setShowAdd(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          Add Section
        </Button>
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton columns={7} rows={4} />
      ) : isError ? (
        <ErrorState onRetry={() => { refetch(); }} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Scale}
          title="No legal sections"
          description={search ? 'No legal sections match your search.' : 'No legal sections have been added to this crime incident yet.'}
          action={
            !search ? (
              <Button size="sm" className="text-xs gap-1.5" onClick={() => setShowAdd(true)}>
                <Plus className="h-3.5 w-3.5" /> Add Section
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
                  <th>Act</th>
                  <th>Section</th>
                  <th>Title</th>
                  <th>Severity</th>
                  <th>Bailable</th>
                  <th>Cognizable</th>
                  <th>Punishment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sec) => (
                  <tr key={sec.id} className="group">
                    <td className="font-mono text-xs font-semibold text-foreground">
                      {sec.act}
                    </td>
                    <td className="font-mono text-xs text-foreground">
                      {sec.section}
                    </td>
                    <td>
                      <span className="text-xs text-foreground font-medium">
                        {sec.title}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          SEVERITY_COLORS[sec.severity] ??
                          'bg-muted/50 text-muted-foreground'
                        }`}
                      >
                        {SEVERITY_LABELS[sec.severity] ?? sec.severity}
                      </span>
                    </td>
                    <td>
                      {sec.isBailable ? (
                        <Check className="h-3.5 w-3.5 text-success" />
                      ) : (
                        <XIcon className="h-3.5 w-3.5 text-destructive" />
                      )}
                    </td>
                    <td>
                      {sec.isCognizable ? (
                        <Check className="h-3.5 w-3.5 text-success" />
                      ) : (
                        <XIcon className="h-3.5 w-3.5 text-destructive" />
                      )}
                    </td>
                    <td>
                      <span className="text-xs text-muted-foreground line-clamp-1 max-w-40">
                        {sec.punishment || '—'}
                      </span>
                    </td>
                    <td>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 hover:text-destructive"
                          onClick={() => setDeleteId(sec.id)}
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

      {showAdd && (
        <AddLegalSectionModal
          crimeId={crimeId}
          onClose={() => setShowAdd(false)}
          onSuccess={(msg) => { showToast(msg); setShowAdd(false); }}
        />
      )}

      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-destructive">Remove Legal Section</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground py-2">Remove this legal section from the crime?</p>
          <DialogFooter>
            <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" size="sm" className="text-xs h-8" onClick={handleDelete}>Remove</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
