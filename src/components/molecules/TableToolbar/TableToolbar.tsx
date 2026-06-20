import * as React from 'react';
import { Search, SlidersHorizontal, Download, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/atoms/Badge';
import { Icon } from '@/components/atoms/Icon';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface ActiveFilter {
  id: string;
  label: string;
  value: string;
}

export interface TableToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  showFilters?: boolean;
  onToggleFilters?: () => void;
  activeFilters?: ActiveFilter[];
  onRemoveFilter?: (id: string) => void;
  onClearAllFilters?: () => void;
  onExport?: (format: 'pdf' | 'csv' | 'xlsx') => void;
}

export function TableToolbar({
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Search records...',
  showFilters = false,
  onToggleFilters,
  activeFilters = [],
  onRemoveFilter,
  onClearAllFilters,
  onExport,
  className,
  ...props
}: TableToolbarProps) {
  return (
    <div className={cn("flex flex-col gap-3 w-full bg-card/50 p-3 rounded-t-lg border-b border-border", className)} {...props}>
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm flex items-center">
          <Icon icon={Search} size="sm" className="absolute left-3 text-muted-foreground pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9 bg-card h-8"
            aria-label="Search crime records"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          {onToggleFilters && (
            <Button
              variant={showFilters ? "secondary" : "outline"}
              size="sm"
              onClick={onToggleFilters}
              aria-expanded={showFilters}
              className="h-8 gap-1.5"
            >
              <Icon icon={SlidersHorizontal} size="sm" />
              {showFilters ? 'Hide Filters' : 'Filters'}
              {activeFilters.length > 0 && (
                <Badge variant="default" size="sm" className="ml-1 px-1.5 py-0 h-4">
                  {activeFilters.length}
                </Badge>
              )}
            </Button>
          )}

          {onExport && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1.5">
                  <Icon icon={Download} size="sm" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem onClick={() => onExport('csv')}>Export CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport('pdf')}>Export PDF</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport('xlsx')}>Export Excel</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Active Filter Badges */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-border/40">
          <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mr-1 select-none">
            Active:
          </span>
          {activeFilters.map((filter) => (
            <Badge
              key={filter.id}
              variant="secondary"
              size="sm"
              className="pl-2 pr-1 gap-1 text-[11px] h-5 rounded-md border border-border"
            >
              <span>{filter.label}:</span>
              <span className="text-foreground font-semibold">{filter.value}</span>
              <button
                onClick={() => onRemoveFilter?.(filter.id)}
                className="hover:bg-muted text-muted-foreground hover:text-foreground rounded-full p-0.5 transition-colors"
                aria-label={`Remove filter ${filter.label}`}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="xs"
            onClick={onClearAllFilters}
            className="text-[10px] font-semibold text-primary hover:text-primary/80 h-5 px-1.5"
          >
            Clear All
          </Button>
        </div>
      )}
    </div>
  );
}
