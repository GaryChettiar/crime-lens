import { baseApi } from './baseApi';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PermissionResponse {
  id: string;
  name: string;
  description?: string;
  isArchived: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePermissionPayload {
  name: string;
  description?: string;
}

export interface UpdatePermissionPayload {
  name?: string;
  description?: string;
}

// ---------------------------------------------------------------------------
// API Slice
// ---------------------------------------------------------------------------

export const permissionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createPermission: builder.mutation<{ data: PermissionResponse; message: string }, CreatePermissionPayload>({
      query: (body) => ({
        url: '/permissions',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Permission'],
    }),

    getAllPermissions: builder.query<PermissionResponse[], void>({
      query: () => '/permissions',
      transformResponse: (response: any) => response.data ?? response,
      providesTags: (result) =>
        result
          ? [
              ...result.map((p) => ({ type: 'Permission' as const, id: p.id })),
              { type: 'Permission', id: 'LIST' },
            ]
          : [{ type: 'Permission', id: 'LIST' }],
    }),

    updatePermission: builder.mutation<{ data: PermissionResponse; message: string }, { id: string; body: UpdatePermissionPayload }>({
      query: ({ id, body }) => ({
        url: `/permissions/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Permission', id },
        { type: 'Permission', id: 'LIST' },
      ],
    }),

    deletePermission: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/permissions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Permission'],
    }),

    restorePermission: builder.mutation<{ data: PermissionResponse; message: string }, string>({
      query: (id) => ({
        url: `/permissions/${id}/restore`,
        method: 'POST',
      }),
      invalidatesTags: ['Permission'],
    }),

    hardDeletePermission: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/permissions/${id}/hard`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Permission'],
    }),
  }),
});

export const {
  useCreatePermissionMutation,
  useGetAllPermissionsQuery,
  useUpdatePermissionMutation,
  useDeletePermissionMutation,
  useRestorePermissionMutation,
  useHardDeletePermissionMutation,
} = permissionsApi;
