import * as React from 'react';
import { useGetEvidenceBlobQuery } from '@/services/storageApi';
import { Button } from '@/components/ui/button';
import type { CrimeEvidence } from '@/services/crimeApi';
import {
  FileText,
  File as FileIcon,
  Download,
  Loader2,
  ImageOff,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
} from 'lucide-react';

interface EvidenceTabProps {
  crimeId: string;
  initialEvidence: CrimeEvidence[];
}

function isImageMime(mime?: string) {
  return !!mime && mime.startsWith('image/');
}
function isVideoMime(mime?: string) {
  return !!mime && mime.startsWith('video/');
}
function isPdfMime(mime?: string) {
  return mime === 'application/pdf';
}
// Browsers cannot render TIFF inside <img>, regardless of what mime type
// is reported, so it needs its own branch rather than falling under "image".
function isTiffMime(mime?: string) {
  return mime === 'image/tiff' || mime === 'image/tif';
}

// Generic/placeholder values that should never be trusted as the real
// content type — treat them the same as "no mime type at all".
const GENERIC_MIME_VALUES = new Set(['application/octet-stream', 'binary/octet-stream', '']);

// Strips params (e.g. "application/octet-stream; charset=binary") and
// rejects generic/placeholder values so callers can fall through to the
// next source instead of getting stuck on a useless mime type.
function normalizeMime(mime?: string | null): string | undefined {
  if (!mime) return undefined;
  const base = mime.split(';')[0].trim().toLowerCase();
  return GENERIC_MIME_VALUES.has(base) ? undefined : base;
}

// Fallback for when neither the evidence record nor the blob response
// gives us a usable mime type (e.g. server returns application/octet-stream,
// or the evidence record's stored mime type is generic because the item
// was filed under evidenceType "OTHER").
function guessMimeFromPath(path?: string): string | undefined {
  if (!path) return undefined;
  const ext = path.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    bmp: 'image/bmp',
    tif: 'image/tiff',
    tiff: 'image/tiff',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
    pdf: 'application/pdf',
  };
  return ext ? map[ext] : undefined;
}

const VERIFICATION_STYLES: Record<CrimeEvidence['verificationStatus'], string> = {
  verified: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
};

const CUSTODY_ICON: Record<CrimeEvidence['chainOfCustodyStatus'], React.ElementType> = {
  intact: ShieldCheck,
  reviewed: ShieldQuestion,
  disputed: ShieldAlert,
};

function EvidencePreview({ item }: { item: CrimeEvidence }) {
  const objectPath = item.fileUrl;
  const { data, isFetching, isError } = useGetEvidenceBlobQuery(objectPath ?? '', {
    skip: !objectPath,
  });

  // Prefer explicit metadata, then whatever the blob endpoint reported,
  // then fall back to guessing from the file extension. Each source is
  // normalized and generic values (application/octet-stream, empty, etc.)
  // are treated as "no answer" so a bad value from one source doesn't
  // block a good one from the next — this is what was silently forcing
  // every OTHER-typed item to the generic file icon.
  const mime =
    normalizeMime(item.fileMimeType) ||
    normalizeMime(data?.contentType) ||
    guessMimeFromPath(objectPath);

  const displayName = item.fileName || objectPath?.split('/').pop() || 'Evidence file';
  const CustodyIcon = CUSTODY_ICON[item.chainOfCustodyStatus] ?? ShieldQuestion;

  const handleDownload = () => {
    if (!data?.url) return;
    const a = document.createElement('a');
    a.href = data.url;
    a.download = displayName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="rounded-lg border border-border/60 bg-card/40 overflow-hidden flex flex-col">
      <div className="aspect-video bg-muted/30 flex items-center justify-center overflow-hidden">
        {!objectPath && (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <ImageOff className="h-6 w-6" />
            <span className="text-[10px]">No file attached</span>
          </div>
        )}

        {objectPath && isFetching && (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        )}

        {objectPath && !isFetching && isError && (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <ImageOff className="h-6 w-6" />
            <span className="text-[10px]">Failed to load</span>
          </div>
        )}

        {objectPath && !isFetching && !isError && data && isTiffMime(mime) && (
          <div className="flex flex-col items-center gap-1 text-muted-foreground">
            <FileIcon className="h-6 w-6" />
            <span className="text-[10px]">TIFF — download to view</span>
          </div>
        )}

        {objectPath && !isFetching && !isError && data && !isTiffMime(mime) && isImageMime(mime) && (
          <img src={data.url} alt={displayName} className="h-full w-full object-cover" />
        )}

        {objectPath && !isFetching && !isError && data && isVideoMime(mime) && (
          <video src={data.url} controls className="h-full w-full object-cover" />
        )}

        {objectPath && !isFetching && !isError && data && isPdfMime(mime) && (
          <FileText className="h-10 w-10 text-muted-foreground" />
        )}

        {objectPath &&
          !isFetching &&
          !isError &&
          data &&
          !isTiffMime(mime) &&
          !isImageMime(mime) &&
          !isVideoMime(mime) &&
          !isPdfMime(mime) && <FileIcon className="h-10 w-10 text-muted-foreground" />}
      </div>

      <div className="p-3 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium text-foreground truncate" title={displayName}>
            {displayName}
          </p>
          <span
            className="text-[9px] font-mono text-muted-foreground shrink-0"
            title="Evidence number"
          >
            {item.evidenceNumber}
          </span>
        </div>

        {item.description && (
          <p className="text-[11px] text-muted-foreground line-clamp-2">{item.description}</p>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {item.evidenceType}
          </span>
          <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold border ${
              VERIFICATION_STYLES[item.verificationStatus] ?? 'bg-muted/50 text-muted-foreground'
            }`}
          >
            {item.verificationStatus}
          </span>
          <span
            className="inline-flex items-center gap-0.5 text-[9px] text-muted-foreground ml-auto"
            title={`Chain of custody: ${item.chainOfCustodyStatus}`}
          >
            <CustodyIcon className="h-3 w-3" />
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-6 text-[10px] gap-1 w-full"
          disabled={!data?.url}
          onClick={handleDownload}
        >
          <Download className="h-3 w-3" />
          Download
        </Button>
      </div>
    </div>
  );
}

export function EvidenceTab({ initialEvidence }: EvidenceTabProps) {
  const items = initialEvidence ?? [];

  if (items.length === 0) {
    return (
      <div className="p-8 bg-muted/20 text-sm text-muted-foreground text-center rounded-lg border border-border/50">
        No evidence recorded for this incident yet.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <EvidencePreview key={item.id} item={item} />
      ))}
    </div>
  );
}