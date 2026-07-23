import type { CrimeQuery, TableQueryState, SortOrder } from '@/types/pagination';
import type { GlobalFiltersState } from '@/store/slices/globalFiltersSlice';
import { CRIME_SORT_FIELDS } from '@/types/pagination';

export interface CrimeLocationScope {
  districtId?: string | null;
  stationId?: string | null;
}

/**
 * buildCrimeQuery — Maps table state + global filters → CrimeQuery for RTK Query.
 *
 * Centralizes the mapping logic so the page component stays thin.
 * Whitelists sortBy values before sending to the backend.
 *
 * @param tableState  - Current table pagination/sort state from Redux
 * @param globalFilters - Global filter state from Redux
 * @param search      - Debounced search string (from component state, not Redux)
 * @param locationScope - Optional district/station IDs from analytics context
 */
export function buildCrimeQuery(
  tableState: TableQueryState,
  globalFilters: GlobalFiltersState,
  search: string,
  locationScope?: CrimeLocationScope,
): CrimeQuery {
  // Validate sortBy against backend whitelist to prevent 400 errors
  const safeSortBy = CRIME_SORT_FIELDS.includes(tableState.sortBy as any)
    ? tableState.sortBy
    : 'crime_occured_date_time';

  const query: CrimeQuery = {
    page: tableState.page,
    pageSize: tableState.pageSize,
    sortBy: safeSortBy,
    sortOrder: tableState.sortOrder as SortOrder,
  };

  // Search — only include if non-empty
  if (search && search.trim()) {
    query.search = search.trim();
  }

  // Location scope from analytics context (IDs) takes precedence over Redux filters
  if (locationScope?.districtId) {
    query.districtId = locationScope.districtId;
  } else if (globalFilters.district) {
    query.districtId = globalFilters.district;
  }

  if (locationScope?.stationId) {
    query.stationId = locationScope.stationId;
  } else if (globalFilters.policeStation) {
    query.stationId = globalFilters.policeStation;
  }

  // Global filter: crime category (AnalyticsHeader uses crimeTypes; legacy uses crimeCategory)
  const categoryId =
    globalFilters.crimeCategory || globalFilters.crimeTypes[0] || null;
  if (categoryId) {
    query.categoryId = categoryId;
  }

  // Global filter: status
  if (globalFilters.status) {
    query.status = globalFilters.status;
  }

  // Global filter: date range
  if (globalFilters.dateRange.start) {
    query.from = globalFilters.dateRange.start;
  }
  if (globalFilters.dateRange.end) {
    query.to = globalFilters.dateRange.end;
  }

  // Global filter: single date (overrides range)
  if (globalFilters.singleDate) {
    query.date = globalFilters.singleDate;
    delete query.from;
    delete query.to;
  }

  return query;
}

/**
 * haveCrimeFiltersChanged — Compares two GlobalFiltersState snapshots.
 * Use this to guard against dispatching a page reset when nothing relevant changed.
 */
export function haveCrimeFiltersChanged(
  prev: GlobalFiltersState | null,
  next: GlobalFiltersState
): boolean {
  if (!prev) return true;
  return (
    prev.district !== next.district ||
    prev.policeStation !== next.policeStation ||
    prev.crimeCategory !== next.crimeCategory ||
    (prev.crimeTypes[0] ?? null) !== (next.crimeTypes[0] ?? null) ||
    prev.status !== next.status ||
    prev.singleDate !== next.singleDate ||
    prev.dateRange.start !== next.dateRange.start ||
    prev.dateRange.end !== next.dateRange.end
  );
}
