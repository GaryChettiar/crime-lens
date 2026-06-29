import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface DateRange {
  start: string | null;
  end: string | null;
}

export interface FilterSet {
  district: string | null;
  policeStation?: string | null;
  crimeTypes: string[];
  crimeCategory?: string | null;
  severities: string[];
  status?: string | null;
  officer?: string | null;
  singleDate?: string | null;
  dateRange: DateRange;
  selectedFestivalIds: string[];
  selectedPoliceStations: string[];
  syndicateId: string | null;
}

export interface SavedView {
  id: string;
  name: string;
  filters: FilterSet;
}

export interface GlobalFiltersState extends FilterSet {
  savedViews: SavedView[];
}

const DEFAULT_SAVED_VIEWS: SavedView[] = [
  {
    id: 'view-festival-monitoring',
    name: 'Festival Monitoring',
    filters: {
      district: null,
      crimeTypes: [],
      severities: ['high', 'critical'],
      dateRange: { start: '2026-05-15', end: '2026-06-15' },
      selectedFestivalIds: [],
      selectedPoliceStations: [],
      syndicateId: null,
    },
  },
  {
    id: 'view-election-watch',
    name: 'Election Watch',
    filters: {
      district: 'Gulbarga',
      crimeTypes: ['assault', 'homicide'],
      severities: [],
      dateRange: { start: '2026-05-09', end: '2026-05-20' },
      selectedFestivalIds: [],
      selectedPoliceStations: [],
      syndicateId: null,
    },
  },
  {
    id: 'view-cyber-watch',
    name: 'Cyber Crime Watch',
    filters: {
      district: 'Bangalore',
      crimeTypes: ['cyber'],
      severities: [],
      dateRange: { start: null, end: null },
      selectedFestivalIds: [],
      selectedPoliceStations: [],
      syndicateId: null,
    },
  },
  {
    id: 'view-bengaluru-focus',
    name: 'Bengaluru Urban Focus',
    filters: {
      district: 'Bangalore',
      crimeTypes: [],
      severities: [],
      dateRange: { start: null, end: null },
      selectedFestivalIds: [],
      selectedPoliceStations: [],
      syndicateId: null,
    },
  },
  {
    id: 'view-mysore-dasara',
    name: 'Mysuru Dasara Monitoring',
    filters: {
      district: 'Mysore',
      crimeTypes: [],
      severities: [],
      dateRange: { start: '2026-05-25', end: '2026-06-05' },
      selectedFestivalIds: [],
      selectedPoliceStations: [],
      syndicateId: null,
    },
  },
];

const initialState: GlobalFiltersState = {
  district: null,
  policeStation: null,
  crimeTypes: [],
  crimeCategory: null,
  severities: [],
  status: null,
  officer: null,
  singleDate: null,
  dateRange: { start: null, end: null },
  selectedFestivalIds: [],
  selectedPoliceStations: [],
  syndicateId: null,
  savedViews: DEFAULT_SAVED_VIEWS,
};

