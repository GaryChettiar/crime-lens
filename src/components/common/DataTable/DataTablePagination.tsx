import * as React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { PaginationMeta } from '@/types/pagination';

interface DataTablePaginationProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

const DEFAULT_PAGE_SIZES = [10, 20, 50, 100];
const MAX_PAGE_PILLS = 5;

/**
 * DataTablePagination — Full-featured pagination bar for any paginated table.
 *
 * Features:
 *  - Showing X–Y of N records
 *  - Page number pills with ellipsis
 *  - Jump to page input (Enter or blur to navigate)
 *  - Rows per page selector
 *  - First / Prev / Next / Last buttons
 *  - Mobile: pills + jump input hidden, Prev/Next always visible
 *
 * Generic — not tied to Crimes or any specific module.
 */
export function DataTablePagination({
  pagination,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
  className,
}: DataTablePaginationProps) {
  const { page, pageSize, totalRecords, totalPages, hasNext, hasPrevious } = pagination;
  const [jumpValue, setJumpValue] = React.useState('');

  const startRecord = totalRecords === 0 ? 0 : (page - 1) * pageSize + 1;
  const endRecord = Math.min(page * pageSize, totalRecords);

  // ---------------------------------------------------------------------------
  // Page pills
  // ---------------------------------------------------------------------------
  const pagePills = React.useMemo((): Array<number | '…'> => {
    if (totalPages <= MAX_PAGE_PILLS) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const half = Math.floor(MAX_PAGE_PILLS / 2);
    let start = Math.max(1, page - half);
    let end = Math.min(totalPages, start + MAX_PAGE_PILLS - 1);

    if (end - start < MAX_PAGE_PILLS - 1) {
      start = Math.max(1, end - MAX_PAGE_PILLS + 1);
    }

    const pills: Array<number | '…'> = [];
    if (start > 1) {
      pills.push(1);
      if (start > 2) pills.push('…');
    }
    for (let i = start; i <= end; i++) pills.push(i);
    if (end < totalPages) {
      if (end < totalPages - 1) pills.push('…');
      pills.push(totalPages);
    }
    return pills;
  }, [page, totalPages]);

  // ---------------------------------------------------------------------------
  // Jump to page
  // ---------------------------------------------------------------------------
  const handleJump = () => {
    const n = parseInt(jumpValue, 10);
    if (!isNaN(n) && n >= 1 && n <= totalPages && n !== page) {
      onPageChange(n);
    }
    setJumpValue('');
  };

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3',
        'bg-muted/10 border-t border-border/50 text-xs select-none',
        className
      )}
    >
      {/* ---- Left: record info ---- */}
      <div className="text-muted-foreground order-2 sm:order-1 font-data whitespace-nowrap">
        {totalRecords > 0 ? (
          <span>
            Showing{' '}
            <strong className="text-foreground">{startRecord.toLocaleString()}</strong>
            {' '}–{' '}
            <strong className="text-foreground">{endRecord.toLocaleString()}</strong>
            {' '}of{' '}
            <strong className="text-foreground">{totalRecords.toLocaleString()}</strong>
          </span>
        ) : (
          <span>No records</span>
        )}
      </div>

      {/* ---- Right: controls ---- */}
      <div className="flex items-center gap-4 order-1 sm:order-2 flex-wrap justify-end">

        {/* Rows per page */}
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground hidden md:inline whitespace-nowrap">Rows per page</span>
          <Select
            value={String(pageSize)}
            onValueChange={(val) => onPageSizeChange(Number(val))}
          >
            <SelectTrigger className="w-16 h-7 bg-card text-xs" aria-label="Rows per page">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)} className="text-xs">
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Page pills — hidden on mobile */}
        <div className="hidden sm:flex items-center gap-1">
          {pagePills.map((pill, idx) =>
            pill === '…' ? (
              <span key={`ellipsis-${idx}`} className="px-1.5 text-muted-foreground">
                …
              </span>
            ) : (
              <Button
                key={pill}
                variant={pill === page ? 'default' : 'outline'}
                size="icon-sm"
                onClick={() => onPageChange(pill as number)}
                className={cn(
                  'h-7 w-7 text-xs',
                  pill === page && 'pointer-events-none'
                )}
                aria-label={`Page ${pill}`}
                aria-current={pill === page ? 'page' : undefined}
              >
                {pill}
              </Button>
            )
          )}
        </div>

        {/* Jump to page — hidden on mobile */}
        <div className="hidden md:flex items-center gap-2">
          <span className="text-muted-foreground whitespace-nowrap">Go to</span>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={jumpValue}
            onChange={(e) => setJumpValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJump()}
            onBlur={handleJump}
            placeholder={String(page)}
            className={cn(
              'w-14 h-7 px-2 rounded-md border border-border bg-background/60 text-xs text-center',
              'focus:outline-none focus:ring-1 focus:ring-primary/50',
              '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
            )}
            aria-label="Jump to page"
          />
        </div>

        {/* Prev / Next buttons — always visible */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(1)}
            disabled={!hasPrevious}
            aria-label="First page"
            className="h-7 w-7 hidden sm:inline-flex"
          >
            <ChevronsLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(page - 1)}
            disabled={!hasPrevious}
            aria-label="Previous page"
            className="h-7 w-7"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>

          {/* Mobile: page X of Y label */}
          <span className="sm:hidden text-muted-foreground px-2 whitespace-nowrap">
            {page} / {totalPages || 1}
          </span>

          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(page + 1)}
            disabled={!hasNext}
            aria-label="Next page"
            className="h-7 w-7"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(totalPages)}
            disabled={!hasNext}
            aria-label="Last page"
            className="h-7 w-7 hidden sm:inline-flex"
          >
            <ChevronsRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
