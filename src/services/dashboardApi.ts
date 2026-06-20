import { baseApi } from './baseApi';

/**
 * Dashboard API — Aggregated dashboard data endpoints.
 */
export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardStats: builder.query<DashboardStats, DashboardFilters | void>({
      query: (filters) => ({
        url: '/dashboard/stats',
        params: filters ?? undefined,
      }),
      providesTags: ['Dashboard'],
    }),

    getDashboardTimeline: builder.query<TimelineData[], DashboardFilters | void>({
      query: (filters) => ({
        url: '/dashboard/timeline',
        params: filters ?? undefined,
      }),
      providesTags: ['Dashboard'],
    }),

    getRecentIncidents: builder.query<Incident[], { limit?: number }>({
      query: ({ limit = 10 }) => ({
        url: '/dashboard/recent-incidents',
        params: { limit },
      }),
      providesTags: ['Dashboard', 'Crime'],
    }),
  }),
});

export const {
  useGetDashboardStatsQuery,
  useGetDashboardTimelineQuery,
  useGetRecentIncidentsQuery,
} = dashboardApi;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DashboardStats {
  totalCrimes: number;
  totalCrimesChange: number;
  activeCases: number;
  activeCasesChange: number;
  resolvedCases: number;
  resolvedRate: number;
  highRiskZones: number;
  criticalAlerts: number;
}

export interface DashboardFilters {
  startDate?: string;
  endDate?: string;
  district?: string;
  crimeType?: string;
}

export interface TimelineData {
  date: string;
  count: number;
  category: string;
}

export interface Incident {
  id: string;
  type: string;
  location: string;
  coordinates: [number, number];
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  description: string;
}
