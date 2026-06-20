import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

/**
 * CrimeLens Base API
 *
 * Central RTK Query API slice. All feature-specific API slices inject
 * their endpoints into this base API using `injectEndpoints`.
 *
 * This architecture enables:
 * - Single cache instance across the app
 * - Code splitting per feature
 * - Automatic request deduplication
 * - Optimistic updates and cache invalidation
 */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://crimelens-60074096850.development.catalystserverless.in/server/crimeLens',
    credentials: 'include', // Important: Ensures Catalyst session cookies are sent!
    prepareHeaders: (headers) => {
      // Legacy token check, catalyst mainly relies on cookies
      const token = localStorage.getItem('crimelens_token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: [
    'Auth',
    'User',
    'Role',
    'Permission',
    'Invite',
    'Configuration',
    'District',
    'StationType',
    'PoliceStation',
    'PoliceRank',
    'PoliceOfficer',
    'Criminal',
    'Crime',
    'FIR',
    'Dashboard',
    'Hotspot',
    'Risk',
    'Network',
    'Report',
    'Alert',
  ],
  endpoints: () => ({}),
});
