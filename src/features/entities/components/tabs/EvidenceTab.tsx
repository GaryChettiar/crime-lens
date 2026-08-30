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

  const mime = item.fileMimeType || data?.contentType;
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

        {objectPath && !isFetching && !isError && data && isImageMime(mime) && (
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