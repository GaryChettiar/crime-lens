import { baseApi } from './baseApi';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PoliceRankResponse {
  id: string;
  name: string;
  level?: number;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePoliceRankPayload {
  name: string;
  level?: number;
  description?: string;
}

// ---------------------------------------------------------------------------
// API Slice
// ---------------------------------------------------------------------------

export const policeRanksApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createRank: builder.mutation<{ data: PoliceRankResponse; message: string }, CreatePoliceRankPayload>({
      query: (body) => ({
        url: '/police/officers/ranks',
        method: 'POST',
        body: {
          rank_name: body.name,
          hierarchy_level: body.level,
        },
      }),
      invalidatesTags: ['PoliceRank'],
    }),

    getRanks: builder.query<PoliceRankResponse[], void>({
      query: () => '/police/officers/ranks',
      transformResponse: (response: any) => {
        const list = response.data ?? response ?? [];
        return list.map((r: any) => ({
          id: r.ROWID || r.id,
          name: r.rank_name || r.name,
          level: r.hierarchy_level || r.level,
          description: r.description || '',
        }));
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((r) => ({ type: 'PoliceRank' as const, id: r.id })),
              { type: 'PoliceRank', id: 'LIST' },
            ]
          : [{ type: 'PoliceRank', id: 'LIST' }],
    }),

    deleteRank: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/police/officers/ranks/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PoliceRank'],
    }),
  }),
});

export const {
  useCreateRankMutation,
  useGetRanksQuery,
  useDeleteRankMutation,
} = policeRanksApi;
