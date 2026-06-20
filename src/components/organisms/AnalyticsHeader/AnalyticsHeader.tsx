import * as React from 'react';
import { RefreshCw, FilePlus2, Share2, SlidersHorizontal, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Typography } from '@/components/atoms/Typography';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/atoms/Icon';
import { Badge } from '@/components/atoms/Badge';

export interface AnalyticsHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  onGenerateReport?: () => void;
  isRefreshing?: boolean;
  activeFiltersCount?: number;
  onOpenFilters?: () => void;
  onOpenAlerts?: () => void;
  unreadAlertsCount?: number;
}

export function AnalyticsHeader({
  title,
  subtitle,
  onRefresh,
  onGenerateReport,
  isRefreshing = false,
  activeFiltersCount = 0,
  onOpenFilters,
  onOpenAlerts,
  unreadAlertsCount = 0,
  className,
  ...props
}: AnalyticsHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-border w-full",
        className
      )}
      {...props}
    >
      <div>
        <div className="flex items-center gap-3">
          <Typography variant="heading-xl" as="h1" className="font-bold text-foreground">
            {title}
          </Typography>
          {activeFiltersCount > 0 && (
            <Badge variant="default" size="sm" className="font-medium">
              {activeFiltersCount} active filter{activeFiltersCount > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        {subtitle && (
          <Typography variant="body-sm" color="muted" className="mt-1">
            {subtitle}
          </Typography>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {onOpenFilters && (
          <Button
            variant={activeFiltersCount > 0 ? "secondary" : "outline"}
            size="sm"
            onClick={onOpenFilters}
            className="h-8 gap-1.5"
            aria-label="Open Filters Drawer"
          >
            <Icon icon={SlidersHorizontal} size="xs" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold font-data px-1">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        )}

        {onOpenAlerts && (
          <Button
            variant={unreadAlertsCount > 0 ? "secondary" : "outline"}
            size="sm"
            onClick={onOpenAlerts}
            className="h-8 gap-1.5 relative"
            aria-label="Open Alerts Drawer"
          >
            <Icon icon={Bell} size="xs" className={cn(unreadAlertsCount > 0 && "animate-pulse")} />
            <span>Alerts</span>
            {unreadAlertsCount > 0 && (
              <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-danger text-danger-foreground text-[10px] font-bold font-data px-1">
                {unreadAlertsCount}
              </span>
            )}
          </Button>
        )}

        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-8 gap-1.5"
            aria-label="Refresh data"
          >
            <Icon
              icon={RefreshCw}
              size="xs"
              className={cn(isRefreshing && "animate-spin")}
            />
            Sync
          </Button>
        )}
        
        <Button variant="outline" size="sm" className="h-8 gap-1.5">
          <Icon icon={Share2} size="xs" />
          Share
        </Button>

        {onGenerateReport && (
          <Button onClick={onGenerateReport} size="sm" className="h-8 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
            <Icon icon={FilePlus2} size="xs" />
            Generate Report
          </Button>
        )}
      </div>
    </div>
  );
}
