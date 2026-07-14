import { baseApi } from './baseApi';
import { generateMockIncidents } from '@/features/geospatial/data/mockGeospatialData';
import type { CrimeIncident } from '@/features/geospatial/types/geospatial';
import type { CrimeQuery, PaginatedResponse } from '@/types/pagination';

const incidentsData = generateMockIncidents();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CrimeStatus =
  | 'reported'
  | 'under_investigation'
  | 'suspects_identified'
  | 'evidence_collected'
  | 'charge_sheet_filed'
  | 'closed';

export type EvidenceType =
  | 'photo'
  | 'video'
  | 'audio'
  | 'weapon'
  | 'document'
  | 'fingerprint'
  | 'dna'
  | 'blood_sample'
  | 'vehicle'
  | 'mobile_phone'
  | 'laptop'
  | 'email'
  | 'chat_screenshot'
  | 'transaction_receipt'
  | 'cctv_footage'
  | 'gps_log'
  | 'ip_log'
  | 'browser_history'
  | 'apk'
  | 'malware_sample'
  | 'other';

export type SuspectStatus = 'detained' | 'released' | 'wanted' | 'under_watch' | 'promoted';

export interface CrimeRecord {
  id: string;
  crimeNumber: string;
  caseNumber?: string; // backwards compatibility
  title: string;
  description?: string;
  crimeCategory: string;
  status: CrimeStatus;
  incidentDate?: string;
  crimeLocation?: string;
  location?: {
    address?: string;
    district?: string;
    coordinates?: [number, number];
  };
  district?: string;
  weaponUsed?: string;
  assignedOfficerId?: string;
  assignedOfficerName?: string;
  assignedStationId?: string;
  assignedStationName?: string;
  createdBy?: string;
  victimCount?: number;
  suspectCount?: number;
  evidenceCount?: number;
  legalSectionsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CrimeSuspect {
  id: string;
  crimeId: string;
  name: string;
  age?: number;
  gender?: string;
  phone?: string;
  address?: string;
  district?: string;
  knownAlias?: string;
  reasonForSuspicion?: string;
  notes?: string;
  photoUrl?: string;
  status: SuspectStatus;
  linkedEvidenceCount?: number;
  createdAt?: string;
  promotedToCriminalId?: string;
}

export interface CrimeEvidence {
  id: string;
  crimeId: string;
  evidenceNumber: string;
  evidenceType: EvidenceType;
  description?: string;
  collectedBy?: string;
  collectedDate?: string;
  collectionLocation?: string;
  fileUrl?: string;
  fileName?: string;
  fileMimeType?: string;
  fileSize?: number;
  hash?: string;
  storagePath?: string;
  remarks?: string;
  uploadedBy?: string;
  chainOfCustodyStatus: 'intact' | 'reviewed' | 'disputed';
  verificationStatus: 'pending' | 'verified' | 'rejected';
  createdAt?: string;
}

export interface CrimeLegalSection {
  id: string;
  crimeId: string;
  act: string;
  section: string;
  title: string;
  severity: 'minor' | 'moderate' | 'serious' | 'grievous';
  isBailable: boolean;
  isCognizable: boolean;
  punishment?: string;
  addedAt?: string;
  addedBy?: string;
}

export interface CrimeTimelineEvent {
  id: string;
  crimeId: string;
  eventType:
    | 'crime_registered'
    | 'officer_assigned'
    | 'evidence_uploaded'
    | 'suspect_added'
    | 'status_updated'
    | 'charge_sheet_filed'
    | 'note_added'
    | 'legal_section_added'
    | 'suspect_promoted';
  title: string;
  description?: string;
  actor?: string;
  occurredAt: string;
}

export interface CrimeActivityLog {
  id: string;
  crimeId: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  details?: string;
}

export interface CreateCrimePayload {
  title: string;
  crimeCategory: string;
  description?: string;
  incidentDate?: string;
  crimeLocation?: string;
  district?: string;
  weaponUsed?: string;
  assignedOfficerId?: string;
  assignedStationId?: string;
  location?: CrimeRecord['location'];
  category?: string;
  policeStationId?: string;
  criminalIds?: string[];
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface UpdateCrimePayload extends Partial<CreateCrimePayload> {
  status?: CrimeStatus;
}

/**
 * @deprecated Use CrimeQuery from '@/types/pagination' instead.
 * Kept for any legacy callers still using the old shape.
 */
export interface CrimeFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  district?: string;
  crimeCategory?: string;
  category?: string;
  severity?: string;
  officer?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateSuspectPayload {
  name: string;
  gender?: string;
  dob?: string;
  phone?: string;
  address?: string;
  district?: string;
  knownAlias?: string;
  reasonForSuspicion?: string;
  notes?: string;
  photoUrl?: string;
}

export interface CreateEvidencePayload {
  evidenceType: EvidenceType;
  description?: string;
  collectedBy?: string;
  collectedDate?: string;
  collectionLocation?: string;
  remarks?: string;
}

export interface CreateLegalSectionPayload {
  act: string;
  section: string;
  title: string;
  severity: CrimeLegalSection['severity'];
  isBailable: boolean;
  isCognizable: boolean;
  punishment?: string;
}

export interface CrimeCategory {
  id: string;
  name: string;
  count: number;
  color?: string;
}

export interface TrendFilters {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  category?: string;
  district?: string;
  startDate?: string;
  endDate?: string;
}

export interface TrendData {
  period: string;
  count: number;
  category: string;
  changePercent: number;
}

// Helpers to encode/decode
const decodeCrime = (c: any): CrimeRecord => {
  const coordinates: [number, number] = [
    c.crime_location_latitude ? parseFloat(c.crime_location_latitude) : 0,
    c.crime_location_longitude ? parseFloat(c.crime_location_longitude) : 0,
  ];

  return {
    id: c.ROWID || c.id,
    crimeNumber: c.crime_number || `CRIME-${String(c.ROWID || c.id).padStart(6, '0')}`,
    caseNumber: c.crime_number || `CRIME-${String(c.ROWID || c.id).padStart(6, '0')}`,
    title: c.title || 'Untitled Crime Incident',
    description: c.description || '',
    crimeCategory: c.crime_category || c.category || 'General',
    status: (c.status as CrimeStatus) || 'under_investigation',
    incidentDate: c.crime_occured_date_time || c.incident_date || c.createdAt,
    crimeLocation: c.crime_location || c.location || '',
    location: {
      address: c.address || '',
      district: c.crime_happended_at_district_id || '',
      coordinates: coordinates,
    },
    district: c.crime_happended_at_district_id || c.district || '',
    weaponUsed: c.weapon_used || '',
    assignedOfficerId: c.assigned_officer_id,
    assignedOfficerName: c.assigned_officer_name,
    assignedStationId: c.police_station_id,
    assignedStationName: c.police_station_name,
    createdBy: c.created_by || c.createdBy,
    victimCount: c.victim_count ?? 0,
    suspectCount: c.suspect_count ?? 0,
    evidenceCount: c.evidence_count ?? 0,
    legalSectionsCount: c.legal_sections_count ?? 0,
    createdAt: c.createdAt || c.created_at,
    updatedAt: c.updatedAt || c.updated_at,
  };
};

const decodeEvidence = (e: any): CrimeEvidence => ({
  id: e.ROWID || e.id,
  crimeId: e.crime_id || e.incident_id,
  evidenceNumber: e.evidence_number || `EV-${String(e.ROWID || e.id).padStart(4, '0')}`,
  evidenceType: (e.evidence_type as EvidenceType) || 'other',
  description: e.description,
  collectedBy: e.collected_by || e.uploaded_by,
  collectedDate: e.collected_date || e.createdAt,
  collectionLocation: e.collection_location,
  fileUrl: e.file_url,
  fileName: e.file_name || e.file_url?.split('/').pop() || 'file',
  fileMimeType: e.file_mime_type || 'application/octet-stream',
  fileSize: e.file_size || 0,
  hash: e.hash,
  storagePath: e.storage_path,
  remarks: e.remarks,
  uploadedBy: e.uploaded_by,
  chainOfCustodyStatus: e.chain_of_custody_status || 'intact',
  verificationStatus: e.verification_status || 'verified',
  createdAt: e.createdAt || e.created_at,
});

// Local Storage Helper
const getLocalData = <T>(key: string): T[] => {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : [];
  } catch {
    return [];
  }
};

const setLocalData = <T>(key: string, data: T[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Local storage write failed', err);
  }
};

// ---------------------------------------------------------------------------
// API Slice
// ---------------------------------------------------------------------------

export const crimeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCrimes: builder.query<PaginatedResponse<CrimeRecord>, CrimeQuery | void>({
      query: (params) => ({
        url: '/crimes',
        params: params
          ? {
              page: params.page,
              pageSize: params.pageSize,
              search: params.search || undefined,
              districtId: params.districtId || undefined,
              stationId: params.stationId || undefined,
              categoryId: params.categoryId || undefined,
              status: params.status || undefined,
              date: params.date || undefined,
              from: params.from || undefined,
              to: params.to || undefined,
              sortBy: params.sortBy || undefined,
              sortOrder: params.sortOrder || undefined,
            }
          : undefined,
      }),
      // Per-page cache keys: crimes?page=1, crimes?page=2, etc.
      serializeQueryArgs: ({ queryArgs }) => {
        if (!queryArgs) return 'crimes-all';
        const { page, pageSize, search, districtId, stationId, categoryId, status, date, from, to, sortBy, sortOrder } = queryArgs;
        return JSON.stringify({ page, pageSize, search, districtId, stationId, categoryId, status, date, from, to, sortBy, sortOrder });
      },
      transformResponse: (response: any): PaginatedResponse<CrimeRecord> => {
        // Backend returns: { success: true, data: { data: [...], pagination: { ... } } }
        const nestedData = response?.data ?? response;
        const rawList = Array.isArray(nestedData?.data)
          ? nestedData.data
          : (Array.isArray(nestedData) ? nestedData : []);
        const pagination = nestedData?.pagination ?? {
          page: 1,
          pageSize: 20,
          totalRecords: rawList.length,
          totalPages: 1,
          hasNext: false,
          hasPrevious: false,
        };
        return {
          data: rawList.map(decodeCrime),
          pagination,
        };
      },
      providesTags: (result, _error, queryArgs) => {
        const page = (queryArgs as CrimeQuery)?.page ?? 1;
        const tags: Array<{ type: 'Crime'; id: string }> = [
          { type: 'Crime', id: 'LIST' },
          { type: 'Crime', id: `PAGE_${page}` },
        ];
        if (result) {
          result.data.forEach((c) => tags.push({ type: 'Crime', id: c.id }));
        }
        return tags;
      },
    }),

