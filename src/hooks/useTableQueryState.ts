import * as React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTableState } from './useTableState';
import type { SortOrder, TableQueryState } from '@/types/pagination';

const DEBOUNCE_MS = 500;
const MIN_SEARCH_CHARS = 2;

/**
 * useTableQueryState — URL-synced, debounced wrapper around useTableState.
 *
 * What it does:
 *  1. On mount: reads URL params (page, search, sortBy, sortOrder) → initializes Redux
 *  2. On state change: writes page/sortBy/sortOrder to URL (search written after debounce)
 *  3. Debounces search input: 500ms, minimum 2 chars (empty string clears immediately)
 *  4. Returns raw searchInput (for the input element) + debouncedSearch (for the query)
 *
 * Global filters (district, station, category, dates) are NOT synced to URL here —
 * they live in Redux only, applied separately by the query builder.
 *
 * Usage:
 *   const { page, pageSize, sortBy, sortOrder, searchInput, setSearchInput,
 *           debouncedSearch, setPage, setSort, setPageSize } = useTableQueryState('crimes');
 */
export function useTableQueryState(tableId: string) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tableState = useTableState(tableId);
  const initialized = React.useRef(false);

  // --- Raw search input (component state, not Redux) ---
  const [searchInput, setSearchInputRaw] = React.useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = React.useState<string>('');
  const debounceTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---------------------------------------------------------------------------
  // On mount: initialize from URL params
  // ---------------------------------------------------------------------------
  React.useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const urlPage = parseInt(searchParams.get('page') ?? '1', 10);
    const urlSearch = searchParams.get('search') ?? '';
    const urlSortBy = searchParams.get('sortBy') ?? '';
    const urlSortOrder = (searchParams.get('sortOrder') ?? '') as SortOrder | '';

    const initialState: Partial<TableQueryState> = {};
    if (!isNaN(urlPage) && urlPage > 0) initialState.page = urlPage;
    if (urlSortBy) initialState.sortBy = urlSortBy;
    if (urlSortOrder === 'ASC' || urlSortOrder === 'DESC') {
      initialState.sortOrder = urlSortOrder;
    }

    if (Object.keys(initialState).length > 0) {
      tableState.init(initialState);
    }

    if (urlSearch) {
      setSearchInputRaw(urlSearch);
      setDebouncedSearch(urlSearch);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // Sync Redux state → URL whenever it changes (after init)
  // ---------------------------------------------------------------------------
  React.useEffect(() => {
    if (!initialized.current) return;

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);

        if (tableState.page > 1) {
          next.set('page', String(tableState.page));
        } else {
          next.delete('page');
        }

        if (tableState.sortBy) {
          next.set('sortBy', tableState.sortBy);
        } else {
          next.delete('sortBy');
        }

        if (tableState.sortOrder && tableState.sortOrder !== 'DESC') {
          next.set('sortOrder', tableState.sortOrder);
        } else {
          next.delete('sortOrder');
        }

        return next;
      },
      { replace: true }
    );
  }, [tableState.page, tableState.sortBy, tableState.sortOrder, setSearchParams]);

  // ---------------------------------------------------------------------------
  // Debounced search
  // ---------------------------------------------------------------------------
  const setSearchInput = React.useCallback(
    (value: string) => {
      setSearchInputRaw(value);

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      // Empty string clears immediately (no debounce)
      if (value === '') {
        setDebouncedSearch('');
        tableState.resetPage();
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.delete('search');
          return next;
        }, { replace: true });
        return;
      }

      // Below minimum chars: don't fire yet
      if (value.length < MIN_SEARCH_CHARS) {
        return;
      }

      // Debounce
      debounceTimer.current = setTimeout(() => {
        setDebouncedSearch(value);
        tableState.resetPage();
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          next.set('search', value);
          next.delete('page'); // reset to page 1
          return next;
        }, { replace: true });
      }, DEBOUNCE_MS);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tableState.resetPage, setSearchParams]
  );

  // Cleanup debounce on unmount
  React.useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  return {
    // Table state (from Redux)
    page: tableState.page,
    pageSize: tableState.pageSize,
    sortBy: tableState.sortBy,
    sortOrder: tableState.sortOrder,
    // Search (component state)
    searchInput,
    debouncedSearch,
    // Actions
    setPage: tableState.setPage,
    setPageSize: tableState.setPageSize,
    setSort: tableState.setSort,
    resetPage: tableState.resetPage,
    reset: tableState.reset,
    setSearchInput,
  };
}
