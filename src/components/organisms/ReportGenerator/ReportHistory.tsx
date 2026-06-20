import { Download, FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/atoms/Badge';
import { Typography } from '@/components/atoms/Typography';
import { Icon } from '@/components/atoms/Icon';

export interface ReportLog {
  id: string;
  title: string;
  type: string;
  status: 'draft' | 'generating' | 'ready' | 'archived';
  createdAt: string;
  size?: string;
  format: 'pdf' | 'csv' | 'xlsx' | 'json';
}

export interface ReportHistoryProps {
  reports: ReportLog[];
  onDownload: (id: string) => void;
  onDelete?: (id: string) => void;
}

const STATUS_BADGES = {
  draft: 'secondary',
  generating: 'warning',
  ready: 'success',
  archived: 'muted',
} as const;

export function ReportHistory({ reports, onDownload, onDelete }: ReportHistoryProps) {
  return (
    <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Typography variant="body-sm" color="muted">
            No previously compiled reports found.
          </Typography>
        </div>
      ) : (
        reports.map((report) => (
          <div
            key={report.id}
            className="flex items-center justify-between gap-3 p-3 rounded-md border border-border bg-card/45 hover:bg-card transition-colors"
          >
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="flex size-7 items-center justify-center rounded-lg bg-muted text-muted-foreground mt-0.5">
                <Icon icon={FileText} size="xs" />
              </div>
              <div className="min-w-0">
                <span className="text-body-sm font-semibold text-foreground truncate max-w-[200px] block" title={report.title}>
                  {report.title}
                </span>
                <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[10px] text-muted-foreground">
                  <span className="capitalize">{report.type.replace('-', ' ')}</span>
                  <span>•</span>
                  <span className="font-data">{report.createdAt}</span>
                  {report.size && (
                    <>
                      <span>•</span>
                      <span className="font-data uppercase">{report.size} ({report.format})</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Badge variant={STATUS_BADGES[report.status]} size="sm">
                {report.status}
              </Badge>
              {report.status === 'ready' && (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onDownload(report.id)}
                  aria-label={`Download ${report.title}`}
                >
                  <Icon icon={Download} size="xs" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => onDelete(report.id)}
                  className="text-danger hover:bg-danger/10 hover:text-danger"
                  aria-label={`Delete ${report.title}`}
                >
                  <Icon icon={Trash2} size="xs" />
                </Button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
