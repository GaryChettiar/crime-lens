/**
 * CrimeLens — Generic Pagination Types
 *
 * These types are shared across all paginated API endpoints and table modules.
 * Every module (Crimes, Criminals, FIRs, Officers, etc.) uses these same interfaces.
 */

// ---------------------------------------------------------------------------
// Sorting
// ---------------------------------------------------------------------------

/** Global sort order type — used by all table modules, not crime-specific. */
export type SortOrder = 'ASC' | 'DESC';

// ---------------------------------------------------------------------------
// Pagination metadata
// ---------------------------------------------------------------------------

/** Pagination metadata returned by the backend in every paginated response. */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/** Generic paginated API response envelope. */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// ---------------------------------------------------------------------------
// Query types
// ---------------------------------------------------------------------------

/**
 * Base query interface for all paginated API calls.
 * Extend this for each module's specific filters.
 */
export interface QueryBase {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: SortOrder;
}

/**
 * Crime-specific query params extending the generic base.
 * Maps to the backend's GET /crimes query string parameters.
 */
export interface CrimeQuery extends QueryBase {
  districtId?: string;
  stationId?: string;
  categoryId?: string;
  status?: string;
  date?: string;    // YYYY-MM-DD exact date
  from?: string;    // YYYY-MM-DD range start
  to?: string;      // YYYY-MM-DD range end
}

// ---------------------------------------------------------------------------
// Backend sort field whitelist
// ---------------------------------------------------------------------------

/**
 * Sort fields accepted by the backend crime endpoint.
 * The backend rejects any value not in this set.
 */
export const CRIME_SORT_FIELDS = [
  'crime_occured_date_time',
  'createdtime',
  'crime_number',
  'status',
] as const;

export type CrimeSortField = typeof CRIME_SORT_FIELDS[number];

// ---------------------------------------------------------------------------
// Table state (Redux)
// ---------------------------------------------------------------------------

/**
 * Per-table query state stored in Redux.
 * Search is NOT stored here — it lives in component state as a raw input
 * and only the debounced value is used to build the query.
 */
export interface TableQueryState {
  page: number;
  pageSize: number;
  sortBy: string;
  sortOrder: SortOrder;
}

export const DEFAULT_TABLE_STATE: TableQueryState = {
  page: 1,
  pageSize: 20,
  sortBy: 'crime_occured_date_time',
  sortOrder: 'DESC',
};
