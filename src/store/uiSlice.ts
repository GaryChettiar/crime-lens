import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Theme } from '@/types/component-states';

/**
 * UI Slice — Client-side UI state management.
 *
 * Manages:
 * - Theme (dark/light/system)
 * - Sidebar collapsed state
 * - Active modal tracking
 * - Command palette state
 */

interface UIState {
  theme: Theme;
  sidebarCollapsed: boolean;
  sidebarMobileOpen: boolean;
  activeModal: string | null;
  commandPaletteOpen: boolean;
  filterBarOpen: boolean;
}

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'dark';
  const stored = localStorage.getItem('crimelens_theme') as Theme | null;
  return stored ?? 'dark';
};

const initialState: UIState = {
  theme: getInitialTheme(),
  sidebarCollapsed: false,
  sidebarMobileOpen: false,
  activeModal: null,
  commandPaletteOpen: false,
  filterBarOpen: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<Theme>) {
      state.theme = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('crimelens_theme', action.payload);

        const root = document.documentElement;
        if (action.payload === 'system') {
          const systemDark = window.matchMedia(
            '(prefers-color-scheme: dark)',
          ).matches;
          root.setAttribute('data-theme', systemDark ? 'dark' : 'light');
          root.className = systemDark ? 'dark' : 'light';
        } else {
          root.setAttribute('data-theme', action.payload);
          root.className = action.payload;
        }
      }
    },
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed(state, action: PayloadAction<boolean>) {
      state.sidebarCollapsed = action.payload;
    },
    setSidebarMobileOpen(state, action: PayloadAction<boolean>) {
      state.sidebarMobileOpen = action.payload;
    },
    openModal(state, action: PayloadAction<string>) {
      state.activeModal = action.payload;
    },
    closeModal(state) {
      state.activeModal = null;
    },
    toggleCommandPalette(state) {
      state.commandPaletteOpen = !state.commandPaletteOpen;
    },
    toggleFilterBar(state) {
      state.filterBarOpen = !state.filterBarOpen;
    },
    setFilterBarOpen(state, action: PayloadAction<boolean>) {
      state.filterBarOpen = action.payload;
    },
  },
});

export const {
  setTheme,
  toggleSidebar,
  setSidebarCollapsed,
  setSidebarMobileOpen,
  openModal,
  closeModal,
  toggleCommandPalette,
  toggleFilterBar,
  setFilterBarOpen,
} = uiSlice.actions;

export const uiReducer = uiSlice.reducer;
