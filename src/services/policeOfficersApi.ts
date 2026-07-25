import { baseApi } from './baseApi';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PoliceOfficerResponse {
  id: string;
  userId?: string;
  name?: string;
  badgeNumber?: string;
  email?: string;
  phone?: string;
  contactNumber?: string;
  rankId?: string;
  rankName?: string;
  stationId?: string;
  stationName?: string;
  districtId?: string;
  districtName?: string;
  status?: string;
  isArchived?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePoliceOfficerPayload {
  name: string;
  badgeNumber?: string;
  email?: string;
  phone?: string;
  rankId?: string;
  stationId?: string;
}

export interface UpdatePoliceOfficerPayload {
  name?: string;
  badgeNumber?: string;
  email?: string;
  phone?: string;
  rankId?: string;
  stationId?: string;
}

// ---------------------------------------------------------------------------
// API Slice
// ---------------------------------------------------------------------------

export const policeOfficersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createOfficer: builder.mutation<{ data: PoliceOfficerResponse; message: string }, CreatePoliceOfficerPayload>({
      query: (body) => ({
        url: '/police/officers',
        method: 'POST',
        body: {
          name: body.name,
          badge_number: body.badgeNumber,
          email: body.email,
          contact_number: body.phone,
          rank_id: body.rankId,
          station_id: body.stationId,
        },
      }),
      invalidatesTags: ['PoliceOfficer'],
    }),

    getOfficers: builder.query<PoliceOfficerResponse[], { rankId?: string; stationId?: string } | void>({
      query: (params) => ({
        url: '/police/officers/getAll',
        params: params
          ? {
              rank_id: params.rankId,
              station_id: params.stationId,
            }
          : undefined,
      }),
      transformResponse: (response: any) => {
        const list = response.data ?? response ?? [];
        return list.map((o: any) => ({
          id: o.ROWID || o.id,
          userId: o.user_id,
          badgeNumber: o.badge_number,
          rankId: o.rank_id,
          stationId: o.station_id,
          phone: o.contact_number,
          status: o.operational_status,
          isArchived: o.is_archived === true || o.is_archived === 'true',
        }));
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((o) => ({ type: 'PoliceOfficer' as const, id: o.id })),
              { type: 'PoliceOfficer', id: 'LIST' },
            ]
          : [{ type: 'PoliceOfficer', id: 'LIST' }],
    }),

    getOfficerById: builder.query<PoliceOfficerResponse, string>({
      query: (id) => `/police/officers/${id}`,
      transformResponse: (response: any) => {
        const o = response.data ?? response;
        return {
          id: o.ROWID || o.id,
          userId: o.user_id,
          badgeNumber: o.badge_number,
          rankId: o.rank_id,
          stationId: o.station_id,
          phone: o.contact_number,
          status: o.operational_status,
          isArchived: o.is_archived === true || o.is_archived === 'true',
        };
      },
      providesTags: (_result, _error, id) => [{ type: 'PoliceOfficer', id }],
    }),

    updateOfficer: builder.mutation<{ data: PoliceOfficerResponse; message: string }, { id: string; body: UpdatePoliceOfficerPayload }>({
      query: ({ id, body }) => ({
        url: `/police/officers/${id}`,
        method: 'PUT',
        body: {
          name: body.name,
          badge_number: body.badgeNumber,
          email: body.email,
          contact_number: body.phone,
          rank_id: body.rankId,
          station_id: body.stationId,
        },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'PoliceOfficer', id },
        { type: 'PoliceOfficer', id: 'LIST' },
      ],
    }),

    deleteOfficer: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/police/officers/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PoliceOfficer'],
    }),

    getAllPoliceOfficers: builder.query<PoliceOfficerResponse[], void>({
      query: () => ({
        url: '/police/officers/getAll',
      }),
      transformResponse: (response: any) => {
        const list = response.data ?? response ?? [];
        return list.map((o: any) => ({
          id: o.ROWID || o.id,
          name:o.name,
          userId: o.user_id,
          badgeNumber: o.badge_number,
          rankId: o.rank_id,
          stationId: o.station_id,
          phone: o.contact_number,
          status: o.operational_status,
          isArchived: o.is_archived === true || o.is_archived === 'true',
        }));
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((o) => ({ type: 'PoliceOfficer' as const, id: o.id })),
              { type: 'PoliceOfficer', id: 'LIST' },
            ]
          : [{ type: 'PoliceOfficer', id: 'LIST' }],
    }),
  }),
});

export const {
  useCreateOfficerMutation,
  useGetOfficersQuery,
  useGetOfficerByIdQuery,
  useUpdateOfficerMutation,
  useDeleteOfficerMutation,
  useGetAllPoliceOfficersQuery,
} = policeOfficersApi;