export const globalFiltersSlice = createSlice({
  name: 'globalFilters',
  initialState,
  reducers: {
    setDistrict: (state, action: PayloadAction<string | null>) => {
      // Normalize 'all' to null for cleaner global filters
      state.district = action.payload === 'all' ? null : action.payload;
    },
    toggleCrimeType: (state, action: PayloadAction<string>) => {
      const type = action.payload;
      if (state.crimeTypes.includes(type)) {
        state.crimeTypes = state.crimeTypes.filter((t) => t !== type);
      } else {
        state.crimeTypes.push(type);
      }
    },
    setCrimeTypes: (state, action: PayloadAction<string[]>) => {
      state.crimeTypes = action.payload;
    },
    toggleSeverity: (state, action: PayloadAction<string>) => {
      const sev = action.payload;
      if (state.severities.includes(sev)) {
        state.severities = state.severities.filter((s) => s !== sev);
      } else {
        state.severities.push(sev);
      }
    },
    setSeverities: (state, action: PayloadAction<string[]>) => {
      state.severities = action.payload;
    },
    setDateRange: (state, action: PayloadAction<DateRange>) => {
      state.dateRange = action.payload;
    },
    setSelectedFestivalIds: (state, action: PayloadAction<string[]>) => {
      state.selectedFestivalIds = action.payload;
    },
    toggleFestivalId: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (state.selectedFestivalIds.includes(id)) {
        state.selectedFestivalIds = state.selectedFestivalIds.filter((f) => f !== id);
      } else {
        state.selectedFestivalIds.push(id);
      }
    },
    setPoliceStation: (state, action: PayloadAction<string | null>) => {
      state.policeStation = action.payload === 'all' ? null : action.payload;
    },
    setCrimeCategory: (state, action: PayloadAction<string | null>) => {
      state.crimeCategory = action.payload === 'all' ? null : action.payload;
    },
    setStatus: (state, action: PayloadAction<string | null>) => {
      state.status = action.payload === 'all' ? null : action.payload;
    },
    setOfficer: (state, action: PayloadAction<string | null>) => {
      state.officer = action.payload === 'all' ? null : action.payload;
    },
    setSingleDate: (state, action: PayloadAction<string | null>) => {
      state.singleDate = action.payload;
    },
    setSelectedPoliceStations: (state, action: PayloadAction<string[]>) => {
      state.selectedPoliceStations = action.payload;
    },
    setSyndicateId: (state, action: PayloadAction<string | null>) => {
      state.syndicateId = action.payload;
    },
    saveView: (state, action: PayloadAction<{ name: string }>) => {
      const id = `view-${Date.now()}`;
      state.savedViews.push({
        id,
        name: action.payload.name,
        filters: {
          district: state.district,
          policeStation: state.policeStation,
          crimeTypes: state.crimeTypes,
          crimeCategory: state.crimeCategory,
          severities: state.severities,
          status: state.status,
          officer: state.officer,
          singleDate: state.singleDate,
          dateRange: state.dateRange,
          selectedFestivalIds: state.selectedFestivalIds,
          selectedPoliceStations: state.selectedPoliceStations,
          syndicateId: state.syndicateId,
        },
      });
    },
    loadSavedView: (state, action: PayloadAction<string>) => {
      const view = state.savedViews.find((v) => v.id === action.payload);
      if (view) {
        state.district = view.filters.district;
        state.policeStation = view.filters.policeStation ?? null;
        state.crimeTypes = view.filters.crimeTypes;
        state.crimeCategory = view.filters.crimeCategory ?? null;
        state.severities = view.filters.severities;
        state.status = view.filters.status ?? null;
        state.officer = view.filters.officer ?? null;
        state.singleDate = view.filters.singleDate ?? null;
        state.dateRange = view.filters.dateRange;
        state.selectedFestivalIds = view.filters.selectedFestivalIds;
        state.selectedPoliceStations = view.filters.selectedPoliceStations;
        state.syndicateId = view.filters.syndicateId;
      }
    },
    deleteSavedView: (state, action: PayloadAction<string>) => {
      state.savedViews = state.savedViews.filter((v) => v.id !== action.payload);
    },
    resetFilters: (state) => {
      state.district = null;
      state.policeStation = null;
      state.crimeTypes = [];
      state.crimeCategory = null;
      state.severities = [];
      state.status = null;
      state.officer = null;
      state.singleDate = null;
      state.dateRange = { start: null, end: null };
      state.selectedFestivalIds = [];
      state.selectedPoliceStations = [];
      state.syndicateId = null;
    },
  },
});

export const {
  setDistrict,
  setPoliceStation,
  setCrimeCategory,
  setStatus,
  setOfficer,
  setSingleDate,
  toggleCrimeType,
  setCrimeTypes,
  toggleSeverity,
  setSeverities,
  setDateRange,
  setSelectedFestivalIds,
  toggleFestivalId,
  setSelectedPoliceStations,
  setSyndicateId,
  saveView,
  loadSavedView,
  deleteSavedView,
  resetFilters,
} = globalFiltersSlice.actions;

export const globalFiltersReducer = globalFiltersSlice.reducer;
