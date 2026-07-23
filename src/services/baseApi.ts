import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getStoredAccessToken } from './authStorage';

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
    baseUrl: import.meta.env.VITE_API_BASE_URL,
    credentials: 'include', // Important: Ensures Catalyst session cookies are sent!
    prepareHeaders: (headers) => {
      const token = getStoredAccessToken();
      if (token && token !== 'undefined' && token !== 'null') {
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
    'CriminalProfile',
    'CriminalRiskFactors',
    'CrimeSuspect',
    'CrimeEvidence',
    'CrimeLegalSection',
    'CrimeActivity',
    'CrimeCategory',
  ],
  endpoints: () => ({}),
});
