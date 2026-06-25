import { baseApi } from './baseApi';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RoleResponse {
  id: string;
  name: string;
  description?: string;
  isArchived: boolean;
  permissions?: PermissionResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface PermissionResponse {
  id: string;
  name: string;
  description?: string;
  isArchived: boolean;
}

export interface CreateRolePayload {
  name: string;
  description?: string;
}

export interface UpdateRolePayload {
  name?: string;
  description?: string;
}

export interface MapPermissionsPayload {
  permissionIds: string[];
}

// ---------------------------------------------------------------------------
// API Slice
// ---------------------------------------------------------------------------

export const rolesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createRole: builder.mutation<{ data: RoleResponse; message: string }, CreateRolePayload>({
      query: (body) => ({
        url: '/roles',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Role'],
    }),

    getAllRoles: builder.query<RoleResponse[], void>({
      query: () => '/roles/getAll',
      transformResponse: (response: any) => response.data?.roles ?? response.data ?? response,
      providesTags: (result) =>
        Array.isArray(result)
          ? [
              ...result.map((r) => ({ type: 'Role' as const, id: r.id })),
              { type: 'Role', id: 'LIST' },
            ]
          : [{ type: 'Role', id: 'LIST' }],
    }),

    getRoleById: builder.query<RoleResponse, string>({
      query: (id) => `/roles/${id}`,
      transformResponse: (response: any) => response.data ?? response,
      providesTags: (_result, _error, id) => [{ type: 'Role', id }],
    }),

    updateRole: builder.mutation<{ data: RoleResponse; message: string }, { id: string; body: UpdateRolePayload }>({
      query: ({ id, body }) => ({
        url: `/roles/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Role', id },
        { type: 'Role', id: 'LIST' },
      ],
    }),

    deleteRole: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/roles/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Role'],
    }),

    restoreRole: builder.mutation<{ data: RoleResponse; message: string }, string>({
      query: (id) => ({
        url: `/roles/${id}/restore`,
        method: 'POST',
      }),
      invalidatesTags: ['Role'],
    }),

    createRolePermission: builder.mutation<{ message: string }, { name: string; description?: string }>({
      query: (body) => ({
        url: '/roles/permissions',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Permission'],
    }),

    mapPermissionsToRole: builder.mutation<{ message: string }, { roleId: string; body: MapPermissionsPayload }>({
      query: ({ roleId, body }) => ({
        url: `/roles/${roleId}/mapPermissions`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { roleId }) => [
        { type: 'Role', id: roleId },
        { type: 'Role', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useCreateRoleMutation,
  useGetAllRolesQuery,
  useGetRoleByIdQuery,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useRestoreRoleMutation,
  useCreateRolePermissionMutation,
  useMapPermissionsToRoleMutation,
} = rolesApi;
