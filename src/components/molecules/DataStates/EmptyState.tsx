import { cn } from '@/lib/utils';
import { Inbox } from 'lucide-react';
import type { ElementType, ReactNode } from 'react';

/**
 * EmptyState — Shown when a query returns zero results.
 * Configurable icon, title, description, and optional action button.
 */
export function EmptyState({
  icon: Icon = Inbox,
  title = 'No data found',
  description = 'There are no records to display.',
  action,
  className,
}: {
  icon?: ElementType;
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      <div className="h-14 w-14 rounded-2xl flex items-center justify-center bg-muted/60 mb-4">
        <Icon className="h-7 w-7 text-muted-foreground/60" />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-xs mb-4">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
