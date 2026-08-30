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

export interface CrimeAssignedOfficer {
  id: string;
  incidentId: string;
  officerId?: string;
  badgeNumber?: string;
  rank?: string;
  contactNumber?: string;
  stationId?: string;
  operationalStatus?: string;
  createdAt?: string;
}

const normalizeCrimeStatus = (status?: string): CrimeStatus => {
  const value = (status ?? '').toString().trim().toLowerCase();
  const statusMap: Record<string, CrimeStatus> = {
    reported: 'reported',
    under_investigation: 'under_investigation',
    'under investigation': 'under_investigation',
    suspects_identified: 'suspects_identified',
    'suspects identified': 'suspects_identified',
    evidence_collected: 'evidence_collected',
    'evidence collected': 'evidence_collected',
    charge_sheet_filed: 'charge_sheet_filed',
    'charge sheet filed': 'charge_sheet_filed',
    closed: 'closed',
  };

  const normalized = value.replace(/[^a-z_ ]/g, '').replace(/\s+/g, '_');
  return statusMap[normalized] ?? 'under_investigation';
};

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
  victims?: CaseVictim[];
  witnesses?: CaseWitness[];
  evidences?: CrimeEvidence[];
  criminals?: Array<{ id: string; name: string; status?: string; crimeId?: string; nationality?: string; alias?: string; gender?: string; age?: number; phone?: string; address?: string }>; 
  assignedOfficers?: CrimeAssignedOfficer[];
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
  firId?: string;
  incidentRegisteredDate?: string;
  createdBy?: string; // ← add this
  evidences?: { evidence_type: string; file_url?: string; description?: string }[];
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

export interface CaseVictim {
  id: string;
  incidentId: string;
  fullName: string;
  gender?: string;
  mobileNumber?: string;
  email?: string;
  address?: string;
  occupation?: string;
  injuryType?: string;
  medicalReportNumber?: string;
  alive: boolean;
  createdAt?: string;
}

export interface CreateVictimPayload {
  incident_id: string;
  full_name: string;
  gender?: string;
  mobile_number?: string;
  email?: string;
  address?: string;
  occupation?: string;
  injury_type?: string;
  medical_report_number?: string;
  alive?: boolean;
}

export interface CaseWitness {
  id: string;
  incidentId: string;
  fullName: string;
  gender?: string;
  age?: number;
  mobileNumber?: string;
  email?: string;
  address?: string;
  occupation?: string;
  witnessType?: string;
  statement?: string;
  createdAt?: string;
}

export interface CreateWitnessPayload {
  incident_id: string;
  full_name: string;
  gender?: string;
  age?: number;
  mobile_number?: string;
  email?: string;
  address?: string;
  occupation?: string;
  witness_type?: string;
  statement?: string;
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

  const assignedOfficers = Array.isArray(c.assigned_officers)
    ? c.assigned_officers.map((officer: any) => ({
        id: String(officer.ROWID || officer.id || ''),
        incidentId: officer.incident_id || c.ROWID || c.id,
        officerId: officer.officer_id,
        badgeNumber: officer.officer_details?.badge_number || officer.badge_number,
        rank: officer.officer_details?.rank_id || officer.rank_id,
        contactNumber: officer.officer_details?.contact_number || officer.contact_number,
        stationId: officer.officer_details?.station_id || officer.station_id,
        operationalStatus: officer.officer_details?.operational_status || officer.operational_status,
        createdAt: officer.CREATEDTIME || officer.createdAt,
      }))
    : [];

  const victims = Array.isArray(c.victims) ? c.victims.map(decodeVictim) : [];
  const witnesses = Array.isArray(c.witnesses) ? c.witnesses.map(decodeWitness) : [];
  const evidence = Array.isArray(c.evidences) ? c.evidences.map(decodeEvidence) : [];
  const criminals = Array.isArray(c.criminals)
    ? c.criminals.map((criminal: any) => ({
        id: String(criminal.ROWID || criminal.id || ''),
        name: criminal.full_name || criminal.name || 'Unknown Criminal',
        status: criminal.status,
        crimeId: criminal.incident_id || c.ROWID || c.id,
        nationality: criminal.nationality,
        alias: criminal.alias || criminal.known_alias,
        gender: criminal.gender,
        age: criminal.age ? Number(criminal.age) : undefined,
        phone: criminal.mobile_number || criminal.phone,
        address: criminal.address,
      }))
    : [];

