import * as React from 'react';
import { useUploadCrimeEvidenceMutation } from '@/services/crimeApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RefreshCw, Upload, Paperclip, X } from 'lucide-react';
import { EVIDENCE_TYPE_LABELS } from '../types';
import type { CreateEvidencePayload, EvidenceType } from '@/services/crimeApi';

interface EvidenceUploadModalProps {
  crimeId: string;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export function EvidenceUploadModal({ crimeId, onClose, onSuccess }: EvidenceUploadModalProps) {
  const [uploadEvidence, { isLoading }] = useUploadCrimeEvidenceMutation();

  const [form, setForm] = React.useState<Partial<CreateEvidencePayload>>({
    evidenceType: 'photo',
  });
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const setField = <K extends keyof CreateEvidencePayload>(k: K, v: CreateEvidencePayload[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.evidenceType) return;
    try {
      await uploadEvidence({
        crimeId,
        body: form as CreateEvidencePayload,
        file: selectedFile ?? undefined,
      }).unwrap();
      onSuccess('Evidence uploaded successfully.');
    } catch (err) {
      console.error('Evidence upload failed:', err);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <Paperclip className="h-4 w-4 text-primary" />
            Upload Evidence
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          {/* File Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
              ${dragOver
                ? 'border-primary bg-primary/5'
                : selectedFile
                  ? 'border-success/60 bg-success/5'
                  : 'border-border hover:border-primary/50 hover:bg-primary/5'
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
            />
            {selectedFile ? (
              <div className="flex items-center justify-center gap-2">
                <Paperclip className="h-5 w-5 text-success" />
                <div className="text-left">
                  <p className="text-xs font-semibold text-foreground">{selectedFile.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                  className="ml-2 p-1 hover:text-destructive rounded"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div>
                <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">
                  Drag & drop file or <span className="text-primary">click to browse</span>
                </p>
                <p className="text-[10px] text-muted-foreground/70 mt-1">
                  Supports images, videos, documents, audio, and more
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Evidence Type */}
            <div>
              <label className="admin-label">Evidence Type *</label>
              <select
                value={form.evidenceType ?? ''}
                onChange={(e) => setField('evidenceType', e.target.value as EvidenceType)}
                className="w-full h-8 px-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 mt-1"
                required
              >
                {Object.entries(EVIDENCE_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            {/* Collected Date */}
            <div>
              <label className="admin-label">Collected Date</label>
              <Input
                type="date"
                value={form.collectedDate ?? ''}
                onChange={(e) => setField('collectedDate', e.target.value)}
                className="h-8 text-xs mt-1"
              />
            </div>

            {/* Collected By */}
            <div>
              <label className="admin-label">Collected By</label>
              <Input
                value={form.collectedBy ?? ''}
                onChange={(e) => setField('collectedBy', e.target.value)}
                placeholder="Officer name"
                className="h-8 text-xs mt-1"
              />
            </div>

            {/* Collection Location */}
            <div>
              <label className="admin-label">Collection Location</label>
              <Input
                value={form.collectionLocation ?? ''}
                onChange={(e) => setField('collectionLocation', e.target.value)}
                placeholder="Where was it found?"
                className="h-8 text-xs mt-1"
              />
            </div>

            {/* Description */}
            <div className="col-span-2">
              <label className="admin-label">Description</label>
              <textarea
                rows={2}
                value={form.description ?? ''}
                onChange={(e) => setField('description', e.target.value)}
                placeholder="Describe this evidence item..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none mt-1"
              />
            </div>

            {/* Remarks */}
            <div className="col-span-2">
              <label className="admin-label">Remarks</label>
              <textarea
                rows={2}
                value={form.remarks ?? ''}
                onChange={(e) => setField('remarks', e.target.value)}
                placeholder="Chain of custody notes, condition, etc."
                className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none mt-1"
              />
            </div>
          </div>

          <DialogFooter className="pt-1">
            <Button type="button" variant="outline" size="sm" className="text-xs h-8" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="text-xs h-8 gap-1.5" disabled={isLoading}>
              {isLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              Upload Evidence
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
