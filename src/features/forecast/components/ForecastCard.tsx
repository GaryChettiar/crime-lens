import * as React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface ForecastCardData {
  label: string;
  value: string | number;
  change?: number; // percent change
  unit?: string;
  confidence?: number; // 0-100
  district?: string;
}

interface ForecastCardProps {
  data: ForecastCardData;
  className?: string;
}

/**
 * ForecastCard — Generic metric card for forecast data.
 * Architecture note: accepts `data` prop which will be replaced by live API data
 * when the forecast engine is integrated.
 */
export function ForecastCard({ data, className = '' }: ForecastCardProps) {
  const trend = data.change != null
    ? data.change > 0 ? 'up' : data.change < 0 ? 'down' : 'flat'
    : null;

  const formattedValue = typeof data.value === 'number'
    ? data.value.toLocaleString()
    : data.value;

  return (
    <div className={`bg-card/60 border border-border/60 rounded-xl p-4 backdrop-blur-sm ${className}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{data.label}</p>
          <p className="text-2xl font-bold text-foreground font-data mt-1 leading-none">
            {formattedValue}
            {data.unit && <span className="text-sm font-normal text-muted-foreground ml-1">{data.unit}</span>}
          </p>
          {data.district && (
            <p className="text-[10px] text-muted-foreground/70 mt-0.5">{data.district}</p>
          )}
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-xs font-semibold shrink-0 ${
              trend === 'up'
                ? 'text-destructive'
                : trend === 'down'
                  ? 'text-success'
                  : 'text-muted-foreground'
            }`}
          >
            {trend === 'up' ? (
              <TrendingUp className="h-4 w-4" />
            ) : trend === 'down' ? (
              <TrendingDown className="h-4 w-4" />
            ) : (
              <Minus className="h-4 w-4" />
            )}
            {data.change != null && `${Math.abs(data.change)}%`}
          </div>
        )}
      </div>
      {data.confidence != null && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground">Confidence</span>
            <span className="text-[10px] font-semibold text-foreground font-data">
              {data.confidence}%
            </span>
          </div>
          <div className="h-1 bg-muted/40 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                data.confidence >= 80
                  ? 'bg-success'
                  : data.confidence >= 60
                    ? 'bg-warning'
                    : 'bg-destructive'
              }`}
              style={{ width: `${data.confidence}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
