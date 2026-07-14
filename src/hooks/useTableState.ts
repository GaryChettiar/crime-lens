import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setTablePage,
  setTablePageSize,
  setTableSort,
  resetTablePage,
  resetTableState,
  initTableState,
} from '@/store/slices/tablesSlice';
import type { TableQueryState, SortOrder } from '@/types/pagination';

const DEFAULT_STATE: TableQueryState = {
  page: 1,
  pageSize: 20,
  sortBy: 'crime_occured_date_time',
  sortOrder: 'DESC',
};

/**
 * useTableState — Generic hook for accessing and mutating per-table Redux state.
 *
 * Usage:
 *   const { page, pageSize, sortBy, sortOrder, setPage, setSort } = useTableState('crimes');
 *   const { page, pageSize } = useTableState('criminals');
 *
 * Returns stable, memoized action dispatchers so they can be used
 * as useEffect/useCallback dependencies without causing infinite loops.
 */
export function useTableState(tableId: string) {
  const dispatch = useAppDispatch();

  const tableState: TableQueryState = useAppSelector(
    (s) => s.tables[tableId] ?? DEFAULT_STATE
  );

  const setPage = useCallback(
    (page: number) => dispatch(setTablePage({ tableId, page })),
    [dispatch, tableId]
  );

  const setPageSize = useCallback(
    (pageSize: number) => dispatch(setTablePageSize({ tableId, pageSize })),
    [dispatch, tableId]
  );

  const setSort = useCallback(
    (sortBy: string, sortOrder: SortOrder) =>
      dispatch(setTableSort({ tableId, sortBy, sortOrder })),
    [dispatch, tableId]
  );

  const resetPage = useCallback(
    () => dispatch(resetTablePage({ tableId })),
    [dispatch, tableId]
  );

  const reset = useCallback(
    () => dispatch(resetTableState({ tableId })),
    [dispatch, tableId]
  );

  const init = useCallback(
    (state: Partial<TableQueryState>) =>
      dispatch(initTableState({ tableId, state })),
    [dispatch, tableId]
  );

  return {
    ...tableState,
    setPage,
    setPageSize,
    setSort,
    resetPage,
    reset,
    init,
  };
}
