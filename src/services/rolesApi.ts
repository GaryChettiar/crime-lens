import { baseApi } from './baseApi';

// ---------------------------------------------------------------------------
// Types — aligned with backend role.repository.js
// ---------------------------------------------------------------------------

export interface RolePermission {
  id: string;
  name: string;
  description?: string | null;
  parentId?: string | null;
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
  children?: RolePermission[];
}

export interface RoleUser {
  id: string;
  username?: string;
  email: string;
  isArchived: boolean;
}

export interface Role {
  id: string;
  name: string;
  isDefault: boolean;
  isEditable: boolean;
  createdAt?: string;
  updatedAt?: string;
  // Only present when isDetailed=true
  systemPermissions?: RolePermission[];
  businessPermissions?: RolePermission[];
  users?: RoleUser[];
}

export interface RoleDetail {
  id: string;
  name: string;
  isDefault: boolean;
  description?: string;
  permissions?: { ROWID: string; permission_name: string; description?: string }[];
  systemPermissions?: RolePermission[];
  businessPermissions?: RolePermission[];
}

export interface RolesListResponse {
  roles: Role[];
  total: number;
}

// ---------------------------------------------------------------------------
// API Slice
// ---------------------------------------------------------------------------

export const rolesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * GET /roles/getAll — list roles (add isDetailed=true to include permissions & users)
     */
    getAllRoles: builder.query<Role[], { isDetailed?: boolean; search?: string } | void>({
      query: (params) => ({
        url: '/roles/getAll',
        params: params
          ? {
              isDetailed: params.isDetailed ? 'true' : undefined,
              search: params.search || undefined,
            }
          : undefined,
      }),
      transformResponse: (response: any) => {
        const data = response?.data ?? response;
        return data?.roles ?? data ?? [];
      },
      providesTags: (result) =>
        Array.isArray(result)
          ? [
              ...result.map((r) => ({ type: 'Role' as const, id: r.id })),
              { type: 'Role', id: 'LIST' },
            ]
          : [{ type: 'Role', id: 'LIST' }],
    }),

    /**
     * GET /roles/getOneRole/:id — get single role with its permissions
     */
    getRoleById: builder.query<RoleDetail, string>({
      query: (id) => `/roles/getOneRole/${id}`,
      transformResponse: (response: any) => response?.data ?? response,
      providesTags: (_result, _error, id) => [{ type: 'Role', id }],
    }),

    /**
     * POST /roles — create role (name, isDefault)
     */
    createRole: builder.mutation<
      { id: string; name: string; isDefault: boolean },
      { name: string; isDefault?: boolean }
    >({
      query: (body) => ({
        url: '/roles',
        method: 'POST',
        body,
      }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: [{ type: 'Role', id: 'LIST' }],
    }),

    /**
     * POST /roles/permissions — create role WITH permissions in one shot
     * Body: { roleName, permission: [{ name, children? }] }
     */
    createRoleWithPermissions: builder.mutation<
      { message: string; role: { id: string; name: string } },
      { roleName: string; permission: { name: string }[] }
    >({
      query: (body) => ({
        url: '/roles/permissions',
        method: 'POST',
        body,
      }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: [{ type: 'Role', id: 'LIST' }],
    }),

    /**
     * PUT /roles/:id — update role name and/or permissions
     * Body: { name?, permission?: [{ name }] }
     */
    updateRole: builder.mutation<
      { message: string },
      { id: string; body: { name?: string; permission?: { name: string }[] } }
    >({
      query: ({ id, body }) => ({
        url: `/roles/${id}`,
        method: 'PUT',
        body,
      }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Role', id },
        { type: 'Role', id: 'LIST' },
      ],
    }),

    /**
     * POST /roles/:roleId/mapPermissions
     * Body: { permissionNames: string[] }
     */
    mapPermissionsToRole: builder.mutation<
      { message: string; added: number },
      { roleId: string; permissionNames: string[] }
    >({
      query: ({ roleId, permissionNames }) => ({
        url: `/roles/${roleId}/mapPermissions`,
        method: 'POST',
        body: { permissionNames },
      }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: (_result, _error, { roleId }) => [
        { type: 'Role', id: roleId },
        { type: 'Role', id: 'LIST' },
      ],
    }),

    /**
     * DELETE /roles/:id — soft delete (reassigns users to CONTRIBUTOR, then hard deletes)
     */
    deleteRole: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/roles/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: [{ type: 'Role', id: 'LIST' }],
    }),

    /**
     * POST /roles/:id/restore — not supported by backend schema, will error
     */
    restoreRole: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/roles/${id}/restore`,
        method: 'POST',
      }),
      transformResponse: (response: any) => response?.data ?? response,
      invalidatesTags: [{ type: 'Role', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetAllRolesQuery,
  useGetRoleByIdQuery,
  useCreateRoleMutation,
  useCreateRoleWithPermissionsMutation,
  useUpdateRoleMutation,
  useMapPermissionsToRoleMutation,
  useDeleteRoleMutation,
  useRestoreRoleMutation,
  useLazyGetRoleByIdQuery,
} = rolesApi;
