import { cn } from '@/lib/utils';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * ErrorState — Shown when an API request fails.
 * Displays error message with a retry button.
 */
export function ErrorState({
  title = 'Failed to load data',
  message = 'An error occurred while fetching data. Please try again.',
  onRetry,
  className,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      <div className="h-14 w-14 rounded-2xl flex items-center justify-center bg-danger/10 mb-4">
        <AlertTriangle className="h-7 w-7 text-danger" />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-sm mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="admin-btn admin-btn-secondary text-xs"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </button>
      )}
    </div>
  );
}
