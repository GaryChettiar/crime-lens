import { baseApi } from './baseApi';

/**
 * Report API — Report generation and management endpoints.
 */
export const reportApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getReports: builder.query<Report[], ReportFilters | void>({
      query: (filters) => ({
        url: '/reports',
        params: filters ?? undefined,
      }),
      providesTags: ['Report'],
    }),

    getReportById: builder.query<ReportDetail, string>({
      query: (id) => `/reports/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Report', id }],
    }),

    generateReport: builder.mutation<Report, GenerateReportRequest>({
      query: (body) => ({
        url: '/reports/generate',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Report'],
    }),

    exportReport: builder.mutation<Blob, { id: string; format: ExportFormat }>({
      query: ({ id, format }) => ({
        url: `/reports/${id}/export`,
        params: { format },
        responseHandler: (response) => response.blob(),
      }),
    }),
  }),
});

export const {
  useGetReportsQuery,
  useGetReportByIdQuery,
  useGenerateReportMutation,
  useExportReportMutation,
} = reportApi;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Report {
  id: string;
  title: string;
  type: ReportType;
  status: 'draft' | 'generating' | 'ready' | 'archived';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  summary: string;
}

export interface ReportDetail extends Report {
  sections: ReportSection[];
  charts: ReportChart[];
  filters: Record<string, unknown>;
}

export interface ReportSection {
  id: string;
  title: string;
  content: string;
  order: number;
}

export interface ReportChart {
  id: string;
  type: 'bar' | 'line' | 'pie' | 'area' | 'scatter';
  title: string;
  data: Record<string, unknown>[];
  config: Record<string, unknown>;
}

export type ReportType =
  | 'crime-summary'
  | 'risk-assessment'
  | 'hotspot-analysis'
  | 'network-analysis'
  | 'trend-report'
  | 'custom';

export type ExportFormat = 'pdf' | 'csv' | 'xlsx' | 'json';

export interface ReportFilters {
  type?: ReportType;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface GenerateReportRequest {
  title: string;
  type: ReportType;
  filters: Record<string, unknown>;
  sections?: string[];
}
