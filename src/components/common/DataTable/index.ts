/**
 * DataTable component family — Generic, reusable table primitives.
 *
 * Used by Crimes, Criminals, FIRs, Officers, Stations, Districts, Evidence, etc.
 * None of these components know about any specific domain.
 */
export { DataTable } from './DataTable';
export { DataTablePagination } from './DataTablePagination';
export { DataTableToolbar } from './DataTableToolbar';
export { DataTableSkeleton } from './DataTableSkeleton';
export { DataTableEmpty } from './DataTableEmpty';
export { DataTableError } from './DataTableError';
export type { DataTableColumn } from './DataTable';
