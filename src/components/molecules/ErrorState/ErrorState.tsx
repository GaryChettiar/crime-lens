import * as React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Typography } from '@/components/atoms/Typography';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/atoms/Icon';

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  message: string;
  onRetry?: () => void;
  title?: string;
}

export function ErrorState({
  message,
  onRetry,
  title = 'System Error',
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-6 rounded-lg border border-danger/20 bg-danger/5 min-h-[200px]",
        className
      )}
      role="alert"
      {...props}
    >
      <div className="flex size-10 items-center justify-center rounded-full bg-danger/10 mb-3 text-danger">
        <Icon icon={AlertCircle} size="sm" />
      </div>
      <Typography variant="heading-md" as="h3" className="font-semibold text-danger">
        {title}
      </Typography>
      <Typography variant="body-sm" color="muted" className="mt-1.5 max-w-sm text-center">
        {message}
      </Typography>
      {onRetry && (
        <Button variant="destructive" size="sm" onClick={onRetry} className="mt-4 gap-1.5">
          <Icon icon={RotateCcw} size="xs" />
          Retry Connection
        </Button>
      )}
    </div>
  );
}
