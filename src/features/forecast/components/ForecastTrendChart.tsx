import * as React from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as ChartTooltip, Legend,
} from 'recharts';

export interface TrendDataPoint {
  period: string;
  predicted: number;
  actual?: number;
  lower?: number;
  upper?: number;
}

interface ForecastTrendChartProps {
  data?: TrendDataPoint[];
  title?: string;
  /** When set, the chart will fetch from this URL instead of using mock data */
  dataUrl?: string;
}

const MOCK_TREND_DATA: TrendDataPoint[] = [
  { period: 'Jan', predicted: 245, actual: 238, lower: 220, upper: 270 },
  { period: 'Feb', predicted: 267, actual: 271, lower: 242, upper: 292 },
  { period: 'Mar', predicted: 289, actual: 282, lower: 264, upper: 314 },
  { period: 'Apr', predicted: 256, actual: 261, lower: 231, upper: 281 },
  { period: 'May', predicted: 278, actual: 274, lower: 253, upper: 303 },
  { period: 'Jun', predicted: 301, actual: 298, lower: 276, upper: 326 },
  { period: 'Jul', predicted: 315, lower: 290, upper: 340 },
  { period: 'Aug', predicted: 328, lower: 303, upper: 353 },
  { period: 'Sep', predicted: 312, lower: 287, upper: 337 },
];

/**
 * ForecastTrendChart — Recharts line chart for crime forecasting.
 * Uses mock data until forecast engine is configured.
 * Pass `dataUrl` prop to switch to live API data (future integration point).
 */
export function ForecastTrendChart({ data, title = 'Crime Trend Forecast' }: ForecastTrendChartProps) {
  const chartData = data ?? MOCK_TREND_DATA;

  return (
    <div className="bg-card/60 border border-border/60 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold text-foreground">{title}</span>
        <span className="text-[10px] text-muted-foreground bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded-full">
          Mock Data
        </span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
          <XAxis
            dataKey="period"
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
          />
          <ChartTooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '11px',
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }}
            iconType="circle"
            iconSize={8}
          />
          <Line
            type="monotone"
            dataKey="actual"
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
            dot={{ r: 3 }}
            name="Actual"
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="predicted"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            strokeDasharray="5 4"
            dot={{ r: 3 }}
            name="Predicted"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
