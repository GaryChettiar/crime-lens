import { baseApi } from './baseApi';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConfigurationItem {
  name: string;
  config: Record<string, any>;
}

export interface UpdateConfigurationPayload {
  name: string;
  config: Record<string, any>;
  email?: string;
}

export interface UpdateUploadPathPayload {
  uploadPath: string;
}

// ---------------------------------------------------------------------------
// API Slice
// ---------------------------------------------------------------------------

export const configurationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getConfigurations: builder.query<ConfigurationItem[], { email?: string } | void>({
      query: (params) => ({
        url: '/configurations',
        params: params?.email ? { email: params.email } : undefined,
      }),
      transformResponse: (response: any) => response.data ?? response,
      providesTags: [{ type: 'Configuration', id: 'LIST' }],
    }),

    getConfigurationByName: builder.query<Record<string, any>, string | { name: string; email?: string }>({
      query: (arg) => {
        const name = typeof arg === 'string' ? arg : arg.name;
        const email = typeof arg === 'object' ? arg.email : undefined;
        return {
          url: `/configurations/${encodeURIComponent(name)}`,
          // headers: email ? { 'x-user-email': email } : undefined,
          params: email ? { email } : undefined,
        };
      },
      transformResponse: (response: any) => response.data ?? response,
      providesTags: (_result, _error, arg) => [
        { type: 'Configuration', id: typeof arg === 'string' ? arg : arg.name },
      ],
    }),

    updateConfigurations: builder.mutation<{ message: string }, UpdateConfigurationPayload>({
      query: ({ name, config, email }) => ({
        url: '/configurations',
        method: 'PUT',
        // headers: email ? { 'x-user-email': email } : undefined,
        params: email ? { email } : undefined,
        body: { name, config },
      }),
      invalidatesTags: (_result, _error, { name }) => [
        { type: 'Configuration', id: name },
        { type: 'Configuration', id: 'LIST' },
      ],
    }),

    updateUploadPath: builder.mutation<{ message: string }, UpdateUploadPathPayload>({
      query: (body) => ({
        url: '/configurations/upload-path',
        method: 'PUT',
        body,
      }),
      invalidatesTags: [
        { type: 'Configuration', id: 'path' },
        { type: 'Configuration', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetConfigurationsQuery,
  useGetConfigurationByNameQuery,
  useUpdateConfigurationsMutation,
  useUpdateUploadPathMutation,
} = configurationsApi;
