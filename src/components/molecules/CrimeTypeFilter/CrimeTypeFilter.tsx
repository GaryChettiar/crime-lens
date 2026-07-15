import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useGetCrimeCategoriesQuery } from '@/services/crimeCategoryApi';


export interface CrimeTypeFilterProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  onValueChange?: (value: string) => void;
  label?: string;
}


export function CrimeTypeFilter({
  value = 'all',
  onValueChange,
  label = 'Incident Type',
  className,
  ...props
}: CrimeTypeFilterProps) {
  const { data: categories = [], isLoading } = useGetCrimeCategoriesQuery();

  return (
    <div className={cn("flex flex-col gap-1.5 w-full", className)} {...props}>
      {label && (
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
      )}
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full bg-card h-8" aria-label="Crime Type Filter">
          <SelectValue placeholder={isLoading ? "Loading..." : "Select Crime Type"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((type) => (
            <SelectItem key={type.ROWID} value={String(type.ROWID)}>
              {type.crime_category_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