    getCrimeById: builder.query<CrimeRecord, string>({
      query: (id) => `/crimes/getOneCrime/${id}`,
      transformResponse: (response: any) => {
        const c = response.data ?? response;
        return decodeCrime(c);
      },
      providesTags: (_result, _error, id) => [{ type: 'Crime', id }],
    }),

    createCrime: builder.mutation<{ data: CrimeRecord; message: string }, CreateCrimePayload>({
      query: (body) => ({
        url: '/crimes',
        method: 'POST',
        body: {
          title: body.title,
          description: body.description,
          crime_category_id: body.crimeCategory || body.category,
          police_station_id: body.assignedStationId || body.policeStationId,
          crime_happended_at_district_id: body.district || body.location?.district,
          crime_location_latitude: body.location?.coordinates?.[0],
          crime_location_longitude: body.location?.coordinates?.[1],
          status: 'under_investigation',
          crime_occured_date_time: body.incidentDate || new Date().toISOString().replace('T', ' ').slice(0, 16),
          criminal_ids: body.criminalIds,
        },
      }),
      invalidatesTags: [{ type: 'Crime', id: 'LIST' }],
    }),

    updateCrime: builder.mutation<{ data: CrimeRecord; message: string }, { id: string; body: UpdateCrimePayload }>({
      query: ({ id, body }) => ({
        url: `/crimes/${id}`,
        method: 'PUT',
        body: {
          title: body.title,
          description: body.description,
          crime_category_id: body.crimeCategory || body.category,
          police_station_id: body.assignedStationId || body.policeStationId,
          crime_happended_at_district_id: body.district || body.location?.district,
          crime_location_latitude: body.location?.coordinates?.[0],
          crime_location_longitude: body.location?.coordinates?.[1],
          status: body.status,
        },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Crime', id },
        { type: 'Crime', id: 'LIST' },
      ],
    }),

    updateCrimeStatus: builder.mutation<
      { data: CrimeRecord; message: string },
      { id: string; status: CrimeStatus }
    >({
      query: ({ id, status }) => ({
        url: `/crimes/${id}`,
        method: 'PUT',
        body: { status },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Crime', id },
        { type: 'Crime', id: 'LIST' },
      ],
    }),

    deleteCrime: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/crimes/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Crime', id: 'LIST' }],
    }),

