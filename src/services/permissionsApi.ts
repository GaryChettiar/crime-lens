import { baseApi } from './baseApi';

// ---------------------------------------------------------------------------
// Types — aligned with backend permission.repository.js
// ---------------------------------------------------------------------------

export interface Permission {
  id: string;
  name: string;
  description?: string | null;
  parentId?: string | null;
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PermissionsResponse {
  system: Permission[];
  business: Permission[];
}

export interface CreatePermissionsPayload {
  permissions: { name: string; description?: string }[];
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
    /**
     * GET /permissions
     * Returns { system: Permission[], business: Permission[] }
     */
    getAllPermissions: builder.query<PermissionsResponse, void>({
      query: () => '/permissions',
      transformResponse: (response: any) => {
        const data = response?.data ?? response;
        return {
          system: data?.system ?? [],
          business: data?.business ?? [],
        };
      },
      providesTags: (result) => {
        const all = [...(result?.system ?? []), ...(result?.business ?? [])];
        return [
          ...all.map((p) => ({ type: 'Permission' as const, id: p.id })),
          { type: 'Permission', id: 'LIST' },
        ];
      },
    }),

    /**
     * POST /permissions
     * Body: [{ name, description }] — bulk create
     */
    createPermissions: builder.mutation<
      { message: string; created: { id: string; name: string }[]; skipped: string[] },
      { name: string; description?: string }[]
    >({
      query: (body) => ({
        url: '/permissions',
        method: 'POST',
        body,
      }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: [{ type: 'Permission', id: 'LIST' }],
    }),

    /**
     * PUT /permissions/:id
     * Body: { name?, description? }
     */
    updatePermission: builder.mutation<
      { message: string },
      { id: string; body: UpdatePermissionPayload }
    >({
      query: ({ id, body }) => ({
        url: `/permissions/${id}`,
        method: 'PUT',
        body,
      }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Permission', id },
        { type: 'Permission', id: 'LIST' },
      ],
    }),

    /**
     * DELETE /permissions/:id — soft delete (falls back to hard delete on backend)
     */
    deletePermission: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/permissions/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: [{ type: 'Permission', id: 'LIST' }],
    }),

    /**
     * DELETE /permissions/:id/hard — hard delete (also removes role mappings)
     */
    hardDeletePermission: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/permissions/${id}/hard`,
        method: 'DELETE',
      }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: [{ type: 'Permission', id: 'LIST' }],
    }),

    /**
     * POST /permissions/:id/restore — restore (not supported by backend schema, will error)
     */
    restorePermission: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/permissions/${id}/restore`,
        method: 'POST',
      }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: [{ type: 'Permission', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetAllPermissionsQuery,
  useCreatePermissionsMutation,
  useUpdatePermissionMutation,
  useDeletePermissionMutation,
  useHardDeletePermissionMutation,
  useRestorePermissionMutation,
} = permissionsApi;
