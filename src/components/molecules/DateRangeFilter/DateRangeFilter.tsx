import * as React from 'react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { cn } from '@/lib/utils';

export interface DateRangeFilterProps extends React.HTMLAttributes<HTMLDivElement> {
  startDate?: string;
  endDate?: string;
  onStartDateChange?: (date: string) => void;
  onEndDateChange?: (date: string) => void;
  label?: string;
}

export function DateRangeFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  label = 'Date Range',
  className,
  ...props
}: DateRangeFilterProps) {
  return (
    <div className={cn("flex flex-col gap-1.5 w-full", className)} {...props}>
      {label && (
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
      )}
      <DateRangePicker
        value={{ start: startDate || null, end: endDate || null }}
        onChange={(range) => {
          onStartDateChange?.(range.start || '');
          onEndDateChange?.(range.end || '');
        }}
        className="w-full"
      />
    </div>
  );
}