    // --- Suspects ---
    getCrimeSuspects: builder.query<CrimeSuspect[], string>({
      queryFn: (crimeId) => {
        const suspects = getLocalData<CrimeSuspect>(`crimes:${crimeId}:suspects`);
        return { data: suspects };
      },
      providesTags: (_result, _error, crimeId) => [{ type: 'CrimeSuspect', id: `crime-${crimeId}` }],
    }),

    addCrimeSuspect: builder.mutation<
      { data: CrimeSuspect; message: string },
      { crimeId: string; body: CreateSuspectPayload }
    >({
      queryFn: ({ crimeId, body }) => {
        const key = `crimes:${crimeId}:suspects`;
        const list = getLocalData<CrimeSuspect>(key);
        const newSuspect: CrimeSuspect = {
          id: `susp-${Date.now()}`,
          crimeId,
          name: body.name,
          age: body.dob ? new Date().getFullYear() - new Date(body.dob).getFullYear() : undefined,
          gender: body.gender,
          phone: body.phone,
          address: body.address,
          district: body.district,
          knownAlias: body.knownAlias,
          reasonForSuspicion: body.reasonForSuspicion,
          notes: body.notes,
          photoUrl: body.photoUrl,
          status: 'under_watch',
          linkedEvidenceCount: 0,
          createdAt: new Date().toISOString(),
        };
        list.push(newSuspect);
        setLocalData(key, list);
        return { data: { data: newSuspect, message: 'Suspect added' } };
      },
      invalidatesTags: (_result, _error, { crimeId }) => [
        { type: 'CrimeSuspect', id: `crime-${crimeId}` },
        { type: 'Crime', id: crimeId },
      ],
    }),