  const primaryOfficer = assignedOfficers[0];
  const hasCoordinates = Number.isFinite(coordinates[0]) && Number.isFinite(coordinates[1]) && (coordinates[0] !== 0 || coordinates[1] !== 0);
  const locationLabel = hasCoordinates ? `${coordinates[0]}, ${coordinates[1]}` : c.crime_location || c.location || 'Not specified';

  return {
    id: c.ROWID || c.id,
    crimeNumber: c.crime_number || `CRIME-${String(c.ROWID || c.id).padStart(6, '0')}`,
    caseNumber: c.case_number || c.crime_number || `CRIME-${String(c.ROWID || c.id).padStart(6, '0')}`,
    title: c.title || 'Untitled Crime Incident',
    description: c.description || '',
    crimeCategory: c.crime_category || c.crime_category_id || c.category || c.title || 'General',
    status: normalizeCrimeStatus(c.status),
    incidentDate: c.crime_occured_date_time || c.incident_date || c.createdAt || c.incident_registered_date,
    crimeLocation: locationLabel,
    location: {
      address: c.address || '',
      district: c.crime_happended_at_district_id || '',
      coordinates: coordinates,
    },
    district: c.crime_happended_at_district_id || c.district || 'Unassigned District',
    weaponUsed: c.weapon_used || 'Not specified',
    assignedOfficerId: primaryOfficer?.officerId || c.assigned_officer_id,
    assignedOfficerName: primaryOfficer?.badgeNumber ? `Badge ${primaryOfficer.badgeNumber}` : c.assigned_officer_name || 'Pending Assignment',
    assignedStationId: primaryOfficer?.stationId || c.police_station_id,
    assignedStationName: c.police_station_name || 'Pending Station',
    createdBy: c.created_by || c.createdBy || 'System',
    victimCount: c.victim_count ?? (Array.isArray(c.victims) ? c.victims.length : 0),
    suspectCount: c.suspect_count ?? (Array.isArray(c.criminals) ? c.criminals.length : 0),
    evidenceCount: c.evidence_count ?? (Array.isArray(c.evidences) ? c.evidences.length : 0),
    legalSectionsCount: c.legal_sections_count ?? 0,
    victims,
    witnesses,
    evidences: evidence,
    criminals,
    assignedOfficers,
    createdAt: c.CREATEDTIME || c.createdAt || c.created_at,
    updatedAt: c.MODIFIEDTIME || c.updatedAt || c.updated_at,
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

const decodeSuspect = (s: any): CrimeSuspect => ({
  id: String(s.ROWID || s.id || ''),
  crimeId: s.crime_id || s.incident_id || '',
  name: s.full_name || s.name || 'Unknown Suspect',
  age: s.date_of_birth
    ? new Date().getFullYear() - new Date(s.date_of_birth).getFullYear()
    : s.age,
  gender: s.gender,
  phone: s.phone || s.mobile_number,
  address: s.address,
  district: s.district_id_of_suspect || s.district,
  knownAlias: s.known_alias || s.suspect_number,
  reasonForSuspicion: s.reason_for_suspicion || (s.nationality ? `Nationality: ${s.nationality}` : ''),
  notes: s.notes,
  photoUrl: s.photo_url || s.photoUrl,
  status: (s.status?.toLowerCase() as SuspectStatus) || 'under_watch',
  linkedEvidenceCount: s.linked_evidence_count ?? 0,
  createdAt: s.createdtime || s.createdAt,
});

const decodeVictim = (v: any): CaseVictim => ({
  id: String(v.ROWID || v.id || ''),
  incidentId: v.incident_id || '',
  fullName: v.full_name || 'Unknown Victim',
  gender: v.gender,
  mobileNumber: v.mobile_number,
  email: v.email,
  address: v.address,
  occupation: v.occupation,
  injuryType: v.injury_type,
  medicalReportNumber: v.medical_report_number,
  alive: v.alive !== undefined ? Boolean(v.alive) : true,
  createdAt: v.createdtime || v.createdAt,
});

const decodeWitness = (w: any): CaseWitness => ({
  id: String(w.ROWID || w.id || ''),
  incidentId: w.incident_id || '',
  fullName: w.full_name || 'Unknown Witness',
  gender: w.gender,
  age: w.age ? Number(w.age) : undefined,
  mobileNumber: w.mobile_number,
  email: w.email,
  address: w.address,
  occupation: w.occupation,
  witnessType: w.witness_type,
  statement: w.statement,
  createdAt: w.createdtime || w.createdAt,
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

    getCrimesByEvidencePaths: builder.query<{ success: boolean, data: { path: string, score?: number, crimes: { ROWID: string, title: string }[] }[] }, string[]>({
      query: (paths) => ({
        url: '/evidence-analysis',
        params: { paths: paths.join(',') },
      }),
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
          status: 'UNDER_INVESTIGATION',
          crime_occured_date_time: body.incidentDate || new Date().toISOString().replace('T', ' ').slice(0, 16),
          incident_registered_date: body.incidentRegisteredDate,
          fir_id: body.firId,
          criminal_ids: body.criminalIds,
          created_by: body.createdBy, 
          evidences: body.evidences,
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

    // --- Suspects (Backend /suspects integration) ---
    getCrimeSuspects: builder.query<CrimeSuspect[], string | void>({
      query: () => '/suspects/getAll',
      transformResponse: (response: any) => {
        const nestedData = response?.data ?? response;
        const rawList = Array.isArray(nestedData)
          ? nestedData
          : (Array.isArray(nestedData?.data) ? nestedData.data : []);
        return rawList.map(decodeSuspect);
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((s) => ({ type: 'CrimeSuspect' as const, id: s.id })),
              { type: 'CrimeSuspect', id: 'LIST' },
            ]
          : [{ type: 'CrimeSuspect', id: 'LIST' }],
    }),

    addCrimeSuspect: builder.mutation<
      { data: CrimeSuspect; message: string },
      { crimeId?: string; body: CreateSuspectPayload }
    >({
      query: ({ body }) => ({
        url: '/suspects',
        method: 'POST',
        body: {
          full_name: body.name,
          gender: body.gender,
          date_of_birth: body.dob,
          address: body.address,
          district_id_of_suspect: body.district,
          photo_url: body.photoUrl,
          status: 'ACTIVE',
        },
      }),
      invalidatesTags: [{ type: 'CrimeSuspect', id: 'LIST' }],
    }),

    updateCrimeSuspect: builder.mutation<
      { message: string },
      { crimeId?: string; suspectId: string; body: Partial<CreateSuspectPayload> & { status?: SuspectStatus } }
    >({
      query: ({ suspectId, body }) => ({
        url: `/suspects/${suspectId}`,
        method: 'PUT',
        body: {
          full_name: body.name,
          gender: body.gender,
          date_of_birth: body.dob,
          address: body.address,
          district_id_of_suspect: body.district,
          photo_url: body.photoUrl,
          status: body.status ? body.status.toUpperCase() : undefined,
        },
      }),
      invalidatesTags: (_result, _error, { suspectId }) => [
        { type: 'CrimeSuspect', id: suspectId },
        { type: 'CrimeSuspect', id: 'LIST' },
      ],
    }),

    removeCrimeSuspect: builder.mutation<{ message: string }, { crimeId?: string; suspectId: string }>({
      query: ({ suspectId }) => ({
        url: `/suspects/${suspectId}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'CrimeSuspect', id: 'LIST' }],
    }),

    promoteCrimeSuspectToCriminal: builder.mutation<
      { message: string; criminalId?: string },
      { crimeId?: string; suspectId: string }
    >({
      query: ({ suspectId }) => ({
        url: `/suspects/${suspectId}`,
        method: 'PUT',
        body: { status: 'PROMOTED' },
      }),
      invalidatesTags: [{ type: 'CrimeSuspect', id: 'LIST' }, { type: 'Criminal', id: 'LIST' }],
    }),

    // --- Case Victims (Backend /case-victims integration) ---
    getVictimsByIncident: builder.query<CaseVictim[], string>({
      query: (incidentId) => `/case-victims/byIncident/${incidentId}`,
      transformResponse: (response: any) => {
        const nestedData = response?.data ?? response;
        const rawList = Array.isArray(nestedData)
          ? nestedData
          : (Array.isArray(nestedData?.data) ? nestedData.data : []);
        return rawList.map(decodeVictim);
      },
      providesTags: (_result, _error, incidentId) => [{ type: 'CaseVictim', id: `incident-${incidentId}` }],
    }),

    addCaseVictim: builder.mutation<{ id: string; message?: string }, CreateVictimPayload>({
      query: (body) => ({
        url: '/case-victims',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, body) => [
        { type: 'CaseVictim', id: `incident-${body.incident_id}` },
        { type: 'Crime', id: body.incident_id },
      ],
    }),

    updateCaseVictim: builder.mutation<
      { message: string },
      { id: string; incidentId: string; body: Partial<CreateVictimPayload> }
    >({
      query: ({ id, body }) => ({
        url: `/case-victims/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { incidentId }) => [
        { type: 'CaseVictim', id: `incident-${incidentId}` },
      ],
    }),

    deleteCaseVictim: builder.mutation<{ message: string }, { id: string; incidentId: string }>({
      query: ({ id }) => ({
        url: `/case-victims/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { incidentId }) => [
        { type: 'CaseVictim', id: `incident-${incidentId}` },
        { type: 'Crime', id: incidentId },
      ],
    }),

    // --- Case Witnesses (Backend /case-witnesses integration) ---
    getWitnessesByIncident: builder.query<CaseWitness[], string>({
      query: (incidentId) => `/case-witnesses/byIncident/${incidentId}`,
      transformResponse: (response: any) => {
        const nestedData = response?.data ?? response;
        const rawList = Array.isArray(nestedData)
          ? nestedData
          : (Array.isArray(nestedData?.data) ? nestedData.data : []);
        return rawList.map(decodeWitness);
      },
      providesTags: (_result, _error, incidentId) => [{ type: 'CaseWitness', id: `incident-${incidentId}` }],
    }),

    addCaseWitness: builder.mutation<{ id: string; message?: string }, CreateWitnessPayload>({
      query: (body) => ({
        url: '/case-witnesses',
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, body) => [
        { type: 'CaseWitness', id: `incident-${body.incident_id}` },
      ],
    }),

    updateCaseWitness: builder.mutation<
      { message: string },
      { id: string; incidentId: string; body: Partial<CreateWitnessPayload> }
    >({
      query: ({ id, body }) => ({
        url: `/case-witnesses/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_result, _error, { incidentId }) => [
        { type: 'CaseWitness', id: `incident-${incidentId}` },
      ],
    }),

    deleteCaseWitness: builder.mutation<{ message: string }, { id: string; incidentId: string }>({
      query: ({ id }) => ({
        url: `/case-witnesses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { incidentId }) => [
        { type: 'CaseWitness', id: `incident-${incidentId}` },
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
  useGetCrimesByEvidencePathsQuery,
  useCreateCrimeMutation,
  useUpdateCrimeMutation,
  useUpdateCrimeStatusMutation,
  useDeleteCrimeMutation,
  useGetCrimeSuspectsQuery,
  useAddCrimeSuspectMutation,
  useUpdateCrimeSuspectMutation,
  useRemoveCrimeSuspectMutation,
  usePromoteCrimeSuspectToCriminalMutation,
  useGetVictimsByIncidentQuery,
  useAddCaseVictimMutation,
  useUpdateCaseVictimMutation,
  useDeleteCaseVictimMutation,
  useGetWitnessesByIncidentQuery,
  useAddCaseWitnessMutation,
  useUpdateCaseWitnessMutation,
  useDeleteCaseWitnessMutation,
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
