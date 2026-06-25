import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useGetDistrictsQuery } from '@/services/districtsApi';

export interface DistrictFilterProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  onValueChange?: (value: string) => void;
  label?: string;
}

export function DistrictFilter({
  value = 'all',
  onValueChange,
  label = 'District / Sector',
  className,
  ...props
}: DistrictFilterProps) {
  const { data: districts } = useGetDistrictsQuery();

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
          <SelectItem value="all">All Districts</SelectItem>
          {districts?.map((district) => (
            <SelectItem key={district.id} value={district.name}>
              {district.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
