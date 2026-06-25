import { baseApi } from './baseApi';
import { generateMockIncidents } from '@/features/geospatial/data/mockGeospatialData';
import type { CrimeIncident } from '@/features/geospatial/types/geospatial';

const incidentsData = generateMockIncidents();


// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CrimeRecord {
  id: string;
  caseNumber?: string;
  title?: string;
  type?: string;
  category?: string;
  description?: string;
  location?: {
    address?: string;
    district?: string;
    coordinates?: [number, number];
  };
  timestamp?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'open' | 'investigating' | 'resolved' | 'closed';
  policeStationId?: string;
  policeStationName?: string;
  assignedOfficerId?: string;
  criminalIds?: string[];
  evidenceUrls?: string[];
  tags?: string[];
  isArchived?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCrimePayload {
  title?: string;
  type?: string;
  category?: string;
  description?: string;
  location?: CrimeRecord['location'];
  severity?: CrimeRecord['severity'];
  policeStationId?: string;
  criminalIds?: string[];
}

export interface UpdateCrimePayload extends Partial<CreateCrimePayload> {
  status?: CrimeRecord['status'];
  assignedOfficerId?: string;
}

export interface CrimeFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  severity?: string;
  status?: string;
  district?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
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

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Helpers to encode/decode
const decodeCrime = (c: any): CrimeRecord => {
  const coordinates: [number, number] = [
    c.crime_location_latitude ? parseFloat(c.crime_location_latitude) : 0,
    c.crime_location_longitude ? parseFloat(c.crime_location_longitude) : 0,
  ];

  return {
    id: c.ROWID || c.id,
    caseNumber: c.crime_number || `CRIME-${c.ROWID}`,
    title: c.title || 'Crime Incident',
    type: c.category || 'General',
    category: c.category || 'General',
    description: c.description || '',
    location: {
      address: c.address || '',
      district: c.crime_happended_at_district_id || '',
      coordinates: coordinates,
    },
    timestamp: c.crime_occured_date_time || c.createdAt || '',
    severity: c.status === 'UNDER_INVESTIGATION' ? 'high' : 'medium', // fallback severity
    status: c.status === 'UNDER_INVESTIGATION' ? 'investigating' : 'closed', // map standard backend status
    policeStationId: c.police_station_id,
    isArchived: c.is_archived === true || c.is_archived === 'true',
  };
};

// ---------------------------------------------------------------------------
// API Slice
// ---------------------------------------------------------------------------

export const crimeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCrimes: builder.query<CrimeRecord[], CrimeFilters | void>({
      query: (filters) => ({
        url: '/crimes/getAll',
        params: filters
          ? {
              category: filters.category,
              status: filters.status,
              district: filters.district,
            }
          : undefined,
      }),
      transformResponse: (response: any) => {
        const list = response.data ?? response ?? [];
        return list.map(decodeCrime);
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((c) => ({ type: 'Crime' as const, id: c.id })),
              { type: 'Crime', id: 'LIST' },
            ]
          : [{ type: 'Crime', id: 'LIST' }],
    }),

    getCrimeById: builder.query<CrimeRecord, string>({
      query: (id) => `/crimes/${id}`,
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
          category: body.category,
          police_station_id: body.policeStationId,
          crime_happended_at_district_id: body.location?.district,
          crime_location_latitude: body.location?.coordinates?.[0],
          crime_location_longitude: body.location?.coordinates?.[1],
          status: 'UNDER_INVESTIGATION',
          crime_occured_date_time: new Date().toISOString().replace('T', ' ').slice(0, 16),
          criminal_ids: body.criminalIds,
        },
      }),
      invalidatesTags: ['Crime'],
    }),

    updateCrime: builder.mutation<{ data: CrimeRecord; message: string }, { id: string; body: UpdateCrimePayload }>({
      query: ({ id, body }) => ({
        url: `/crimes/${id}`,
        method: 'PUT',
        body: {
          title: body.title,
          description: body.description,
          category: body.category,
          police_station_id: body.policeStationId,
          crime_happended_at_district_id: body.location?.district,
          crime_location_latitude: body.location?.coordinates?.[0],
          crime_location_longitude: body.location?.coordinates?.[1],
          status: body.status === 'investigating' ? 'UNDER_INVESTIGATION' : 'CLOSED',
        },
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
      invalidatesTags: ['Crime'],
    }),

    getCrimeCategories: builder.query<CrimeCategory[], void>({
      query: () => '/crimes/categories',
      transformResponse: (response: any) => response.data ?? response,
      providesTags: ['Crime'],
    }),

    getCrimeTrends: builder.query<TrendData[], TrendFilters>({
      query: (filters) => ({
        url: '/crimes/trends',
        params: filters,
      }),
      transformResponse: (response: any) => response.data ?? response,
      providesTags: ['Crime'],
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
  useDeleteCrimeMutation,
  useGetCrimeCategoriesQuery,
  useGetCrimeTrendsQuery,
  useGetIncidentsQuery,
} = crimeApi;
