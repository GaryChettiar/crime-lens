import { type ReactNode } from 'react';
import { DashboardLayout } from '@/components/templates/DashboardLayout';
import { cn } from '@/lib/utils';

/**
 * AnalyticsLayout Template
 *
 * Extended dashboard layout with a filter bar section and chart grid.
 */

interface AnalyticsLayoutProps {
  children: ReactNode;
  title?: string;
  filterBar?: ReactNode;
  className?: string;
}

export function AnalyticsLayout({
  children,
  title = 'Analytics',
  filterBar,
  className,
}: AnalyticsLayoutProps) {
  return (
    <DashboardLayout title={title} className="p-0 lg:p-0">
      {filterBar && (
        <div className="border-b border-border bg-card px-4 py-3 lg:px-6">
          {filterBar}
        </div>
      )}
      <div className={cn('flex-1 overflow-y-auto p-4 lg:p-6', className)}>
        {children}
      </div>
    </DashboardLayout>
  );
}
