import { baseApi } from './baseApi';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StationTypeResponse {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateStationTypePayload {
  name: string;
  description?: string;
}

// ---------------------------------------------------------------------------
// API Slice
// ---------------------------------------------------------------------------

export const stationTypesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createStationType: builder.mutation<{ data: StationTypeResponse; message: string }, CreateStationTypePayload>({
      query: (body) => ({
        url: '/police/stations/types',
        method: 'POST',
        body: {
          station_type_name: body.name,
        },
      }),
      invalidatesTags: ['StationType'],
    }),

    getStationTypes: builder.query<StationTypeResponse[], void>({
      query: () => '/police/stations/types',
      transformResponse: (response: any) => {
        const list = response.data ?? response ?? [];
        return list.map((t: any) => ({
          id: t.ROWID || t.id,
          name: t.station_type_name || t.name,
          description: t.description || '',
        }));
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((t) => ({ type: 'StationType' as const, id: t.id })),
              { type: 'StationType', id: 'LIST' },
            ]
          : [{ type: 'StationType', id: 'LIST' }],
    }),

    deleteStationType: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/police/stations/types/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['StationType'],
    }),
  }),
});

export const {
  useCreateStationTypeMutation,
  useGetStationTypesQuery,
  useDeleteStationTypeMutation,
} = stationTypesApi;
