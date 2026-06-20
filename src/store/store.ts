import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from '@/services/baseApi';
import { newsApi } from '@/services/newsApi';
import { uiReducer } from './uiSlice';
import { globalFiltersReducer } from './slices/globalFiltersSlice';
import { brandingReducer } from './slices/brandingSlice';

/**
 * CrimeLens Redux Store
 *
 * Architecture:
 * - RTK Query for all server state (via baseApi)
 * - News API for external intelligence (via newsApi — separate Flask backend)
 * - UI slice for client-side UI state (theme, sidebar, modals)
 * - Branding slice for theme/branding configuration
 * - Feature slices injected via code-splitting as needed
 */
export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    [newsApi.reducerPath]: newsApi.reducer,
    ui: uiReducer,
    globalFilters: globalFiltersReducer,
    branding: brandingReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware, newsApi.middleware),
  devTools: import.meta.env.DEV,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

