import * as React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export interface SeverityFilterProps extends React.HTMLAttributes<HTMLDivElement> {
  selectedSeverities?: string[];
  onSeverityToggle?: (severity: string) => void;
  label?: string;
}

const SEVERITIES = [
  { id: 'low', label: 'Low', color: 'border-l-success' },
  { id: 'medium', label: 'Medium', color: 'border-l-warning' },
  { id: 'high', label: 'High', color: 'border-l-risk-high' },
  { id: 'critical', label: 'Critical', color: 'border-l-danger' },
];

export function SeverityFilter({
  selectedSeverities = [],
  onSeverityToggle,
  label = 'Severity Levels',
  className,
  ...props
}: SeverityFilterProps) {
  return (
    <div className={cn("flex flex-col gap-1.5 w-full", className)} {...props}>
      {label && (
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
      )}
      <div className="flex flex-col gap-2 bg-card p-2 rounded-md border border-border">
        {SEVERITIES.map((sev) => {
          const isChecked = selectedSeverities.includes(sev.id);
          const checkboxId = `severity-${sev.id}`;

          return (
            <div
              key={sev.id}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded-sm border-l-2 hover:bg-muted/50 transition-colors",
                sev.color
              )}
            >
              <Checkbox
                id={checkboxId}
                checked={isChecked}
                onCheckedChange={() => onSeverityToggle?.(sev.id)}
                aria-label={`Filter by ${sev.label} severity`}
              />
              <label
                htmlFor={checkboxId}
                className="text-body-sm font-medium text-foreground cursor-pointer select-none w-full"
              >
                {sev.label}
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}
