import * as React from 'react';
import { ShieldAlert, AlertCircle, Info, Flame, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Typography } from '@/components/atoms/Typography';
import { Icon } from '@/components/atoms/Icon';

export interface NotificationItemProps extends React.HTMLAttributes<HTMLDivElement> {
  id: string;
  type: 'crime-spike' | 'threshold-breach' | 'pattern-detected' | 'system';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  read: boolean;
  onMarkRead?: (id: string) => void;
  onViewDetails?: (id: string) => void;
}

const SEVERITY_COLORS = {
  low: 'text-success bg-success/5 border-success/20',
  medium: 'text-warning bg-warning/5 border-warning/20',
  high: 'text-risk-high bg-risk-high/5 border-risk-high/20',
  critical: 'text-danger bg-danger/5 border-danger/20',
};

const TYPE_ICONS = {
  'crime-spike': Flame,
  'threshold-breach': ShieldAlert,
  'pattern-detected': AlertCircle,
  system: Info,
};

export function NotificationItem({
  id,
  type,
  title,
  message,
  severity,
  timestamp,
  read,
  onMarkRead,
  onViewDetails,
  className,
  ...props
}: NotificationItemProps) {
  const IconComponent = TYPE_ICONS[type] || Info;
  const colorClasses = SEVERITY_COLORS[severity] || SEVERITY_COLORS.low;

  return (
    <div
      className={cn(
        "flex gap-3 p-3 rounded-md border text-left transition-colors relative group",
        read ? "bg-card/40 border-border" : "bg-card border-l-4 border-l-primary shadow-xs",
        className
      )}
      {...props}
    >
      {/* Visual Indicator Icon */}
      <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg border", colorClasses)}>
        <Icon icon={IconComponent} size="sm" />
      </div>

      {/* Text Content */}
      <div className="flex-1 min-w-0 pr-6">
        <div className="flex items-center justify-between gap-2">
          <Typography variant="body-sm" className="font-semibold text-foreground truncate">
            {title}
          </Typography>
          <span className="text-[10px] text-muted-foreground whitespace-nowrap font-data">
            {timestamp}
          </span>
        </div>
        <Typography variant="caption" color="muted" className="mt-0.5 line-clamp-2">
          {message}
        </Typography>
      </div>

      {/* Unread dot / Actions */}
      <div className="absolute right-3 top-3 flex items-center gap-1.5">
        {!read && (
          <span
            className="size-2 rounded-full bg-primary"
            aria-label="Unread alert"
            title="Mark as Read"
            onClick={() => onMarkRead?.(id)}
          />
        )}
        {onViewDetails && (
          <button
            onClick={() => onViewDetails(id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded-sm hover:bg-muted text-muted-foreground hover:text-foreground"
            aria-label="View Details"
          >
            <Icon icon={Eye} size="xs" />
          </button>
        )}
      </div>
    </div>
  );
}
