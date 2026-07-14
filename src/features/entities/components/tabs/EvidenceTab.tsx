import * as React from 'react';
import {
  useGetCrimeEvidenceQuery,
  useDeleteCrimeEvidenceMutation,
} from '@/services/crimeApi';
import { TableSkeleton, EmptyState, ErrorState } from '@/components/molecules/DataStates';
import {
  EVIDENCE_TYPE_LABELS, EVIDENCE_VERIFICATION_COLORS, CUSTODY_STATUS_COLORS,
} from '../../types';
import { EvidenceUploadModal } from '../EvidenceUploadModal';
import {
  Plus, Trash2, Eye, Download, Search, RefreshCw, Paperclip,
  FileImage, FileVideo, FileAudio, FileText, Shield, Dna,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import type { CrimeEvidence, EvidenceType } from '@/services/crimeApi';

interface EvidenceTabProps {
  crimeId: string;
}

const EVIDENCE_ICONS: Partial<Record<EvidenceType, React.ElementType>> = {
  photo: FileImage,
  video: FileVideo,
  audio: FileAudio,
  document: FileText,
  fingerprint: Shield,
  dna: Dna,
};

const CUSTODY_LABELS: Record<string, string> = {
  intact: 'Intact',
  reviewed: 'Reviewed',
  disputed: 'Disputed',
};

const VERIFY_LABELS: Record<string, string> = {
  pending: 'Pending',
  verified: 'Verified',
  rejected: 'Rejected',
};

function EvidenceTypeIcon({ type }: { type: EvidenceType }) {
  const Icon = EVIDENCE_ICONS[type] ?? Paperclip;
  return <Icon className="h-3.5 w-3.5" />;
}

export function EvidenceTab({ crimeId }: EvidenceTabProps) {
  const { data: evidence, isLoading, isError, refetch } = useGetCrimeEvidenceQuery(crimeId);
  const [deleteEvidence] = useDeleteCrimeEvidenceMutation();

  const [search, setSearch] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState('');
  const [showUpload, setShowUpload] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [viewingEvidence, setViewingEvidence] = React.useState<CrimeEvidence | null>(null);
  const [toastMsg, setToastMsg] = React.useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const filtered = React.useMemo(() => {
    let list = evidence ?? [];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          e.evidenceNumber.toLowerCase().includes(q) ||
          (e.description ?? '').toLowerCase().includes(q) ||
          (e.collectedBy ?? '').toLowerCase().includes(q)
      );
    }
    if (typeFilter) {
      list = list.filter((e) => e.evidenceType === typeFilter);
    }
    return list;
  }, [evidence, search, typeFilter]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteEvidence({ crimeId, evidenceId: deleteId }).unwrap();
      showToast('Evidence deleted successfully.');
    } catch {
      showToast('Failed to delete evidence.');
    } finally {
      setDeleteId(null);
    }
  };

  const isImageType = (mime?: string) => {
    if (!mime) return false;
    return mime.startsWith('image/');
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
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search evidence..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-8 px-3 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
        >
          <option value="">All Types</option>
          {Object.entries(EVIDENCE_TYPE_LABELS).map(([k, label]) => (
            <option key={k} value={k}>{label}</option>
          ))}
        </select>

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
          onClick={() => setShowUpload(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          Upload Evidence
        </Button>
      </div>

      {/* Grid or Table */}
      {isLoading ? (
        <TableSkeleton columns={7} rows={4} />
      ) : isError ? (
        <ErrorState onRetry={() => { refetch(); }} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Paperclip}
          title="No evidence found"
          description={search || typeFilter ? 'No evidence matches your filter criteria.' : 'No evidence has been uploaded to this crime incident.'}
          action={
            !search && !typeFilter ? (
              <Button size="sm" className="text-xs gap-1.5" onClick={() => setShowUpload(true)}>
                <Plus className="h-3.5 w-3.5" /> Upload Evidence
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
                  <th>No.</th>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Collected By</th>
                  <th>Custody</th>
                  <th>Verify Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ev) => (
                  <tr key={ev.id} className="group">
                    <td className="font-mono text-xs font-semibold text-foreground">
                      {ev.evidenceNumber}
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-1.5 text-xs text-foreground font-medium">
                        <EvidenceTypeIcon type={ev.evidenceType} />
                        {EVIDENCE_TYPE_LABELS[ev.evidenceType] ?? ev.evidenceType}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-muted-foreground line-clamp-2 max-w-sm">
                        {ev.description || '—'}
                      </span>
                    </td>
                    <td>
                      <div>
                        <p className="text-xs text-foreground font-medium">{ev.collectedBy || 'Officer'}</p>
                        {ev.collectedDate && (
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(ev.collectedDate).toLocaleDateString('en-IN')}
                          </p>
                        )}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          CUSTODY_STATUS_COLORS[ev.chainOfCustodyStatus] ??
                          'bg-muted/50 text-muted-foreground'
                        }`}
                      >
                        {CUSTODY_LABELS[ev.chainOfCustodyStatus] ?? ev.chainOfCustodyStatus}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          EVIDENCE_VERIFICATION_COLORS[ev.verificationStatus] ??
                          'bg-muted/50 text-muted-foreground'
                        }`}
                      >
                        {VERIFY_LABELS[ev.verificationStatus] ?? ev.verificationStatus}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          title="View metadata"
                          onClick={() => setViewingEvidence(ev)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {ev.fileUrl && (
                          <a href={ev.fileUrl} download target="_blank" rel="noreferrer">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Download">
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                          </a>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 hover:text-destructive"
                          title="Delete"
                          onClick={() => setDeleteId(ev.id)}
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

      {/* Upload Modal */}
      {showUpload && (
        <EvidenceUploadModal
          crimeId={crimeId}
          onClose={() => setShowUpload(false)}
          onSuccess={(msg) => { showToast(msg); setShowUpload(false); }}
        />
      )}

      {/* Evidence Metadata Panel */}
      <Dialog open={!!viewingEvidence} onOpenChange={(o) => !o && setViewingEvidence(null)}>
        <DialogContent className="sm:max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-primary" />
              Evidence Metadata — {viewingEvidence?.evidenceNumber}
            </DialogTitle>
          </DialogHeader>
          {viewingEvidence && (
            <div className="space-y-1">
              {/* Preview if image */}
              {viewingEvidence.fileUrl && isImageType(viewingEvidence.fileMimeType) && (
                <div className="rounded-lg overflow-hidden border border-border/60 mb-3">
                  <img
                    src={viewingEvidence.fileUrl}
                    alt="Evidence preview"
                    className="w-full max-h-48 object-cover"
                  />
                </div>
              )}
              {[
                ['Evidence Number', viewingEvidence.evidenceNumber],
                ['Type', EVIDENCE_TYPE_LABELS[viewingEvidence.evidenceType]],
                ['Description', viewingEvidence.description],
                ['Collected By', viewingEvidence.collectedBy],
                ['Collection Time', viewingEvidence.collectedDate],
                ['Collection Location', viewingEvidence.collectionLocation],
                ['Uploaded By', viewingEvidence.uploadedBy],
                ['File Name', viewingEvidence.fileName],
                ['File Size', viewingEvidence.fileSize ? `${(viewingEvidence.fileSize / 1024).toFixed(1)} KB` : undefined],
                ['Hash', viewingEvidence.hash],
                ['Storage Path', viewingEvidence.storagePath],
                ['Chain of Custody', CUSTODY_LABELS[viewingEvidence.chainOfCustodyStatus]],
                ['Verification', VERIFY_LABELS[viewingEvidence.verificationStatus]],
                ['Remarks', viewingEvidence.remarks],
              ].map(([label, val]) => (
                <div key={String(label)} className="flex items-start gap-2 py-1.5 border-b border-border/30 last:border-0">
                  <span className="text-xs text-muted-foreground w-36 shrink-0 font-medium">{label}</span>
                  <span className="text-xs text-foreground flex-1 break-all">{val ?? '—'}</span>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => setViewingEvidence(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <DialogContent className="sm:max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold text-destructive">Delete Evidence</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground py-2">
            Permanently delete this evidence item? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" size="sm" className="text-xs h-8" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
