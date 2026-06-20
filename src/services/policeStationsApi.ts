import { baseApi } from './baseApi';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PoliceStationResponse {
  id: string;
  name: string;
  code?: string;
  districtId?: string;
  districtName?: string;
  typeId?: string;
  typeName?: string;
  address?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  geometry?: GeoJSON.Geometry | null;
  isArchived?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePoliceStationPayload {
  name: string;
  code?: string;
  districtId?: string;
  typeId?: string;
  address?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
}

export interface UpdatePoliceStationPayload {
  name?: string;
  code?: string;
  districtId?: string;
  typeId?: string;
  address?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
}

export interface GeoJsonUploadPayload {
  geojson: object;
}

// ---------------------------------------------------------------------------
// API Slice
// ---------------------------------------------------------------------------

export const policeStationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createStation: builder.mutation<{ data: PoliceStationResponse; message: string }, CreatePoliceStationPayload>({
      query: (body) => ({
        url: '/police/stations',
        method: 'POST',
        body: {
          station_name: body.name,
          station_code: body.code,
          district_id: body.districtId,
          station_type_id: body.typeId,
          address: body.address,
          latitude: body.latitude,
          longitude: body.longitude,
        },
      }),
      invalidatesTags: ['PoliceStation'],
    }),

    getStations: builder.query<PoliceStationResponse[], { districtId?: string; typeId?: string } | void>({
      query: (params) => ({
        url: '/police/stations',
        params: params
          ? {
              district_id: params.districtId,
              station_type_id: params.typeId,
            }
          : undefined,
      }),
      transformResponse: (response: any) => {
        const list = response.data ?? response ?? [];
        return list.map((s: any) => ({
          id: s.ROWID || s.id,
          name: s.station_name || s.name,
          code: s.station_code || s.code,
          districtId: s.district_id,
          typeId: s.station_type_id,
          address: s.address,
          latitude: s.latitude ? parseFloat(s.latitude) : undefined,
          longitude: s.longitude ? parseFloat(s.longitude) : undefined,
        }));
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((s) => ({ type: 'PoliceStation' as const, id: s.id })),
              { type: 'PoliceStation', id: 'LIST' },
            ]
          : [{ type: 'PoliceStation', id: 'LIST' }],
    }),

    getStationById: builder.query<PoliceStationResponse, string>({
      query: (id) => `/police/stations/${id}`,
      transformResponse: (response: any) => {
        const s = response.data ?? response;
        return {
          id: s.ROWID || s.id,
          name: s.station_name || s.name,
          code: s.station_code || s.code,
          districtId: s.district_id,
          typeId: s.station_type_id,
          address: s.address,
          latitude: s.latitude ? parseFloat(s.latitude) : undefined,
          longitude: s.longitude ? parseFloat(s.longitude) : undefined,
        };
      },
      providesTags: (_result, _error, id) => [{ type: 'PoliceStation', id }],
    }),

    updateStation: builder.mutation<{ data: PoliceStationResponse; message: string }, { id: string; body: UpdatePoliceStationPayload }>({
      query: ({ id, body }) => ({
        url: `/police/stations/${id}`,
        method: 'PUT',
        body: {
          station_name: body.name,
          station_code: body.code,
          district_id: body.districtId,
          station_type_id: body.typeId,
          address: body.address,
          latitude: body.latitude,
          longitude: body.longitude,
        },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'PoliceStation', id },
        { type: 'PoliceStation', id: 'LIST' },
      ],
    }),

    deleteStation: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/police/stations/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PoliceStation'],
    }),

    uploadStationGeoJson: builder.mutation<{ message: string }, GeoJsonUploadPayload>({
      query: (body) => ({
        url: '/police/stations/geojson',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PoliceStation'],
    }),

    bootstrapStationGeoJson: builder.mutation<{ message: string }, GeoJsonUploadPayload>({
      query: (body) => ({
        url: '/police/stations/geojson/bootstrap',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PoliceStation'],
    }),
  }),
});

export const {
  useCreateStationMutation,
  useGetStationsQuery,
  useGetStationByIdQuery,
  useUpdateStationMutation,
  useDeleteStationMutation,
  useUploadStationGeoJsonMutation,
  useBootstrapStationGeoJsonMutation,
} = policeStationsApi;
