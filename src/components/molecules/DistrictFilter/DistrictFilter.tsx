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
  { value: 'Bagalkot', label: 'Bagalkot' },
  { value: 'Bangalore', label: 'Bangalore' },
  { value: 'BangaloreRural', label: 'Bangalore Rural' },
  { value: 'Belgaum', label: 'Belgaum' },
  { value: 'Bellary', label: 'Bellary' },
  { value: 'Bidar', label: 'Bidar' },
  { value: 'Bijapur', label: 'Bijapur' },
  { value: 'Chamrajnagar', label: 'Chamrajnagar' },
  { value: 'Chikballapura', label: 'Chikballapura' },
  { value: 'Chikmagalur', label: 'Chikmagalur' },
  { value: 'Chitradurga', label: 'Chitradurga' },
  { value: 'DakshinaKannada', label: 'Dakshina Kannada' },
  { value: 'Davanagere', label: 'Davanagere' },
  { value: 'Dharwad', label: 'Dharwad' },
  { value: 'Gadag', label: 'Gadag' },
  { value: 'Gulbarga', label: 'Gulbarga' },
  { value: 'Hassan', label: 'Hassan' },
  { value: 'Haveri', label: 'Haveri' },
  { value: 'Kodagu', label: 'Kodagu' },
  { value: 'Kolar', label: 'Kolar' },
  { value: 'Koppal', label: 'Koppal' },
  { value: 'Mandya', label: 'Mandya' },
  { value: 'Mysore', label: 'Mysore' },
  { value: 'Raichur', label: 'Raichur' },
  { value: 'Ramanagara', label: 'Ramanagara' },
  { value: 'Shimoga', label: 'Shimoga' },
  { value: 'Tumkur', label: 'Tumkur' },
  { value: 'Udupi', label: 'Udupi' },
  { value: 'UttaraKannada', label: 'Uttara Kannada' },
  { value: 'Yadgir', label: 'Yadgir' },
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