    updateCrimeSuspect: builder.mutation<
      { data: CrimeSuspect; message: string },
      { crimeId: string; suspectId: string; body: Partial<CreateSuspectPayload> & { status?: SuspectStatus } }
    >({
      queryFn: ({ crimeId, suspectId, body }) => {
        const key = `crimes:${crimeId}:suspects`;
        let list = getLocalData<CrimeSuspect>(key);
        let updated: CrimeSuspect | null = null;
        list = list.map((s) => {
          if (s.id === suspectId) {
            updated = { ...s, ...body };
            return updated;
          }
          return s;
        });
        if (!updated) return { error: { status: 404, statusText: 'Suspect not found', data: null } as any };
        setLocalData(key, list);
        return { data: { data: updated, message: 'Suspect updated' } };
      },
      invalidatesTags: (_result, _error, { crimeId }) => [
        { type: 'CrimeSuspect', id: `crime-${crimeId}` },
      ],
    }),

    removeCrimeSuspect: builder.mutation<{ message: string }, { crimeId: string; suspectId: string }>({
      queryFn: ({ crimeId, suspectId }) => {
        const key = `crimes:${crimeId}:suspects`;
        const list = getLocalData<CrimeSuspect>(key).filter((s) => s.id !== suspectId);
        setLocalData(key, list);
        return { data: { message: 'Suspect removed' } };
      },
      invalidatesTags: (_result, _error, { crimeId }) => [
        { type: 'CrimeSuspect', id: `crime-${crimeId}` },
        { type: 'Crime', id: crimeId },
      ],
    }),

