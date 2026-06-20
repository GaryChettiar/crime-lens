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
}

export interface UpdateUploadPathPayload {
  uploadPath: string;
}

// ---------------------------------------------------------------------------
// API Slice
// ---------------------------------------------------------------------------

export const configurationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getConfigurations: builder.query<ConfigurationItem[], void>({
      query: () => '/configurations',
      transformResponse: (response: any) => response.data ?? response,
      providesTags: [{ type: 'Configuration', id: 'LIST' }],
    }),

    getConfigurationByName: builder.query<Record<string, any>, string>({
      query: (name) => `/configurations/${encodeURIComponent(name)}`,
      transformResponse: (response: any) => response.data ?? response,
      providesTags: (_result, _error, name) => [{ type: 'Configuration', id: name }],
    }),

    updateConfigurations: builder.mutation<{ message: string }, UpdateConfigurationPayload>({
      query: (body) => ({
        url: '/configurations',
        method: 'PUT',
        body,
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
