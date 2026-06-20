import { baseApi } from './baseApi';

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
      query: () => '/geo/districts',
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
  }),
});

export const {
  useCreateDistrictMutation,
  useGetDistrictsQuery,
  useGetDistrictByIdQuery,
  useDeleteDistrictMutation,
} = districtsApi;
