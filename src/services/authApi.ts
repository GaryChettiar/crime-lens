import { CATALYST_LOGIN_URL } from '@/config/auth';
import { getCatalystCurrentUser, signOutFromCatalyst } from './catalystAuth';
import { baseApi } from './baseApi';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  department?: string;
  avatar?: string;
  phone?: string;
  permissions?: string[];
  roles?: { id: string; name: string }[];
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** Read the current user from the Catalyst session bound to this Slate app. */
    getCurrentUser: builder.query<AuthUser, void>({
      async queryFn() {
        try {
          const user = await getCatalystCurrentUser();
          const role = user.role_details?.role_name ?? 'user';
          return {
            data: {
              id: String(user.user_id ?? user.zuid),
              email: user.email_id ?? '',
              name: [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email_id || 'CrimeLens User',
              role,
              permissions: [],
              roles: user.role_details?.role_id
                ? [{ id: String(user.role_details.role_id), name: role }]
                : [],
            },
          };
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: error instanceof Error ? error.message : 'Unable to verify Catalyst session.',
            },
          };
        }
      },
      providesTags: ['Auth'],
    }),
    logout: builder.mutation<void, void>({
      async queryFn() {
        try {
          await signOutFromCatalyst(CATALYST_LOGIN_URL);
          return { data: undefined };
        } catch (error) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: error instanceof Error ? error.message : 'Unable to sign out from Catalyst.',
            },
          };
        }
      },
    }),
  }),
});

export const { useGetCurrentUserQuery, useLogoutMutation } = authApi;
