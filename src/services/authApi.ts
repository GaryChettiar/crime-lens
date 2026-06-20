import { baseApi } from './baseApi';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// API Slice
// ---------------------------------------------------------------------------

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Get the currently authenticated user.
     * Pings the users endpoint to verify the Catalyst session cookie is active.
     * Constructs user profile from the first returned user record.
     * TODO: Replace with dedicated /users/me endpoint when backend provides one.
     */
    getCurrentUser: builder.query<AuthUser, void>({
      query: () => '/users/getAll?limit=1',
      transformResponse: (response: any) => {
        // Try to extract the actual authenticated user from the response
        const users = response?.data?.users ?? response?.users ?? [];
        if (users.length > 0) {
          const u = users[0];
          const info = u.userInfo ?? u;
          const roleNames = (u.roles ?? info.roleDetails ?? []);
          const primaryRole = roleNames[0]?.name ?? 'user';
          return {
            id: u.id ?? info.id ?? 'catalyst-session',
            email: info.email ?? 'user@crimelens.gov.in',
            name: info.name ?? 'CrimeLens User',
            role: primaryRole,
            department: info.department ?? '',
            phone: info.phone ?? '',
            permissions: [],
            roles: roleNames,
          } as AuthUser;
        }
        // Fallback: session is valid but no user data extracted
        return {
          id: 'catalyst-session',
          email: 'user@crimelens.gov.in',
          name: 'CrimeLens User',
          role: 'admin',
          department: '',
          permissions: [],
          roles: [],
        } as AuthUser;
      },
      providesTags: ['Auth'],
    }),

    /**
     * Logout by redirecting to Catalyst auth login page.
     * This clears the session cookie on the server side.
     */
    logout: builder.mutation<void, void>({
      queryFn: () => {
        window.location.href = 'https://crimelens-60074096850.development.catalystserverless.in/__catalyst/auth/login';
        return { data: undefined };
      },
    }),
  }),
});

export const {
  useGetCurrentUserQuery,
  useLogoutMutation,
} = authApi;
