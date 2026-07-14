import * as React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface DataTableToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  /** Additional filter controls rendered to the right of the search input */
  children?: React.ReactNode;
  /** Extra action buttons (e.g. New, Export) rendered on the far right */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * DataTableToolbar — Generic search bar + filter slots for any table.
 *
 * Renders:
 *  [Search Input] [children: filter dropdowns] [...actions: buttons]
 *
 * The clear button appears automatically when searchValue is non-empty.
 * The minimum-char hint is displayed below the input (2 chars required).
 */
export function DataTableToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  children,
  actions,
  className,
}: DataTableToolbarProps) {
  return (
    <div
      className={cn(
        'bg-card/60 border border-border/60 rounded-xl p-3 flex flex-wrap items-center gap-2.5 backdrop-blur-sm',
        className
      )}
    >
      {/* Search */}
      <div className="relative flex-1 min-w-44">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-8 pl-8 pr-7 text-xs bg-background/60"
          aria-label="Search table"
        />
        {searchValue && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Filter slots */}
      {children}

      {/* Action buttons */}
      {actions && <div className="flex items-center gap-2 ml-auto">{actions}</div>}
    </div>
  );
}
