import * as React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Typography } from '@/components/atoms/Typography';
import { Icon } from '@/components/atoms/Icon';

export interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  sparklineData?: number[];
  isLoading?: boolean;
  status?: 'success' | 'warning' | 'danger' | 'info';
}

export function MetricCard({
  label,
  value,
  change,
  changeLabel,
  sparklineData = [30, 45, 35, 50, 40, 60, 55, 70],
  isLoading = false,
  status,
  className,
  ...props
}: MetricCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isZero = change !== undefined && change === 0;

  // Generate SVG path for sparkline
  const generateSparklinePath = (data: number[]) => {
    if (data.length === 0) return '';
    const width = 120;
    const height = 30;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min === 0 ? 1 : max - min;

    const points = data.map((val, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return `M ${points.join(' L ')}`;
  };

  const sparklinePath = generateSparklinePath(sparklineData);

  return (
    <div
      className={cn(
        "flex flex-col justify-between p-4 rounded-lg border bg-card text-card-foreground shadow-xs relative overflow-hidden transition-all duration-200 hover:border-muted-foreground/30",
        status === 'danger' && "border-l-4 border-l-danger",
        status === 'warning' && "border-l-4 border-l-warning",
        status === 'success' && "border-l-4 border-l-success",
        className
      )}
      {...props}
    >
      {isLoading ? (
        <div className="space-y-3 animate-pulse">
          <div className="h-3 bg-muted rounded-md w-1/3" />
          <div className="h-8 bg-muted rounded-md w-2/3" />
          <div className="h-3 bg-muted rounded-md w-1/2" />
        </div>
      ) : (
        <>
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-1">
              <Typography variant="caption" color="muted" className="font-semibold uppercase tracking-wider">
                {label}
              </Typography>
              <Typography variant="display-md" tabular className="font-bold tracking-tight text-foreground mt-1">
                {value}
              </Typography>
            </div>

            {/* Sparkline Visualization */}
            {sparklineData.length > 0 && (
              <div className="h-8 w-28 shrink-0 flex items-center justify-center opacity-85 mt-2" aria-hidden="true">
                <svg width="120" height="30" className="overflow-visible">
                  <path
                    d={sparklinePath}
                    fill="none"
                    stroke="var(--color-primary, hsl(213, 70%, 50%))"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 mt-3 text-xs">
            {change !== undefined && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 font-semibold font-data rounded-sm px-1 py-0.5",
                  isZero
                    ? "text-muted-foreground bg-muted"
                    : isPositive
                    ? "text-success bg-success/10"
                    : "text-danger bg-danger/10"
                )}
              >
                <Icon
                  icon={isZero ? Minus : isPositive ? TrendingUp : TrendingDown}
                  size="xs"
                />
                {isPositive ? '+' : ''}
                {change}%
              </span>
            )}
            {changeLabel && (
              <span className="text-muted-foreground truncate">{changeLabel}</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
