import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type BrandingConfig, DEFAULT_BRANDING } from '@/types/rbac';

/* =============================================================================
   CrimeLens — Branding Slice
   =============================================================================
   Manages the theme/branding configuration in Redux. Hydrated from backend
   via API query. Supports local preview/staged changes before applying.
   ============================================================================= */

interface BrandingState {
  /** Currently active branding (what the app renders) */
  active: BrandingConfig;
  /** Staged branding for preview before apply */
  staged: BrandingConfig;
  /** Whether staged differs from active */
  hasUnsavedChanges: boolean;
  /** Whether preview mode is active */
  isPreviewing: boolean;
}

const getSavedBranding = (): BrandingConfig => {
  try {
    const saved = localStorage.getItem('crimelens_branding');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to parse branding from localStorage:', e);
  }
  return DEFAULT_BRANDING;
};

const savedBranding = getSavedBranding();

const initialState: BrandingState = {
  active: savedBranding,
  staged: savedBranding,
  hasUnsavedChanges: false,
  isPreviewing: false,
};

const brandingSlice = createSlice({
  name: 'branding',
  initialState,
  reducers: {
    /** Hydrate active branding from API */
    hydrateBranding(state, action: PayloadAction<Partial<BrandingConfig>>) {
      const merged = { ...DEFAULT_BRANDING, ...action.payload };
      state.active = merged;
      // Only overwrite staged if the user isn't currently editing or previewing
      if (!state.isPreviewing && !state.hasUnsavedChanges) {
        state.staged = merged;
      }
    },

    /** Update a single field in staged branding */
    setStagedField(
      state,
      action: PayloadAction<{ field: keyof BrandingConfig; value: string }>,
    ) {
      const { field, value } = action.payload;
      state.staged[field] = value;
      state.hasUnsavedChanges = true;
    },

    /** Replace entire staged branding */
    setStaged(state, action: PayloadAction<Partial<BrandingConfig>>) {
      state.staged = { ...state.staged, ...action.payload };
      state.hasUnsavedChanges = true;
    },

    /** Enter preview mode — applies staged to CSS without persisting */
    previewBranding(state) {
      state.isPreviewing = true;
    },

    /** Exit preview mode — reverts CSS to active branding */
    cancelPreview(state) {
      state.isPreviewing = false;
      state.staged = { ...state.active };
      state.hasUnsavedChanges = false;
    },

    /** Apply staged branding as the new active branding */
    applyBranding(state) {
      state.active = { ...state.staged };
      state.hasUnsavedChanges = false;
      state.isPreviewing = false;
      try {
        localStorage.setItem('crimelens_branding', JSON.stringify(state.active));
      } catch (e) {
        console.error('Failed to save branding to localStorage:', e);
      }
    },

    /** Reset branding to defaults */
    resetBranding(state) {
      state.active = { ...DEFAULT_BRANDING };
      state.staged = { ...DEFAULT_BRANDING };
      state.hasUnsavedChanges = false;
      state.isPreviewing = false;
      try {
        localStorage.removeItem('crimelens_branding');
      } catch (e) {
        console.error('Failed to remove branding from localStorage:', e);
      }
    },
  },
});

export const {
  hydrateBranding,
  setStagedField,
  setStaged,
  previewBranding,
  cancelPreview,
  applyBranding,
  resetBranding,
} = brandingSlice.actions;

export const brandingReducer = brandingSlice.reducer;

/** Helper to determine if a hex color is dark */
export const isHexColorDark = (hexColor: string): boolean => {
  if (!hexColor) return true;
  try {
    let hex = hexColor.replace(/^#/, '');
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    return l < 0.5;
  } catch (e) {
    return true;
  }
};

/** Selector to check if the current branding background color is dark */
export const selectIsDark = (state: { branding: BrandingState }) => {
  const config = state.branding.isPreviewing ? state.branding.staged : state.branding.active;
  return isHexColorDark(config.background);
};
