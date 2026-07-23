import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { CrimeStatus } from '@/services/crimeApi';

/**
 * crimeDetailsSlice — Client-side UI state for the Crime Detail Workspace.
 *
 * Tab navigation is the source-of-truth in URL query params (useSearchParams).
 * This slice holds transient panel/dialog state that doesn't need to be bookmarkable.
 */

export type CrimeTab =
  | 'overview'
  | 'evidence'
  | 'suspects'
  | 'legal'
  | 'timeline'
  | 'activity'
  | 'victims'
  | 'witness'
  | 'criminal'
  | 'investigating_team'
  | 'network_analysis';

export interface CrimeDetailsState {
  selectedSuspectId: string | null;
  selectedEvidenceId: string | null;
  statusChangeDialogOpen: boolean;
  pendingStatusChange: CrimeStatus | null;
  deleteConfirmTarget: { type: 'suspect' | 'evidence' | 'legal'; id: string } | null;
  promoteDialogSuspectId: string | null;
}

const initialState: CrimeDetailsState = {
  selectedSuspectId: null,
  selectedEvidenceId: null,
  statusChangeDialogOpen: false,
  pendingStatusChange: null,
  deleteConfirmTarget: null,
  promoteDialogSuspectId: null,
};

export const crimeDetailsSlice = createSlice({
  name: 'crimeDetails',
  initialState,
  reducers: {
    selectSuspect: (state, action: PayloadAction<string | null>) => {
      state.selectedSuspectId = action.payload;
      if (action.payload) state.selectedEvidenceId = null;
    },
    selectEvidence: (state, action: PayloadAction<string | null>) => {
      state.selectedEvidenceId = action.payload;
      if (action.payload) state.selectedSuspectId = null;
    },
    openStatusChangeDialog: (state, action: PayloadAction<CrimeStatus>) => {
      state.pendingStatusChange = action.payload;
      state.statusChangeDialogOpen = true;
    },
    closeStatusChangeDialog: (state) => {
      state.statusChangeDialogOpen = false;
      state.pendingStatusChange = null;
    },
    setDeleteConfirmTarget: (
      state,
      action: PayloadAction<CrimeDetailsState['deleteConfirmTarget']>
    ) => {
      state.deleteConfirmTarget = action.payload;
    },
    clearDeleteConfirmTarget: (state) => {
      state.deleteConfirmTarget = null;
    },
    openPromoteDialog: (state, action: PayloadAction<string>) => {
      state.promoteDialogSuspectId = action.payload;
    },
    closePromoteDialog: (state) => {
      state.promoteDialogSuspectId = null;
    },
    resetCrimeDetails: () => initialState,
  },
});

export const {
  selectSuspect,
  selectEvidence,
  openStatusChangeDialog,
  closeStatusChangeDialog,
  setDeleteConfirmTarget,
  clearDeleteConfirmTarget,
  openPromoteDialog,
  closePromoteDialog,
  resetCrimeDetails,
} = crimeDetailsSlice.actions;

export const crimeDetailsReducer = crimeDetailsSlice.reducer;
