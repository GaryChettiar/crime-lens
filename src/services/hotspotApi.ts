import { baseApi } from './baseApi';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Hotspot {
  id: string;
  name: string;
  coordinates: [number, number];
  radius: number;
  intensity: number;
  crimeCount: number;
  dominantType: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  trend: 'increasing' | 'stable' | 'decreasing';
}

export interface HotspotFilters {
  riskLevel?: string;
  crimeType?: string;
  district?: string;
  startDate?: string;
  endDate?: string;
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
  category?: string;
}

export interface HeatmapFilters {
  crimeType?: string;
  district?: string;
  startDate?: string;
  endDate?: string;
  resolution?: 'low' | 'medium' | 'high';
}

export interface HotspotPrediction {
  id: string;
  coordinates: [number, number];
  predictedIntensity: number;
  confidence: number;
  predictedDate: string;
  basedOnCrimeTypes: string[];
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

/**
 * Hotspot API — Geographic crime hotspot and heatmap data endpoints.
 */
export const hotspotApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getHotspots: builder.query<Hotspot[], HotspotFilters | void>({
      query: (filters) => ({
        url: '/hotspots',
        params: filters ?? undefined,
      }),
      providesTags: ['Hotspot'],
    }),

    getHeatmapData: builder.query<HeatmapPoint[], HeatmapFilters>({
      query: (filters) => ({
        url: '/hotspots/heatmap',
        params: filters,
      }),
      providesTags: ['Hotspot'],
    }),

    getHotspotPredictions: builder.query<HotspotPrediction[], { days?: number }>({
      query: ({ days = 7 }) => ({
        url: '/hotspots/predictions',
        params: { days },
      }),
      providesTags: ['Hotspot'],
    }),
  }),
});

export const {
  useGetHotspotsQuery,
  useGetHeatmapDataQuery,
  useGetHotspotPredictionsQuery,
} = hotspotApi;
