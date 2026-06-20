import { baseApi } from './baseApi';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FirResponse {
  id: string;
  firNumber?: string;
  title?: string;
  description?: string;
  status?: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'assigned' | 'closed';
  complainantName?: string;
  complainantPhone?: string;
  incidentType?: string;
  incidentDate?: string;
  district?: string;
  policeStationId?: string;
  policeStationName?: string;
  assignedOfficerId?: string;
  assignedOfficerName?: string;
  crimeIds?: string[];
  evidenceUrls?: string[];
  officerNotes?: string;
  isArchived?: boolean;
  createdAt?: string;
  updatedAt?: string;
  timeline?: Array<{ date: string; event: string; details: string }>;
}

export interface CreateFirPayload {
  title?: string;
  description?: string;
  complainantName?: string;
  complainantPhone?: string;
  incidentType?: string;
  incidentDate?: string;
  district?: string;
  policeStationId?: string;
  evidenceUrls?: string[];
}

export interface UpdateFirPayload extends Partial<CreateFirPayload> {
  status?: FirResponse['status'];
  assignedOfficerId?: string;
  officerNotes?: string;
  crimeIds?: string[];
}

// Helpers to encode/decode rich description JSON
const encodeDescription = (payload: any) => {
  return JSON.stringify({
    description: payload.description || '',
    title: payload.title || 'Incident Complaint',
    incidentType: payload.incidentType || 'theft',
    incidentDate: payload.incidentDate || '',
    evidenceUrls: payload.evidenceUrls || [],
    officerNotes: payload.officerNotes || '',
    timeline: payload.timeline || [
      {
        date: new Date().toISOString().replace('T', ' ').slice(0, 16),
        event: 'Citizen Submission',
        details: 'E-FIR submitted online by citizen.',
      },
    ],
  });
};

const decodeFir = (s: any): FirResponse => {
  let description = s.incident_description || '';
  let title = 'Incident Complaint';
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
      title = parsed.title || 'Incident Complaint';
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
    id: s.ROWID || s.id,
    firNumber: s.fir_number || `EFIR-${s.ROWID}`,
    title: title,
    description: description,
    status: s.fir_status || 'submitted',
    complainantName: s.complainant_name,
    complainantPhone: s.complainant_phone,
    incidentType: incidentType,
    incidentDate: incidentDate,
    district: s.district_id,
    policeStationId: s.police_station_id,
    assignedOfficerId: s.assigned_officer_id,
    evidenceUrls: evidenceUrls,
    officerNotes: officerNotes,
    timeline: timeline,
    isArchived: s.is_archived === true || s.is_archived === 'true',
  };
};

// ---------------------------------------------------------------------------
// API Slice
// ---------------------------------------------------------------------------

export const firsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createFir: builder.mutation<{ data: FirResponse; message: string }, CreateFirPayload>({
      query: (body) => ({
        url: '/firs',
        method: 'POST',
        body: {
          complainant_name: body.complainantName,
          complainant_phone: body.complainantPhone,
          district_id: body.district,
          police_station_id: body.policeStationId,
          fir_status: 'submitted',
          incident_description: encodeDescription(body),
        },
      }),
      invalidatesTags: ['FIR'],
    }),

    getFirs: builder.query<FirResponse[], { status?: string; search?: string; district?: string } | void>({
      query: (params) => ({
        url: '/firs/getAll',
        params: params || undefined,
      }),
      transformResponse: (response: any) => {
        const list = response.data ?? response ?? [];
        return list.map(decodeFir);
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((f) => ({ type: 'FIR' as const, id: f.id })),
              { type: 'FIR', id: 'LIST' },
            ]
          : [{ type: 'FIR', id: 'LIST' }],
    }),

    getFirById: builder.query<FirResponse, string>({
      query: (id) => `/firs/${id}`,
      transformResponse: (response: any) => {
        const s = response.data ?? response;
        return decodeFir(s);
      },
      providesTags: (_result, _error, id) => [{ type: 'FIR', id }],
    }),

    updateFir: builder.mutation<{ data: FirResponse; message: string }, { id: string; body: UpdateFirPayload }>({
      query: ({ id, body }) => {
        // Prepare patch
        const patch: any = {};
        if (body.complainantName) patch.complainant_name = body.complainantName;
        if (body.complainantPhone) patch.complainant_phone = body.complainantPhone;
        if (body.district) patch.district_id = body.district;
        if (body.policeStationId) patch.police_station_id = body.policeStationId;
        if (body.status) patch.fir_status = body.status;
        if (body.assignedOfficerId !== undefined) patch.assigned_officer_id = body.assignedOfficerId;

        // If updating notes, description, etc. we need to carry forward or rewrite incident_description JSON
        if (body.description || body.title || body.incidentType || body.incidentDate || body.evidenceUrls || body.officerNotes) {
          patch.incident_description = encodeDescription(body);
        }

        return {
          url: `/firs/${id}`,
          method: 'PUT',
          body: patch,
        };
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'FIR', id },
        { type: 'FIR', id: 'LIST' },
      ],
    }),

    deleteFir: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/firs/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['FIR'],
    }),
  }),
});

export const {
  useCreateFirMutation,
  useGetFirsQuery,
  useGetFirByIdQuery,
  useUpdateFirMutation,
  useDeleteFirMutation,
} = firsApi;
