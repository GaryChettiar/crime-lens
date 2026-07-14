import * as React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SortOrder } from '@/types/pagination';
import { DataTableSkeleton } from './DataTableSkeleton';
import { DataTableEmpty } from './DataTableEmpty';
import { DataTableError } from './DataTableError';
import type { LucideIcon } from 'lucide-react';

// ---------------------------------------------------------------------------
// Column definition
// ---------------------------------------------------------------------------

/**
 * Column descriptor for DataTable.
 *
 * @template T - The data row type
 */
export interface DataTableColumn<T> {
  /** Unique column identifier */
  key: string;
  /** Column header label */
  header: string;
  /** Render the cell content for a given row */
  cell: (row: T) => React.ReactNode;
  /** If provided, column header becomes clickable for sorting */
  sortKey?: string;
  /** Column-level class overrides */
  headerClassName?: string;
  cellClassName?: string;
}

// ---------------------------------------------------------------------------
// DataTable props
// ---------------------------------------------------------------------------

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  /** True on first fetch with no cached data */
  isLoading?: boolean;
  /** True when refetching (cache hit, but data may be stale) — shows inline skeleton */
  isFetching?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  /** Current sort column key */
  sortBy?: string;
  /** Current sort direction */
  sortOrder?: SortOrder;
  /** Called when a sortable column header is clicked */
  onSort?: (sortKey: string, newOrder: SortOrder) => void;
  /** Unique key extractor for rows (defaults to (row as any).id) */
  rowKey?: (row: T) => string;
  /** Row click handler (used to navigate to detail page) */
  onRowClick?: (row: T) => void;
  /** Empty state customization */
  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  emptyDescription?: string;
  /** Error state customization */
  errorTitle?: string;
  errorMessage?: string;
  className?: string;
}

// ---------------------------------------------------------------------------
// DataTable
// ---------------------------------------------------------------------------

/**
 * DataTable — Generic, reusable server-side data table.
 *
 * Does NOT know about Crimes, Criminals, FIRs, or any domain.
 * The caller supplies `columns` (with cell renderers) and `data` rows.
 *
 * Rendering hierarchy:
 *  - isLoading → full TableSkeleton (no table chrome yet)
 *  - isError   → DataTableError row (inside table structure)
 *  - data.length === 0 && !isFetching → DataTableEmpty row
 *  - isFetching → DataTableSkeleton rows (inline, table chrome stays)
 *  - otherwise → data rows
 *
 * Compatible with future TanStack Virtual — rows are plain <tr> elements.
 */
export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  isFetching = false,
  isError = false,
  onRetry,
  sortBy,
  sortOrder,
  onSort,
  rowKey,
  onRowClick,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  errorTitle,
  errorMessage,
  className,
}: DataTableProps<T>) {
  const colCount = columns.length;

  const getKey = (row: T, idx: number): string => {
    if (rowKey) return rowKey(row);
    const anyRow = row as any;
    return anyRow.id ?? anyRow.ROWID ?? String(idx);
  };

  const handleHeaderClick = (col: DataTableColumn<T>) => {
    if (!col.sortKey || !onSort) return;
    const newOrder: SortOrder =
      sortBy === col.sortKey && sortOrder === 'ASC' ? 'DESC' : 'ASC';
    onSort(col.sortKey, newOrder);
  };

  // Full-page skeleton (first load, no cache)
  if (isLoading) {
    return (
      <div className={cn('bg-card/40 border border-border/60 rounded-xl overflow-hidden backdrop-blur-sm', className)}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/50 bg-muted/20 text-left">
                {columns.map((col) => (
                  <th key={col.key} className={cn('px-4 py-3 font-semibold text-muted-foreground', col.headerClassName)}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <DataTableSkeleton columns={colCount} rows={8} />
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('bg-card/40 border border-border/60 rounded-xl overflow-hidden backdrop-blur-sm', className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          {/* Header */}
          <thead>
            <tr className="border-b border-border/50 bg-muted/20 text-left">
              {columns.map((col) => {
                const isSorted = sortBy === col.sortKey;
                const isSortable = !!col.sortKey && !!onSort;
                return (
                  <th
                    key={col.key}
                    className={cn(
                      'px-4 py-3 font-semibold text-muted-foreground',
                      isSortable && 'cursor-pointer select-none hover:text-foreground transition-colors',
                      col.headerClassName
                    )}
                    onClick={() => handleHeaderClick(col)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.header}
                      {isSortable && isSorted && (
                        sortOrder === 'ASC'
                          ? <ChevronUp className="h-3 w-3 text-primary" />
                          : <ChevronDown className="h-3 w-3 text-primary" />
                      )}
                      {isSortable && !isSorted && (
                        <span className="h-3 w-3 opacity-0 group-hover:opacity-30">
                          <ChevronDown className="h-3 w-3" />
                        </span>
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Body */}
          {isError ? (
            <DataTableError
              title={errorTitle}
              message={errorMessage}
              onRetry={onRetry}
              colSpan={colCount}
            />
          ) : isFetching ? (
            // Inline skeleton on page change (keeps table chrome, avoids layout shift)
            <DataTableSkeleton columns={colCount} rows={8} />
          ) : data.length === 0 ? (
            <DataTableEmpty
              icon={emptyIcon}
              title={emptyTitle}
              description={emptyDescription}
              colSpan={colCount}
            />
          ) : (
            <tbody>
              {data.map((row, idx) => (
                <tr
                  key={getKey(row, idx)}
                  className={cn(
                    'border-b border-border/40 hover:bg-muted/10 transition-colors',
                    onRowClick && 'cursor-pointer'
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn('px-4 py-3', col.cellClassName)}
                      onClick={col.key === '__actions__' ? (e) => e.stopPropagation() : undefined}
                    >
                      {col.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>
    </div>
  );
}
