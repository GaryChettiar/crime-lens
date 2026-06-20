import { type ReactNode } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/atoms/Icon';
import type { ComponentBaseProps } from '@/types/component-states';

/**
 * StatCard Molecule
 *
 * Dashboard metric card displaying a value, label, trend indicator,
 * and optional icon. Supports loading, empty, and error states.
 *
 * @example
 * <StatCard
 *   label="Total Crimes"
 *   value="2,847"
 *   change={12.5}
 *   changeLabel="vs last month"
 *   icon={<Icon icon={Shield} size="lg" />}
 * />
 */

interface StatCardProps extends ComponentBaseProps {
  /** Metric label */
  label: string;
  /** Metric value (formatted string) */
  value?: string | number;
  /** Percentage change (positive = up, negative = down) */
  change?: number;
  /** Label for the change context */
  changeLabel?: string;
  /** Optional icon element */
  icon?: ReactNode;
  /** Loading state */
  isLoading?: boolean;
  /** Error state */
  error?: string | null;
  /** Callback for error retry */
  onRetry?: () => void;
}

export function StatCard({
  label,
  value,
  change,
  changeLabel = 'vs last period',
  icon,
  isLoading = false,
  error = null,
  onRetry,
  className,
  id,
  testId,
}: StatCardProps) {
  // Error state
  if (error) {
    return (
      <div
        id={id}
        data-testid={testId}
        className={cn(
          'rounded-lg border border-border bg-card p-4',
          className,
        )}
        role="alert"
      >
        <div className="flex items-center gap-2 text-danger">
          <Icon icon={AlertCircle} size="sm" />
          <span className="text-body-sm font-medium">Failed to load</span>
        </div>
        <p className="mt-1 text-caption text-muted-foreground">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-caption font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div
        id={id}
        data-testid={testId}
        className={cn(
          'rounded-lg border border-border bg-card p-4',
          className,
        )}
        aria-busy="true"
        aria-label={`Loading ${label}`}
      >
        <div className="flex items-center justify-between">
          <div className="h-3 w-20 animate-skeleton rounded bg-muted" />
          <div className="h-8 w-8 animate-skeleton rounded bg-muted" />
        </div>
        <div className="mt-3 h-7 w-24 animate-skeleton rounded bg-muted" />
        <div className="mt-2 h-3 w-32 animate-skeleton rounded bg-muted" />
      </div>
    );
  }

  // Empty state
  if (value === undefined || value === null || value === '') {
    return (
      <div
        id={id}
        data-testid={testId}
        className={cn(
          'rounded-lg border border-border bg-card p-4',
          className,
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-caption font-medium text-muted-foreground uppercase tracking-wider">
            {label}
          </span>
          {icon && (
            <div className="text-muted-foreground">{icon}</div>
          )}
        </div>
        <p className="mt-3 text-body-sm text-muted-foreground">
          No data available
        </p>
      </div>
    );
  }

  // Determine trend direction
  const trendIcon =
    change !== undefined
      ? change > 0
        ? TrendingUp
        : change < 0
          ? TrendingDown
          : Minus
      : null;

  const trendColor =
    change !== undefined
      ? change > 0
        ? 'text-danger' // Crime going up = bad
        : change < 0
          ? 'text-success' // Crime going down = good
          : 'text-muted-foreground'
      : '';

  return (
    <div
      id={id}
      data-testid={testId}
      className={cn(
        'rounded-lg border border-border bg-card p-4 transition-colors',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-caption font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        {icon && (
          <div className="text-muted-foreground">{icon}</div>
        )}
      </div>

      <div className="mt-2">
        <span className="text-heading-xl font-data">{value}</span>
      </div>

      {change !== undefined && (
        <div className={cn('mt-1 flex items-center gap-1', trendColor)}>
          {trendIcon && <Icon icon={trendIcon} size="xs" />}
          <span className="text-caption font-medium font-data">
            {change > 0 ? '+' : ''}
            {change.toFixed(1)}%
          </span>
          <span className="text-caption text-muted-foreground">
            {changeLabel}
          </span>
        </div>
      )}
    </div>
  );
}
