import { CATALYST_LOGIN_URL } from '@/config/auth';
import { signOutFromCatalyst } from './catalystAuth';
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
  /** Internal sys_user ROWID returned by GET /auth/me. */
  sysUserId?: string;
}

interface BackendAuthSession {
  user?: {
    id?: string | number;
    user_id?: string | number;
    zuid?: string | number;
    email_id?: string;
    first_name?: string;
    last_name?: string;
    role_details?: { role_id?: string | number; role_name?: string };
  };
  sys_user_id?: string | number | null;
  roles?: { id: string | number; name: string }[];
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /** Read the authenticated Catalyst user and its internal sys_user mapping. */
    getCurrentUser: builder.query<AuthUser, void>({
      async queryFn(_arg, _api, _extraOptions, baseQuery) {
        const result = await baseQuery({ url: '/auth/me', method: 'GET' });
        if (result.error) return { error: result.error };

        const session = (result.data as { data?: BackendAuthSession }).data;
        if (!session) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: 'The /auth/me response did not contain a session.',
            },
          };
        }
        const user = session.user;
        if (!user?.user_id && !user?.id && !user?.zuid) {
          return {
            error: {
              status: 'CUSTOM_ERROR',
              error: 'The authenticated user was not returned by /auth/me.',
            },
          };
        }

        const roles = session.roles?.map((role) => ({ id: String(role.id), name: role.name })) ?? [];
        const primaryRole = roles[0]?.name ?? user.role_details?.role_name ?? 'user';
        return {
          data: {
            id: String(user.user_id ?? user.id ?? user.zuid),
            sysUserId: session.sys_user_id ? String(session.sys_user_id) : undefined,
            email: user.email_id ?? '',
            name: [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email_id || 'CrimeLens User',
            role: primaryRole,
            permissions: [],
            roles,
          },
        };
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
