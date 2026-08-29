import { baseApi } from './baseApi';

export type EntityReportType = 'crime' | 'criminal' | 'officer';

export interface EntityReportRequest {
  entity: EntityReportType;
  id: string;
}

export const entityReportsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    downloadEntityReport: builder.mutation<Blob, EntityReportRequest>({
      query: ({ entity, id }) => ({
        url: '/reports',
        params: { entity, id },
        responseHandler: (response) => response.blob(),
      }),
    }),
  }),
});

export const { useDownloadEntityReportMutation } = entityReportsApi;
