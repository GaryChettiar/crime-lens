import * as React from 'react';
import { DateRangeFilter } from '@/components/molecules/DateRangeFilter';
import { DistrictFilter } from '@/components/molecules/DistrictFilter';
import { CrimeTypeFilter } from '@/components/molecules/CrimeTypeFilter';
import { SeverityFilter } from '@/components/molecules/SeverityFilter';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Typography } from '@/components/atoms/Typography';

export interface FilterPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  startDate?: string;
  endDate?: string;
  district?: string;
  crimeType?: string;
  selectedSeverities?: string[];
  onStartDateChange?: (date: string) => void;
  onEndDateChange?: (date: string) => void;
  onDistrictChange?: (district: string) => void;
  onCrimeTypeChange?: (type: string) => void;
  onSeverityToggle?: (severity: string) => void;
  onReset?: () => void;
  onApply?: () => void;
}

export function FilterPanel({
  startDate,
  endDate,
  district,
  crimeType,
  selectedSeverities,
  onStartDateChange,
  onEndDateChange,
  onDistrictChange,
  onCrimeTypeChange,
  onSeverityToggle,
  onReset,
  onApply,
  className,
  ...props
}: FilterPanelProps) {
  return (
    <div
      className={cn(
        "flex flex-col h-full bg-card border border-border rounded-lg shadow-sm p-4 w-full max-w-sm gap-4",
        className
      )}
      {...props}
    >
      <div className="flex justify-between items-center">
        <Typography variant="heading-sm" className="font-semibold text-foreground">
          Incident Filters
        </Typography>
        {onReset && (
          <Button
            variant="ghost"
            size="xs"
            onClick={onReset}
            className="text-xs text-primary hover:text-primary/80 px-1.5 h-6"
          >
            Reset All
          </Button>
        )}
      </div>

      <Separator />

      <div className="flex flex-col gap-4 overflow-y-auto flex-1 pr-1">
        {/* District/Sector */}
        <DistrictFilter value={district} onValueChange={onDistrictChange} />

        {/* Crime Type */}
        <CrimeTypeFilter value={crimeType} onValueChange={onCrimeTypeChange} />

        {/* Date Range */}
        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={onStartDateChange}
          onEndDateChange={onEndDateChange}
        />

        {/* Severity levels */}
        <SeverityFilter
          selectedSeverities={selectedSeverities}
          onSeverityToggle={onSeverityToggle}
        />
      </div>

      {onApply && (
        <div className="pt-2 border-t border-border mt-auto flex flex-col gap-2">
          <Button onClick={onApply} size="sm" className="w-full">
            Apply Filters
          </Button>
        </div>
      )}
    </div>
  );
}
