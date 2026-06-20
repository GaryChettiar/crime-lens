import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface CrimeTypeFilterProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  onValueChange?: (value: string) => void;
  label?: string;
}

const CRIME_TYPES = [
  { value: 'all', label: 'All Categories' },
  { value: 'theft', label: 'Theft / Larceny' },
  { value: 'burglary', label: 'Burglary' },
  { value: 'assault', label: 'Assault' },
  { value: 'narcotics', label: 'Narcotics' },
  { value: 'cyber', label: 'Cyber Crime' },
  { value: 'homicide', label: 'Homicide' },
];

export function CrimeTypeFilter({
  value = 'all',
  onValueChange,
  label = 'Incident Type',
  className,
  ...props
}: CrimeTypeFilterProps) {
  return (
    <div className={cn("flex flex-col gap-1.5 w-full", className)} {...props}>
      {label && (
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
      )}
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full bg-card h-8" aria-label="Crime Type Filter">
          <SelectValue placeholder="Select Crime Type" />
        </SelectTrigger>
        <SelectContent>
          {CRIME_TYPES.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
