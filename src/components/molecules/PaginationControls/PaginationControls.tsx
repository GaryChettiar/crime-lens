import * as React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/atoms/Icon';
import { Typography } from '@/components/atoms/Typography';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface PaginationControlsProps extends React.HTMLAttributes<HTMLDivElement> {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  totalRecords?: number;
}

export function PaginationControls({
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  totalRecords,
  className,
  ...props
}: PaginationControlsProps) {
  const isFirst = currentPage === 1;
  const isLast = currentPage === totalPages || totalPages === 0;

  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalRecords || 0);

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-between gap-4 p-3 bg-card/50 rounded-b-lg border-t border-border w-full text-xs",
        className
      )}
      {...props}
    >
      {/* Record info */}
      <div className="text-muted-foreground order-2 sm:order-1 font-data">
        {totalRecords !== undefined ? (
          <span>
            Showing <strong className="text-foreground">{startRecord}</strong> to{' '}
            <strong className="text-foreground">{endRecord}</strong> of{' '}
            <strong className="text-foreground">{totalRecords}</strong> records
          </span>
        ) : (
          <span>Page {currentPage} of {totalPages}</span>
        )}
      </div>

      <div className="flex items-center gap-6 order-1 sm:order-2 w-full sm:w-auto justify-between sm:justify-end">
        {/* Page size select */}
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground whitespace-nowrap hidden sm:inline">Rows per page:</span>
          <Select
            value={String(pageSize)}
            onValueChange={(val) => onPageSizeChange(Number(val))}
          >
            <SelectTrigger className="w-16 h-7 bg-card" aria-label="Page Size Select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50, 100].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Navigator buttons */}
        <div className="flex items-center gap-1.5">
          <Typography variant="caption" color="muted" className="mr-2 font-data">
            Page {currentPage} of {totalPages || 1}
          </Typography>
          
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(1)}
            disabled={isFirst}
            aria-label="First Page"
          >
            <Icon icon={ChevronsLeft} size="xs" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={isFirst}
            aria-label="Previous Page"
          >
            <Icon icon={ChevronLeft} size="xs" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={isLast}
            aria-label="Next Page"
          >
            <Icon icon={ChevronRight} size="xs" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(totalPages)}
            disabled={isLast}
            aria-label="Last Page"
          >
            <Icon icon={ChevronsRight} size="xs" />
          </Button>
        </div>
      </div>
    </div>
  );
}
