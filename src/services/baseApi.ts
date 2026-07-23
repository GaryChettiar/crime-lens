import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import {
  clearStoredAuthSession,
  getStoredAccessToken,
  getStoredRefreshToken,
  getStoredSessionId,
  setStoredAuthSession,
} from './authStorage';

function unwrapAuthPayload<T>(response: unknown): T {
  const payload = response as Record<string, unknown>;
  return (payload?.data ?? payload) as T;
}

function getRequestUrl(args: string | FetchArgs): string {
  if (typeof args === 'string') return args;
  return args.url;
}

function shouldAttemptTokenRefresh(url: string, status: number | string): boolean {
  if (status !== 401 && status !== 403) return false;
  if (url.includes('/auth/login') || url.includes('/auth/refresh')) return false;
  return Boolean(getStoredRefreshToken() && getStoredSessionId());
}

let refreshPromise: Promise<boolean> | null = null;

async function refreshAuthSession(
  rawBaseQuery: ReturnType<typeof fetchBaseQuery>,
  api: Parameters<BaseQueryFn>[1],
  extraOptions: Parameters<BaseQueryFn>[2],
): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = getStoredRefreshToken();
    const sessionId = getStoredSessionId();
    if (!refreshToken || !sessionId) return false;

    const refreshResult = await rawBaseQuery(
      {
        url: '/auth/refresh',
        method: 'POST',
        body: { sessionId, refreshToken },
      },
      api,
      extraOptions,
    );

    if (refreshResult.error) return false;

    const data = unwrapAuthPayload<{
      accessToken: string;
      refreshToken?: string;
      sessionId?: string;
    }>(refreshResult.data);

    if (!data?.accessToken) return false;

    setStoredAuthSession({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken ?? refreshToken,
      sessionId: data.sessionId ?? sessionId,
    });

    return true;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL,
  credentials: 'include',
  prepareHeaders: (headers) => {
    const token = getStoredAccessToken();
    if (token && token !== 'undefined' && token !== 'null') {
      headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);
  const url = getRequestUrl(args);
  const status = result.error?.status;

  if (
    result.error &&
    status !== undefined &&
    shouldAttemptTokenRefresh(url, status)
  ) {
    const refreshed = await refreshAuthSession(rawBaseQuery, api, extraOptions);

    if (refreshed) {
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      clearStoredAuthSession();
    }
  }

  return result;
};

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
  baseQuery: baseQueryWithReauth,
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
    'Suspect',
    'CaseVictim',
    'CaseWitness',
    'CrimeEvidence',
    'CrimeLegalSection',
    'CrimeActivity',
    'CrimeCategory',
  ],
  endpoints: () => ({}),
});

