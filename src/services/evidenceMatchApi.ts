import { baseApi } from './baseApi';

export interface EvidenceMatchRecord {
  ROWID?: string;
  id?: string;
  source_evidence_id: string;
  matched_evidence_id: string;
  evidence_type: string;
  confidence?: number | string | null;
  verified?: boolean;
  status?: 'pending' | 'approved' | 'rejected';
}

export interface CreateEvidenceMatchRequest {
  source_evidence_id: string;
  matched_evidence_id: string;
  evidence_type: string;
  confidence?: number | string | null;
  verified?: boolean;
  status?: 'pending' | 'approved' | 'rejected';
}

export const evidenceMatchApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEvidenceMatchesBySourceEvidence: builder.query<EvidenceMatchRecord[], string>({
      query: (sourceEvidenceId) => `/evidence-matches/source/${sourceEvidenceId}`,
      providesTags: (result, _error, sourceEvidenceId) => [
        { type: 'EvidenceMatch', id: sourceEvidenceId },
        ...(result ?? []).map((match) => ({ type: 'EvidenceMatch' as const, id: match.ROWID ?? match.id ?? sourceEvidenceId })),
      ],
    }),

    createEvidenceMatch: builder.mutation<EvidenceMatchRecord, CreateEvidenceMatchRequest>({
      query: (body) => ({
        url: '/evidence-matches',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['EvidenceMatch'],
    }),

    updateEvidenceMatch: builder.mutation<{ message: string }, { id: string; body: Partial<EvidenceMatchRecord> }>({
      query: ({ id, body }) => ({
        url: `/evidence-matches/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'EvidenceMatch', id }],
    }),
  }),
});

export const {
  useGetEvidenceMatchesBySourceEvidenceQuery,
  useCreateEvidenceMatchMutation,
  useUpdateEvidenceMatchMutation,
} = evidenceMatchApi;
