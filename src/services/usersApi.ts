import { baseApi } from './baseApi';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
  roleDetails?: { id: string; name: string }[];
}

export interface UserResponse {
  id: string;
  isArchived: boolean;
  userInfo: UserInfo;
  roles?: { id: string; name: string }[];
}

export interface PaginatedUsers {
  users: UserResponse[];
  total: number;
}

export interface InviteResponse {
  id: string;
  email: string;
  roleId: string;
  roleName?: string;
  status: 'pending' | 'accepted' | 'expired';
  invitedBy?: string;
  invitedAt?: string;
  expiresAt?: string;
}

// ---------------------------------------------------------------------------
// API Slice
// ---------------------------------------------------------------------------

export const usersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllUsers: builder.query<PaginatedUsers, { page?: number; limit?: number; status?: string }>({
      query: (params) => ({
        url: '/users/getAll',
        params: {
          page: params.page || 1,
          limit: params.limit || 10,
          status: params.status || 'GET_ALL',
        },
      }),
      transformResponse: (response: any) => response.data ?? response,
      providesTags: (result) =>
        result?.users
          ? [
              ...result.users.map((u) => ({ type: 'User' as const, id: u.id })),
              { type: 'User', id: 'LIST' },
            ]
          : [{ type: 'User', id: 'LIST' }],
    }),

    createUser: builder.mutation<UserResponse, { name: string; email: string; password?: string; phone?: string; roleIds?: string[] }>({
      query: (body) => ({
        url: '/users',
        method: 'POST',
        body,
      }),
      transformResponse: (response: any) => response.data ?? response,
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),

    updateUserRole: builder.mutation<{ message: string }, { email: string; roleName: string }>({
      query: (body) => ({
        url: '/users/role',
        method: 'PUT',
        body,
      }),
      transformResponse: (response: any) => response.data ?? response,
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),

    deactivateUser: builder.mutation<{ message: string }, string>({
      query: (email) => ({
        url: `/users/deactivate/${encodeURIComponent(email)}`,
        method: 'PATCH',
      }),
      transformResponse: (response: any) => response.data ?? response,
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),

    activateUser: builder.mutation<{ message: string }, string>({
      query: (email) => ({
        url: `/users/activate/${encodeURIComponent(email)}`,
        method: 'PATCH',
      }),
      transformResponse: (response: any) => response.data ?? response,
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),

    deleteUsers: builder.mutation<{ message: string }, string[]>({
      query: (emails) => ({
        url: '/users',
        method: 'DELETE',
        body: { emails },
      }),
      transformResponse: (response: any) => response.data ?? response,
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),

    // --- Invites ---

    inviteUser: builder.mutation<{ message: string }, { email: string; roleId: string }>({
      query: (body) => ({
        url: '/users/invites/invite',
        method: 'POST',
        body,
      }),
      transformResponse: (response: any) => response.data ?? response,
      invalidatesTags: ['Invite'],
    }),

    getInvites: builder.query<InviteResponse[], void>({
      query: () => '/users/invites/invites',
      transformResponse: (response: any) => response.data ?? response,
      providesTags: (result) =>
        result
          ? [
              ...result.map((inv) => ({ type: 'Invite' as const, id: inv.id })),
              { type: 'Invite', id: 'LIST' },
            ]
          : [{ type: 'Invite', id: 'LIST' }],
    }),

    reinviteUser: builder.mutation<{ message: string }, { email: string }>({
      query: (body) => ({
        url: '/users/invites/reinvite',
        method: 'POST',
        body,
      }),
      transformResponse: (response: any) => response.data ?? response,
      invalidatesTags: ['Invite'],
    }),

    onboardUser: builder.mutation<{ message: string }, { userInfoId: string; password: string }>({
      query: (body) => ({
        url: '/users/invites/invite/onboard',
        method: 'POST',
        body,
      }),
      transformResponse: (response: any) => response.data ?? response,
    }),
  }),
});

export const {
  useGetAllUsersQuery,
  useCreateUserMutation,
  useUpdateUserRoleMutation,
  useDeactivateUserMutation,
  useActivateUserMutation,
  useDeleteUsersMutation,
  useInviteUserMutation,
  useGetInvitesQuery,
  useReinviteUserMutation,
  useOnboardUserMutation,
} = usersApi;