    promoteCrimeSuspectToCriminal: builder.mutation<
      { message: string; criminalId?: string },
      { crimeId: string; suspectId: string }
    >({
      queryFn: ({ crimeId, suspectId }) => {
        const key = `crimes:${crimeId}:suspects`;
        let list = getLocalData<CrimeSuspect>(key);
        list = list.map((s) => {
          if (s.id === suspectId) return { ...s, status: 'promoted' as const };
          return s;
        });
        setLocalData(key, list);
        return { data: { message: 'Suspect promoted to Criminal Registry', criminalId: `crim-${Date.now()}` } };
      },
      invalidatesTags: (_result, _error, { crimeId }) => [
        { type: 'CrimeSuspect', id: `crime-${crimeId}` },
        { type: 'Criminal', id: 'LIST' },
      ],
    }),

    // --- Evidence (Real DB storage mapped inside getOneCrime!) ---
    getCrimeEvidence: builder.query<CrimeEvidence[], string>({
      queryFn: async (crimeId, _queryApi, _extraOptions, baseQuery) => {
        try {
          const result = await baseQuery(`/crimes/getOneCrime/${crimeId}`);
          if (result.error) return { error: result.error as any };
          const data: any = result.data;
          const incident = data?.data ?? data;
          const evList = incident?.evidences || [];
          return { data: evList.map(decodeEvidence) };
        } catch (err: any) {
          return { error: { status: 500, statusText: err.message, data: err } as any };
        }
      },
      providesTags: (_result, _error, crimeId) => [{ type: 'CrimeEvidence', id: `crime-${crimeId}` }],
    }),

    uploadCrimeEvidence: builder.mutation<
      { data: CrimeEvidence; message: string },
      { crimeId: string; body: CreateEvidencePayload; file?: File }
    >({
      queryFn: async ({ crimeId, body, file }, _queryApi, _extraOptions, baseQuery) => {
        try {
          const getRes = await baseQuery(`/crimes/getOneCrime/${crimeId}`);
          if (getRes.error) return { error: getRes.error as any };
          const crime: any = (getRes.data as any)?.data ?? getRes.data;

          const fileUrl = file ? URL.createObjectURL(file) : undefined;
          const fileName = file?.name;
          const fileSize = file?.size;
          const fileMimeType = file?.type;

          const newEv = {
            evidence_type: body.evidenceType,
            description: body.description || '',
            uploaded_by: body.collectedBy || 'Officer',
            collected_by: body.collectedBy || 'Officer',
            collected_date: body.collectedDate || new Date().toISOString(),
            collection_location: body.collectionLocation || '',
            remarks: body.remarks || '',
            file_url: fileUrl,
            file_name: fileName || 'file',
            file_size: fileSize || 0,
            file_mime_type: fileMimeType || 'application/octet-stream',
            evidence_number: `EV-${Date.now().toString().slice(-4)}`,
            chain_of_custody_status: 'intact',
            verification_status: 'verified',
          };

          const updatedEvidences = [...(crime.evidences || []), newEv];

          const putRes = await baseQuery({
            url: `/crimes/${crimeId}`,
            method: 'PUT',
            body: {
              evidences: updatedEvidences,
            },
          });

          if (putRes.error) return { error: putRes.error as any };
          const createdDecoded = decodeEvidence(newEv);
          return { data: { data: createdDecoded, message: 'Evidence uploaded successfully' } };
        } catch (err: any) {
          return { error: { status: 500, statusText: err.message, data: err } as any };
        }
      },
      invalidatesTags: (_result, _error, { crimeId }) => [
        { type: 'CrimeEvidence', id: `crime-${crimeId}` },
        { type: 'Crime', id: crimeId },
      ],
    }),

