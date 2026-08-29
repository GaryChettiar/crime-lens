import { baseApi } from './baseApi';

export type EntityReportType = 'crime' | 'criminal' | 'officer';

export interface EntityReportRequest {
  entity: EntityReportType;
  id: string;
}

export function downloadEntityReportPdf(pdf: Blob, entity: EntityReportType) {
  const pdfUrl = URL.createObjectURL(pdf);
  const link = document.createElement('a');
  link.href = pdfUrl;
  link.download = `${entity}-report.pdf`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 60_000);
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
