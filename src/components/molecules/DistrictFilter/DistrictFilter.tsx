import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface DistrictFilterProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  onValueChange?: (value: string) => void;
  label?: string;
}

const DISTRICTS = [
  { value: 'all', label: 'All Districts' },
  { value: 'downtown', label: 'Downtown (Sector 1)' },
  { value: 'northern', label: 'Northern (Sector 2)' },
  { value: 'southern', label: 'Southern (Sector 3)' },
  { value: 'eastern', label: 'Eastern (Sector 4)' },
  { value: 'western', label: 'Western (Sector 5)' },
];

export function DistrictFilter({
  value = 'all',
  onValueChange,
  label = 'District / Sector',
  className,
  ...props
}: DistrictFilterProps) {
  return (
    <div className={cn("flex flex-col gap-1.5 w-full", className)} {...props}>
      {label && (
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
      )}
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full bg-card h-8" aria-label="District Filter">
          <SelectValue placeholder="Select District" />
        </SelectTrigger>
        <SelectContent>
          {DISTRICTS.map((district) => (
            <SelectItem key={district.value} value={district.value}>
              {district.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