    deleteCrimeEvidence: builder.mutation<{ message: string }, { crimeId: string; evidenceId: string }>({
      queryFn: async ({ crimeId, evidenceId }, _queryApi, _extraOptions, baseQuery) => {
        try {
          const getRes = await baseQuery(`/crimes/getOneCrime/${crimeId}`);
          if (getRes.error) return { error: getRes.error as any };
          const crime: any = (getRes.data as any)?.data ?? getRes.data;

          const updatedEvidences = (crime.evidences || []).filter(
            (e: any) => String(e.ROWID || e.id) !== String(evidenceId)
          );

          const putRes = await baseQuery({
            url: `/crimes/${crimeId}`,
            method: 'PUT',
            body: {
              evidences: updatedEvidences,
            },
          });

          if (putRes.error) return { error: putRes.error as any };
          return { data: { message: 'Evidence deleted successfully' } };
        } catch (err: any) {
          return { error: { status: 500, statusText: err.message, data: err } as any };
        }
      },
      invalidatesTags: (_result, _error, { crimeId }) => [
        { type: 'CrimeEvidence', id: `crime-${crimeId}` },
        { type: 'Crime', id: crimeId },
      ],
    }),

    // --- Legal Sections ---
    getCrimeLegalSections: builder.query<CrimeLegalSection[], string>({
      queryFn: (crimeId) => {
        const sections = getLocalData<CrimeLegalSection>(`crimes:${crimeId}:legal_sections`);
        return { data: sections };
      },
      providesTags: (_result, _error, crimeId) => [{ type: 'CrimeLegalSection', id: `crime-${crimeId}` }],
    }),

    addCrimeLegalSection: builder.mutation<
      { data: CrimeLegalSection; message: string },
      { crimeId: string; body: CreateLegalSectionPayload }
    >({
      queryFn: ({ crimeId, body }) => {
        const key = `crimes:${crimeId}:legal_sections`;
        const list = getLocalData<CrimeLegalSection>(key);
        const newSec: CrimeLegalSection = {
          id: `leg-${Date.now()}`,
          crimeId,
          act: body.act,
          section: body.section,
          title: body.title,
          severity: body.severity,
          isBailable: body.isBailable,
          isCognizable: body.isCognizable,
          punishment: body.punishment,
          addedAt: new Date().toISOString(),
          addedBy: 'Officer',
        };
        list.push(newSec);
        setLocalData(key, list);
        return { data: { data: newSec, message: 'Legal section added' } };
      },
      invalidatesTags: (_result, _error, { crimeId }) => [
        { type: 'CrimeLegalSection', id: `crime-${crimeId}` },
      ],
    }),

    removeCrimeLegalSection: builder.mutation<{ message: string }, { crimeId: string; sectionId: string }>({
      queryFn: ({ crimeId, sectionId }) => {
        const key = `crimes:${crimeId}:legal_sections`;
        const list = getLocalData<CrimeLegalSection>(key).filter((s) => s.id !== sectionId);
        setLocalData(key, list);
        return { data: { message: 'Legal section removed' } };
      },
      invalidatesTags: (_result, _error, { crimeId }) => [
        { type: 'CrimeLegalSection', id: `crime-${crimeId}` },
      ],
    }),

