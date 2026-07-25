import { baseApi } from './baseApi';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Efir {
  firId: string; // Maps to database ROWID (or fir_number)
  complainantName: string;
  phone: string;
  district: string;
  policeStation: string;
  incidentType: string;
  incidentDate: string;
  description: string;
  evidenceUrls: string[];
  status: "submitted" | "under_review" | "approved" | "rejected" | "assigned";
  assignedOfficerId: string | null;
  officerNotes?: string;
  timeline: Array<{
    date: string;
    event: string;
    details: string;
  }>;
}

// Helpers to encode/decode rich description JSON
const decodeEfir = (s: any): Efir => {
  let description = s.incident_description || '';
  let incidentType = 'theft';
  let incidentDate = s.createdAt || '';
  let evidenceUrls: string[] = [];
  let officerNotes = '';
  let timeline = [
    {
      date: s.createdAt || new Date().toISOString().replace('T', ' ').slice(0, 16),
      event: 'Citizen Submission',
      details: 'E-FIR submitted online by citizen.',
    },
  ];

  if (s.incident_description && s.incident_description.startsWith('{')) {
    try {
      const parsed = JSON.parse(s.incident_description);
      description = parsed.description || '';
      incidentType = parsed.incidentType || 'theft';
      incidentDate = parsed.incidentDate || s.createdAt || '';
      evidenceUrls = parsed.evidenceUrls || [];
      officerNotes = parsed.officerNotes || '';
      timeline = parsed.timeline || timeline;
    } catch {
      // Ignore parse failure
    }
  }

  return {
    firId: s.ROWID || s.id,
    complainantName: s.complainant_name || 'Anonymous',
    phone: s.complainant_phone || '',
    district: s.district_id || 'Bangalore Urban',
    policeStation: s.police_station_id || 'Central Police Station',
    incidentType: incidentType,
    incidentDate: incidentDate,
    description: description,
    evidenceUrls: evidenceUrls,
    status: s.fir_status || 'submitted',
    assignedOfficerId: s.assigned_officer_id || null,
    officerNotes: officerNotes,
    timeline: timeline,
  };
};

const encodeDescription = (payload: any, existingTimeline?: any[]) => {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 16);
  return JSON.stringify({
    description: payload.description || '',
    incidentType: payload.incidentType || 'theft',
    incidentDate: payload.incidentDate || timestamp.slice(0, 10),
    evidenceUrls: payload.evidenceUrls || [],
    officerNotes: payload.officerNotes || '',
    timeline: existingTimeline || [
      { date: timestamp, event: 'Citizen Submission', details: 'E-FIR submitted online by citizen.' }
    ],
  });
};

// ---------------------------------------------------------------------------
// API Slice
// ---------------------------------------------------------------------------

export const efirApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getEfirs: builder.query<Efir[], { districtId?: string; stationId?: string } | void>({
      query: (params) => ({
        url: '/firs/getAll',
        params: params || undefined,
      }),
      transformResponse: (response: any) => {
        const list = response.data ?? response ?? [];
        return list.map(decodeEfir);
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((e) => ({ type: 'FIR' as const, id: e.firId })),
              { type: 'FIR', id: 'LIST' },
            ]
          : [{ type: 'FIR', id: 'LIST' }],
    }),

    getEfirById: builder.query<Efir, string>({
      query: (firId) => `/firs/${firId}`,
      transformResponse: (response: any) => {
        const s = response.data ?? response;
        return decodeEfir(s);
      },
      providesTags: (_result, _error, firId) => [{ type: 'FIR', id: firId }],
    }),

    createEfir: builder.mutation<Efir, Partial<Efir>>({
      query: (payload) => ({
        url: '/firs',
        method: 'POST',
        body: {
          complainant_name: payload.complainantName,
          complainant_phone: payload.phone,
          district_id: payload.district,
          police_station_id: payload.policeStation,
          fir_status: 'submitted',
          incident_description: encodeDescription(payload),
        },
      }),
      transformResponse: (response: any) => {
        const s = response.data ?? response;
        return decodeEfir(s);
      },
      invalidatesTags: [{ type: 'FIR', id: 'LIST' }],
    }),

    updateEfirStatus: builder.mutation<
      Efir,
      { firId: string; status: Efir['status']; officerNotes?: string; assignedOfficerId?: string | null }
    >({
      query: ({ firId, status, officerNotes, assignedOfficerId }) => {
        // Prepare target timeline
        const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 16);
        const timeline = [
          { date: timestamp, event: 'Status Update', details: `Status changed to ${status}.` }
        ];

        return {
          url: `/firs/${firId}`,
          method: 'PUT',
          body: {
            fir_status: status,
            assigned_officer_id: assignedOfficerId,
            incident_description: JSON.stringify({
              description: '',
              incidentType: 'theft',
              incidentDate: timestamp.slice(0, 10),
              evidenceUrls: [],
              officerNotes: officerNotes || '',
              timeline: timeline
            }),
          },
        };
      },
      transformResponse: (response: any) => {
        const s = response.data ?? response;
        return decodeEfir(s);
      },
      invalidatesTags: (_result, _error, { firId }) => [
        { type: 'FIR', id: firId },
        { type: 'FIR', id: 'LIST' },
      ],
    }),

    uploadEfirEvidence: builder.mutation<Efir, { firId: string; fileUrl: string }>({
      query: ({ firId, fileUrl }) => {
        const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 16);
        const timeline = [
          { date: timestamp, event: 'Evidence Upload', details: `New evidence file added: ${fileUrl}` }
        ];

        return {
          url: `/firs/${firId}`,
          method: 'PUT',
          body: {
            incident_description: JSON.stringify({
              description: '',
              incidentType: 'theft',
              incidentDate: timestamp.slice(0, 10),
              evidenceUrls: [fileUrl],
              officerNotes: '',
              timeline: timeline
            }),
          },
        };
      },
      transformResponse: (response: any) => {
        const s = response.data ?? response;
        return decodeEfir(s);
      },
      invalidatesTags: (_result, _error, { firId }) => [
        { type: 'FIR', id: firId },
        { type: 'FIR', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetEfirsQuery,
  useGetEfirByIdQuery,
  useCreateEfirMutation,
  useUpdateEfirStatusMutation,
  useUploadEfirEvidenceMutation,
} = efirApi;
