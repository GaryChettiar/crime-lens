import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DataTableErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  colSpan?: number;
}

/**
 * DataTableError — Error state with retry button rendered as a table row.
 * Drop inside <tbody> to keep valid HTML table structure.
 */
export function DataTableError({
  title = 'Failed to Load Data',
  message = 'Could not connect to the server. Please try again.',
  onRetry,
  colSpan = 8,
}: DataTableErrorProps) {
  return (
    <tbody>
      <tr>
        <td colSpan={colSpan} className="py-16 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-destructive/70" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-xs mx-auto">{message}</p>
            </div>
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="h-7 text-xs gap-1.5 mt-1"
              >
                <RefreshCw className="h-3 w-3" />
                Retry
              </Button>
            )}
          </div>
        </td>
      </tr>
    </tbody>
  );
}