    // --- Timeline ---
    getCrimeTimeline: builder.query<CrimeTimelineEvent[], string>({
      queryFn: (crimeId) => {
        const key = `crimes:${crimeId}:timeline`;
        let list = getLocalData<CrimeTimelineEvent>(key);
        if (list.length === 0) {
          list = [
            {
              id: `time-init-${crimeId}`,
              crimeId,
              eventType: 'crime_registered',
              title: 'Incident Registered',
              description: 'Crime record initialized in CrimeLens.',
              actor: 'System',
              occurredAt: new Date(Date.now() - 3600000).toISOString(),
            },
          ];
        }
        return { data: list };
      },
      providesTags: (_result, _error, crimeId) => [{ type: 'CrimeActivity', id: `crime-${crimeId}` }],
    }),

    // --- Activity Log ---
    getCrimeActivity: builder.query<CrimeActivityLog[], string>({
      queryFn: (crimeId) => {
        const key = `crimes:${crimeId}:activity`;
        let list = getLocalData<CrimeActivityLog>(key);
        if (list.length === 0) {
          list = [
            {
              id: `act-init-${crimeId}`,
              crimeId,
              timestamp: new Date().toISOString(),
              user: 'System',
              action: 'LOGGED_INCIDENT',
              module: 'Crimes',
              details: 'Crime incident record created.',
            },
          ];
        }
        return { data: list };
      },
      providesTags: (_result, _error, crimeId) => [{ type: 'CrimeActivity', id: `crime-${crimeId}` }],
    }),

    getCrimeCategories: builder.query<CrimeCategory[], void>({
      queryFn: () => {
        return {
          data: [
            { id: 'cat-1', name: 'Theft', count: 12 },
            { id: 'cat-2', name: 'Cybercrime', count: 5 },
            { id: 'cat-3', name: 'Assault', count: 8 },
            { id: 'cat-4', name: 'Burglary', count: 3 },
            { id: 'cat-5', name: 'Narcotics', count: 9 },
            { id: 'cat-6', name: 'Homicide', count: 2 },
          ]
        };
      }
    }),

    getCrimeTrends: builder.query<TrendData[], TrendFilters>({
      queryFn: (filters) => {
        return {
          data: [
            { period: 'Jan', count: 120, category: filters.category || 'General', changePercent: 5.2 },
            { period: 'Feb', count: 135, category: filters.category || 'General', changePercent: 12.5 },
            { period: 'Mar', count: 110, category: filters.category || 'General', changePercent: -18.5 },
            { period: 'Apr', count: 145, category: filters.category || 'General', changePercent: 31.8 },
            { period: 'May', count: 160, category: filters.category || 'General', changePercent: 10.3 },
            { period: 'Jun', count: 155, category: filters.category || 'General', changePercent: -3.1 },
          ]
        };
      }
    }),

    getIncidents: builder.query<CrimeIncident[], void>({
      queryFn: () => {
        return { data: incidentsData };
      },
    }),
  }),
});

export const {
  useGetCrimesQuery,
  useGetCrimeByIdQuery,
  useCreateCrimeMutation,
  useUpdateCrimeMutation,
  useUpdateCrimeStatusMutation,
  useDeleteCrimeMutation,
  useGetCrimeSuspectsQuery,
  useAddCrimeSuspectMutation,
  useUpdateCrimeSuspectMutation,
  useRemoveCrimeSuspectMutation,
  usePromoteCrimeSuspectToCriminalMutation,
  useGetCrimeEvidenceQuery,
  useUploadCrimeEvidenceMutation,
  useDeleteCrimeEvidenceMutation,
  useGetCrimeLegalSectionsQuery,
  useAddCrimeLegalSectionMutation,
  useRemoveCrimeLegalSectionMutation,
  useGetCrimeTimelineQuery,
  useGetCrimeActivityQuery,
  useGetCrimeCategoriesQuery,
  useGetCrimeTrendsQuery,
  useGetIncidentsQuery,
} = crimeApi;
