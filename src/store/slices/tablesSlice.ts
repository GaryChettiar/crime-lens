import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { TableQueryState, SortOrder } from '@/types/pagination';

/**
 * CrimeLens — Generic Tables Slice
 *
 * A single Redux slice that manages query state for every paginated table
 * in the application. The registry is dynamic — any module can claim a key
 * without requiring reducer changes.
 *
 * State shape:
 *   state.tables["crimes"]   → { page, pageSize, sortBy, sortOrder }
 *   state.tables["criminals"] → { page, pageSize, sortBy, sortOrder }
 *   state.tables["firs"]      → { page, pageSize, sortBy, sortOrder }
 *   ... etc.
 *
 * NOTE: Search is intentionally NOT stored here. Raw search input lives in
 * component state; the debounced value is passed directly into the query.
 * This avoids unnecessary Redux round-trips for every keystroke.
 */

export type TableId = string;

export interface TablesState {
  [tableId: TableId]: TableQueryState;
}

const DEFAULT_STATE: TableQueryState = {
  page: 1,
  pageSize: 20,
  sortBy: 'crime_occured_date_time',
  sortOrder: 'DESC',
};

const initialState: TablesState = {};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Ensure the table key exists, initializing with defaults if first access. */
function ensureTable(state: TablesState, tableId: TableId): TableQueryState {
  if (!state[tableId]) {
    state[tableId] = { ...DEFAULT_STATE };
  }
  return state[tableId];
}

// ---------------------------------------------------------------------------
// Slice
// ---------------------------------------------------------------------------

export const tablesSlice = createSlice({
  name: 'tables',
  initialState,
  reducers: {
    setTablePage: (
      state,
      action: PayloadAction<{ tableId: TableId; page: number }>
    ) => {
      const { tableId, page } = action.payload;
      ensureTable(state, tableId).page = page;
    },

    setTablePageSize: (
      state,
      action: PayloadAction<{ tableId: TableId; pageSize: number }>
    ) => {
      const { tableId, pageSize } = action.payload;
      const table = ensureTable(state, tableId);
      table.pageSize = pageSize;
      table.page = 1; // reset to first page on page-size change
    },

    setTableSort: (
      state,
      action: PayloadAction<{
        tableId: TableId;
        sortBy: string;
        sortOrder: SortOrder;
      }>
    ) => {
      const { tableId, sortBy, sortOrder } = action.payload;
      const table = ensureTable(state, tableId);
      table.sortBy = sortBy;
      table.sortOrder = sortOrder;
      table.page = 1; // reset to first page on sort change
    },

    resetTablePage: (
      state,
      action: PayloadAction<{ tableId: TableId }>
    ) => {
      const table = ensureTable(state, action.payload.tableId);
      table.page = 1;
    },

    resetTableState: (
      state,
      action: PayloadAction<{ tableId: TableId }>
    ) => {
      state[action.payload.tableId] = { ...DEFAULT_STATE };
    },

    /** Initialize a table key from URL params or any external source. */
    initTableState: (
      state,
      action: PayloadAction<{ tableId: TableId; state: Partial<TableQueryState> }>
    ) => {
      const { tableId, state: incoming } = action.payload;
      state[tableId] = { ...DEFAULT_STATE, ...incoming };
    },
  },
});

export const {
  setTablePage,
  setTablePageSize,
  setTableSort,
  resetTablePage,
  resetTableState,
  initTableState,
} = tablesSlice.actions;

export const tablesReducer = tablesSlice.reducer;
