import * as React from 'react';
import { HelpCircle, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Typography } from '@/components/atoms/Typography';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/atoms/Icon';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: LucideIcon;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon = HelpCircle,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 rounded-lg border border-dashed border-border bg-card/30 min-h-[240px]",
        className
      )}
      {...props}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-muted/60 mb-4 text-muted-foreground">
        <Icon icon={icon} size="md" />
      </div>
      <Typography variant="heading-md" as="h3" className="font-semibold text-foreground">
        {title}
      </Typography>
      {description && (
        <Typography variant="body-sm" color="muted" className="mt-1.5 max-w-sm">
          {description}
        </Typography>
      )}
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction} className="mt-4">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
