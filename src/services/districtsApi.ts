import { baseApi } from './baseApi';
import { DISTRICT_METRICS } from '@/features/geospatial/data/mockGeospatialData';
import type { DistrictMetric } from '@/features/geospatial/types/geospatial';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DistrictResponse {
  id: string;
  name: string;
  code?: string;
  state?: string;
  geometry?: GeoJSON.Geometry | null;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDistrictPayload {
  name: string;
  code?: string;
  state?: string;
  geometry?: GeoJSON.Geometry | null;
  metadata?: Record<string, unknown>;
}

export interface DistrictGeoJsonRecord {
  ROWID: string;
  district_code: string;
  district_slug: string | null;
  district_name: string;
  geometry_type: string;
  boundary: string; // Stringified GeoJSON Geometry
  center_lat: number | null;
  center_lng: number | null;
  coordinate_count: number | null;
}

export interface ComparisonResult {
  district: string;
  crimeCount: number;
  resolutionRate: number;
  riskIndex: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  growthRate: number;
}

// ---------------------------------------------------------------------------
// API Slice
// ---------------------------------------------------------------------------

export const districtsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createDistrict: builder.mutation<{ data: DistrictResponse; message: string }, CreateDistrictPayload>({
      query: (body) => ({
        url: '/geo/districts',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['District'],
    }),

    getDistricts: builder.query<DistrictResponse[], void>({
      query: () => '/geo/districts/getAll',
      transformResponse: (response: any) => response.data ?? response,
      providesTags: (result) =>
        result
          ? [
              ...result.map((d) => ({ type: 'District' as const, id: d.id })),
              { type: 'District', id: 'LIST' },
            ]
          : [{ type: 'District', id: 'LIST' }],
    }),

    getDistrictById: builder.query<DistrictResponse, string>({
      query: (id) => `/geo/districts/${id}`,
      transformResponse: (response: any) => response.data ?? response,
      providesTags: (_result, _error, id) => [{ type: 'District', id }],
    }),

    deleteDistrict: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/geo/districts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['District'],
    }),

    getDistrictsGeoJson: builder.query<DistrictGeoJsonRecord[], void>({
      query: () => '/geo/districts/geojson/getAll',
      transformResponse: (response: any) => response.data ?? response,
      providesTags: ['District'],
    }),

    getDistrictMetrics: builder.query<DistrictMetric[], void>({
      queryFn: () => {
        return { data: DISTRICT_METRICS };
      },
    }),

    getDistrictComparison: builder.query<ComparisonResult[], string[]>({
      queryFn: (districts) => {
        const results = DISTRICT_METRICS.filter((metric) =>
          districts.includes(metric.district)
        ).map((m) => ({
          district: m.district,
          crimeCount: m.crimeCount,
          resolutionRate: m.resolutionRate,
          riskIndex: m.riskIndex,
          trend: m.trend,
          growthRate: m.growthRate,
        }));
        return { data: results };
      },
    }),
  }),
});

export const {
  useCreateDistrictMutation,
  useGetDistrictsQuery,
  useGetDistrictByIdQuery,
  useDeleteDistrictMutation,
  useGetDistrictsGeoJsonQuery,
  useGetDistrictMetricsQuery,
  useGetDistrictComparisonQuery,
} = districtsApi;

