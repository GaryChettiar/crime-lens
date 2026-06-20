import * as React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NotificationItem } from '@/components/molecules/NotificationItem';
import { Button } from '@/components/ui/button';
import { Typography } from '@/components/atoms/Typography';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Bell, Eye } from 'lucide-react';
import { Icon } from '@/components/atoms/Icon';

export interface AlertData {
  id: string;
  type: 'crime-spike' | 'threshold-breach' | 'pattern-detected' | 'system';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  read: boolean;
}

export interface AlertCenterProps extends React.HTMLAttributes<HTMLDivElement> {
  alerts: AlertData[];
  onMarkRead?: (id: string) => void;
  onMarkAllRead?: () => void;
  onViewDetails?: (id: string) => void;
  title?: string;
}

export function AlertCenter({
  alerts,
  onMarkRead,
  onMarkAllRead,
  onViewDetails,
  title = "Real-Time Alerts",
  className,
  ...props
}: AlertCenterProps) {
  const [filter, setFilter] = React.useState<'all' | 'unread' | 'critical'>('all');

  const filteredAlerts = React.useMemo(() => {
    switch (filter) {
      case 'unread':
        return alerts.filter((a) => !a.read);
      case 'critical':
        return alerts.filter((a) => a.severity === 'critical');
      case 'all':
      default:
        return alerts;
    }
  }, [alerts, filter]);

  const unreadCount = alerts.filter((a) => !a.read).length;

  const groupedAlerts = React.useMemo(() => {
    const critical = filteredAlerts.filter((a) => a.severity === 'critical');
    const warning = filteredAlerts.filter((a) => a.severity === 'high' || a.severity === 'medium');
    const info = filteredAlerts.filter((a) => a.severity === 'low');
    return { critical, warning, info };
  }, [filteredAlerts]);

  const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>({
    critical: true,
    warning: true,
    info: true,
  });

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
    }));
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-card border border-border rounded-lg shadow-sm w-full max-w-md",
        className
      )}
      {...props}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center gap-2">
          <Icon icon={Bell} size="sm" className="text-primary animate-pulse" />
          <Typography variant="heading-sm" className="font-semibold text-foreground">
            {title}
          </Typography>
          {unreadCount > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-danger-foreground font-data">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && onMarkAllRead && (
          <Button
            variant="ghost"
            size="xs"
            onClick={onMarkAllRead}
            className="text-xs text-primary hover:text-primary/80 h-6 px-1.5 gap-1"
          >
            <Icon icon={Eye} size="xs" />
            Mark All Read
          </Button>
        )}
      </div>

      <Separator />

      {/* Tabs */}
      <div className="flex gap-1.5 p-2 bg-muted/30">
        {(['all', 'unread', 'critical'] as const).map((t) => (
          <Button
            key={t}
            variant={filter === t ? 'secondary' : 'ghost'}
            size="xs"
            onClick={() => setFilter(t)}
            className="capitalize h-6 text-xs flex-1"
          >
            {t}
            {t === 'unread' && unreadCount > 0 && ` (${unreadCount})`}
          </Button>
        ))}
      </div>

      <Separator />

      {/* Alert List */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="flex flex-col gap-4 p-3">
          {filteredAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Typography variant="body-sm" color="muted">
                No alerts found.
              </Typography>
            </div>
          ) : (
            <>
              {/* Critical Section */}
              {groupedAlerts.critical.length > 0 && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => toggleGroup('critical')}
                    className="flex items-center justify-between w-full text-left font-bold text-xs uppercase tracking-wider text-danger hover:text-danger/80 px-1 select-none cursor-pointer"
                  >
                    <span>Critical Alerts ({groupedAlerts.critical.length})</span>
                    <span className="text-[10px] font-semibold text-muted-foreground">{expandedGroups.critical ? 'Collapse ▲' : 'Expand ▼'}</span>
                  </button>
                  {expandedGroups.critical && (
                    <div className="flex flex-col gap-2 pl-0.5">
                      {groupedAlerts.critical.map((alert) => (
                        <NotificationItem
                          key={alert.id}
                          id={alert.id}
                          type={alert.type}
                          title={alert.title}
                          message={alert.message}
                          severity={alert.severity}
                          timestamp={alert.timestamp}
                          read={alert.read}
                          onMarkRead={onMarkRead}
                          onViewDetails={onViewDetails}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Warning Section */}
              {groupedAlerts.warning.length > 0 && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => toggleGroup('warning')}
                    className="flex items-center justify-between w-full text-left font-bold text-xs uppercase tracking-wider text-warning hover:text-warning/80 px-1 select-none cursor-pointer"
                  >
                    <span>Warning Alerts ({groupedAlerts.warning.length})</span>
                    <span className="text-[10px] font-semibold text-muted-foreground">{expandedGroups.warning ? 'Collapse ▲' : 'Expand ▼'}</span>
                  </button>
                  {expandedGroups.warning && (
                    <div className="flex flex-col gap-2 pl-0.5">
                      {groupedAlerts.warning.map((alert) => (
                        <NotificationItem
                          key={alert.id}
                          id={alert.id}
                          type={alert.type}
                          title={alert.title}
                          message={alert.message}
                          severity={alert.severity}
                          timestamp={alert.timestamp}
                          read={alert.read}
                          onMarkRead={onMarkRead}
                          onViewDetails={onViewDetails}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Info Section */}
              {groupedAlerts.info.length > 0 && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => toggleGroup('info')}
                    className="flex items-center justify-between w-full text-left font-bold text-xs uppercase tracking-wider text-info hover:text-info/80 px-1 select-none cursor-pointer"
                  >
                    <span>Info Alerts ({groupedAlerts.info.length})</span>
                    <span className="text-[10px] font-semibold text-muted-foreground">{expandedGroups.info ? 'Collapse ▲' : 'Expand ▼'}</span>
                  </button>
                  {expandedGroups.info && (
                    <div className="flex flex-col gap-2 pl-0.5">
                      {groupedAlerts.info.map((alert) => (
                        <NotificationItem
                          key={alert.id}
                          id={alert.id}
                          type={alert.type}
                          title={alert.title}
                          message={alert.message}
                          severity={alert.severity}
                          timestamp={alert.timestamp}
                          read={alert.read}
                          onMarkRead={onMarkRead}
                          onViewDetails={onViewDetails}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
