import { type ReactNode } from 'react';
import { DashboardLayout } from '@/components/templates/DashboardLayout';
import { cn } from '@/lib/utils';

/**
 * ReportLayout Template
 *
 * Layout optimized for report viewing with a wider content area
 * and print-friendly structure.
 */

interface ReportLayoutProps {
  children: ReactNode;
  title?: string;
  actions?: ReactNode;
  className?: string;
}

export function ReportLayout({
  children,
  title = 'Reports',
  actions,
  className,
}: ReportLayoutProps) {
  return (
    <DashboardLayout title={title} className="p-0 lg:p-0">
      {actions && (
        <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3 lg:px-6">
          <div />
          <div className="flex items-center gap-2">{actions}</div>
        </div>
      )}
      <div
        className={cn(
          'mx-auto w-full max-w-5xl flex-1 overflow-y-auto p-4 lg:p-8',
          className,
        )}
      >
        {children}
      </div>
    </DashboardLayout>
  );
}
