"use client";

import * as React from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/atoms/Badge";
import { EmptyState } from "@/components/atoms/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TableToolbar,
  type ActiveFilter,
} from "@/components/molecules/TableToolbar";
import { PaginationControls } from "@/components/molecules/PaginationControls";
import { ErrorState } from "@/components/molecules/ErrorState";
import { cn } from "@/lib/utils";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/atoms/Icon";
import { Typography } from "@/components/atoms/Typography";

export interface CrimeIncident {
  id: string;
  caseNumber: string;
  type: string;
  location: string;
  timestamp: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "investigating" | "resolved" | "closed";
  description: string;
}

export interface CrimeDataTableProps extends React.HTMLAttributes<HTMLDivElement> {
  data?: CrimeIncident[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  totalRecords?: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  activeFilters?: ActiveFilter[];
  onRemoveFilter?: (id: string) => void;
  onClearAllFilters?: () => void;
  onExport?: (format: "pdf" | "csv" | "xlsx") => void;
  onRowClick?: (incident: CrimeIncident) => void;
  onToggleFilters?: () => void;
  showFilters?: boolean;
}

const columnHelper = createColumnHelper<CrimeIncident>();

export function CrimeDataTable({
  data = [],
  isLoading = false,
  error = null,
  onRetry,
  totalRecords = 0,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  searchQuery = "",
  onSearchChange,
  activeFilters = [],
  onRemoveFilter,
  onClearAllFilters,
  onExport,
  onRowClick,
  onToggleFilters,
  showFilters = false,
  className,
  ...props
}: CrimeDataTableProps) {
  // Define columns for TanStack Table
  const columns = React.useMemo(
    () => [
      columnHelper.accessor("caseNumber", {
        header: "Case #",
        cell: (info) => (
          <span className="font-semibold text-foreground font-data">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("type", {
        header: "Incident Type",
        cell: (info) => <span className="capitalize">{info.getValue()}</span>,
      }),
      columnHelper.accessor("description", {
        header: "Description",
        cell: (info) => (
          <span
            className="truncate max-w-[200px] block"
            title={info.getValue()}
          >
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("location", {
        header: "Location / Area",
        cell: (info) => (
          <span className="truncate max-w-[150px] block">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("timestamp", {
        header: "Date & Time",
        cell: (info) => <span className="font-data">{info.getValue()}</span>,
      }),
      columnHelper.accessor("severity", {
        header: "Severity",
        cell: (info) => {
          const val = info.getValue();
          const variantMap = {
            low: "risk-low",
            medium: "risk-medium",
            high: "risk-high",
            critical: "risk-critical",
          } as const;
          return (
            <Badge variant={variantMap[val] || "default"} size="sm">
              {val}
            </Badge>
          );
        },
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => {
          const val = info.getValue();
          const variantMap = {
            open: "danger",
            investigating: "warning",
            resolved: "success",
            closed: "muted",
          } as const;
          return (
            <Badge variant={variantMap[val] || "secondary"} size="sm" dot>
              {val}
            </Badge>
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: (info) => (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={(e) => {
              e.stopPropagation();
              onRowClick?.(info.row.original);
            }}
            aria-label="View Incident Details"
          >
            <Icon icon={Eye} size="xs" />
          </Button>
        ),
      }),
    ],
    [onRowClick],
  );

  // TanStack Table Instance
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div
      className={cn(
        "flex flex-col w-full border border-border rounded-lg bg-card/25 shadow-xs",
        className,
      )}
      {...props}
    >
      {/* Toolbar */}
      <div className="pt-4 pl-4">
        <Typography
          variant="heading-md"
          className="font-semibold text-foreground"
        >
          Incident Logs
        </Typography>
        <Typography variant="body-sm" color="muted">
          Detailed breakdown of active, investigating, and resolved emergency
          cases.
        </Typography>
      </div>
      <TableToolbar
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        activeFilters={activeFilters}
        onRemoveFilter={onRemoveFilter}
        onClearAllFilters={onClearAllFilters}
        onExport={onExport}
        onToggleFilters={onToggleFilters}
        showFilters={false}
      />

      {/* Main Grid Viewport */}
      <div className="relative overflow-x-auto w-full">
        {error ? (
          <div className="p-8">
            <ErrorState message={error} onRetry={onRetry} />
          </div>
        ) : isLoading ? (
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-8 gap-4 border-b pb-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="grid grid-cols-8 gap-4 py-2">
                {Array.from({ length: 8 }).map((_, j) => (
                  <Skeleton key={j} className="h-4 w-full opacity-80" />
                ))}
              </div>
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No Incidents Logged"
              description="No crime records found matching the specified query or filters."
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="font-semibold text-xs text-muted-foreground uppercase tracking-wider h-8"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => onRowClick?.(row.original)}
                  className="cursor-pointer hover:bg-muted/40 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2.5">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {!error && !isLoading && data.length > 0 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          totalRecords={totalRecords}
        />
      )}
    </div>
  );
}
