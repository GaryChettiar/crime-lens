import { baseApi } from './baseApi';
import {
  clearStoredAuthSession,
  getStoredAccessToken,
  getStoredRefreshToken,
  getStoredSessionId,
  setStoredAuthSession,
  type AuthSession,
} from './authStorage';
import { rolesApi } from './rolesApi';

export interface AuthUser {
  id: string;
  sysUserId?: string;
  email: string;
  name: string;
  role: string;
  department?: string;
  avatar?: string;
  phone?: string;
  permissions?: string[];
  roles?: { id: string; name: string }[];
  isOfficer?: boolean;
  stationId?: string | null;
  districtId?: string | null;
}

interface AuthMeUser {
  zuid?: string | number;
  user_id?: string | number;
  email_id?: string;
  first_name?: string;
  last_name?: string;
  role_details?: { role_id?: string | number; role_name?: string };
  roles?: Array<{
    id?: string | number;
    role_id?: string | number;
    name?: string;
    role_name?: string;
  }>;
  permissions?: string[];
}

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
}

function unwrapAuthPayload<T>(response: unknown): T {
  const payload = response as Record<string, any>;
  return (payload?.data ?? payload) as T;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthSession, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      transformResponse: (response: unknown) => unwrapAuthPayload<LoginResponse>(response),
      async onQueryStarted(_args, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          setStoredAuthSession(data);
        } catch {
          clearStoredAuthSession();
        }
      },
    }),
    refreshToken: builder.mutation<AuthSession, { sessionId: string; refreshToken: string }>({
      query: (payload) => ({
        url: '/auth/refresh',
        method: 'POST',
        body: payload,
      }),
      transformResponse: (response: unknown) => unwrapAuthPayload<LoginResponse>(response),
      async onQueryStarted(_args, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          setStoredAuthSession({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken ?? '',
            sessionId: data.sessionId ?? '',
          });
        } catch {
          clearStoredAuthSession();
        }
      },
    }),
    getCurrentUser: builder.query<AuthUser, void>({
      query: () => ({
        url: '/auth/me',
      }),
      transformResponse: (response: unknown) => {
        const payload = response as Record<string, any>;
        const responseData = payload?.data ?? payload;
        const user = responseData?.user ?? responseData;
        if (!user) {
          throw new Error('The authenticated user was not returned by /auth/me.');
        }

        const sysUserId = String(
          responseData?.sys_user_id ?? user?.sys_user_id ?? user?.user_id ?? user?.zuid ?? '',
        );

        const roles = (responseData.roles ?? [])
          .map((role: Record<string, any>) => ({
            id: String(role.role_id ?? role.id ?? ''),
            name: role.role_name ?? role.name ?? 'user',
          }))
          .filter((role: { id: string }) => Boolean(role.id));
        const catalystRole = user.role_details;

        if (roles.length === 0 && catalystRole?.role_id) {
          roles.push({
            id: String(catalystRole.role_id),
            name: catalystRole.role_name ?? 'user',
          });
        }

        const userInfo = responseData?.user_info;
        const isOfficer = Boolean(userInfo?.isOfficer);

        return {
          id: sysUserId,
          sysUserId,
          email: user.email_id ?? userInfo?.email ?? '',
          name: [user.first_name, user.last_name].filter(Boolean).join(' ')
            || [userInfo?.user_first_name, userInfo?.user_last_name].filter(Boolean).join(' ')
            || user.email_id
            || 'CrimeLens User',
          role: roles[0]?.name ?? catalystRole?.role_name ?? 'user',
          phone: userInfo?.phone,
          // Permissions are resolved from the role detail endpoint (/roles/getOneRole/:id).
          // Avoid relying on `user.permissions` from /auth/me which may be absent or incomplete.
          permissions: [],
          roles,
          isOfficer,
          stationId: isOfficer ? (userInfo?.station_id ?? null) : null,
          districtId: isOfficer ? (userInfo?.district_id ?? null) : null,
        };
      },
      async onQueryStarted(_args, { queryFulfilled, dispatch }) {
        try {
          const { data } = await queryFulfilled;
          const roleId = data?.roles?.[0]?.id;
          if (roleId) {
            dispatch(rolesApi.endpoints.getRoleById.initiate(roleId));
          }
        } catch (err: any) {
          // If the /auth/me request returned 403, attempt a token refresh
          const status = err?.error?.status ?? err?.status ?? err?.originalStatus;
          if (status === 403) {
            const refreshToken = getStoredRefreshToken();
            const sessionId = getStoredSessionId();
            if (refreshToken && sessionId) {
              try {
                // Trigger refresh and wait for it to complete
                await dispatch(
                  // use the injected endpoint to refresh
                  // @ts-ignore - authApi is being defined in this module
                  (authApi as any).endpoints.refreshToken.initiate({ sessionId, refreshToken }),
                ).unwrap();

                // After refreshing tokens, re-initiate the getCurrentUser fetch
                dispatch((authApi as any).endpoints.getCurrentUser.initiate());
                return;
              } catch (e) {
                // refresh failed — clear stored session below
              }
            }
          }

          // Any other errors (or failed refresh) should clear stored session
          clearStoredAuthSession();
        }
      },
      providesTags: ['Auth'],
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      async onQueryStarted(_args, { queryFulfilled }) {
        try {
          await queryFulfilled;
        } finally {
          clearStoredAuthSession();
        }
      },
    }),
  }),
});

export const { useLoginMutation, useRefreshTokenMutation, useGetCurrentUserQuery, useLazyGetCurrentUserQuery, useLogoutMutation } = authApi;

export function getAuthHeaders() {
  const token = getStoredAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getAuthSession() {
  const accessToken = getStoredAccessToken();
  const sessionId = getStoredSessionId();

  if (!accessToken || !sessionId) {
    return null;
  }

  return { accessToken, sessionId } as AuthSession;
}
