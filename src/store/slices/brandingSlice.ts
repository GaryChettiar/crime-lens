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
