import { baseApi } from './baseApi';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CriminalResponse {
  id: string;
  name: string;
  alias?: string;
  age?: number;
  gender?: string;
  address?: string;
  phone?: string;
  description?: string;
  photoUrl?: string;
  identificationMarks?: string;
  status?: string;
  crimes?: { id: string; title?: string; type?: string }[];
  isArchived?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCriminalPayload {
  name: string;
  alias?: string;
  age?: number;
  gender?: string;
  address?: string;
  phone?: string;
  description?: string;
  photoUrl?: string;
  identificationMarks?: string;
}

export interface UpdateCriminalPayload extends Partial<CreateCriminalPayload> {}

// Helper to encode rich fields into the database 'address' field
const encodeAddress = (payload: any) => {
  return JSON.stringify({
    address: payload.address || '',
    phone: payload.phone || '',
    alias: payload.alias || '',
    description: payload.description || '',
    identificationMarks: payload.identificationMarks || '',
  });
};

// Helper to decode rich fields from the database 'address' field
const decodeCriminal = (s: any): CriminalResponse => {
  let address = s.address || '';
  let phone = '';
  let alias = s.alias || '';
  let description = '';
  let identificationMarks = '';

  if (s.address && s.address.startsWith('{')) {
    try {
      const parsed = JSON.parse(s.address);
      address = parsed.address || '';
      phone = parsed.phone || '';
      alias = parsed.alias || '';
      description = parsed.description || '';
      identificationMarks = parsed.identificationMarks || '';
    } catch {
      // Ignore parse failure
    }
  }

  // Calculate age from date_of_birth if needed, or default
  let age: number | undefined = undefined;
  if (s.date_of_birth) {
    const dob = new Date(s.date_of_birth);
    if (!isNaN(dob.getTime())) {
      const diffMs = Date.now() - dob.getTime();
      age = Math.abs(new Date(diffMs).getUTCFullYear() - 1970);
    }
  }

  return {
    id: s.ROWID || s.id,
    name: s.full_name || s.name || 'Unknown Criminal',
    alias: alias,
    age: age,
    gender: s.gender || 'Male',
    address: address,
    phone: phone,
    description: description,
    photoUrl: s.photo_url || '',
    identificationMarks: identificationMarks,
    status: s.status || 'ACTIVE',
    isArchived: s.is_archived === true || s.is_archived === 'true',
  };
};

// ---------------------------------------------------------------------------
// API Slice
// ---------------------------------------------------------------------------

export const criminalsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createCriminal: builder.mutation<{ data: CriminalResponse; message: string }, CreateCriminalPayload>({
      query: (body) => {
        // Calculate date of birth from age
        let date_of_birth = null;
        if (body.age) {
          const birthYear = new Date().getFullYear() - body.age;
          date_of_birth = `${birthYear}-01-01`;
        }

        return {
          url: '/criminals',
          method: 'POST',
          body: {
            full_name: body.name,
            gender: body.gender,
            date_of_birth: date_of_birth,
            photo_url: body.photoUrl,
            status: 'ACTIVE',
            address: encodeAddress(body),
          },
        };
      },
      invalidatesTags: ['Criminal'],
    }),

    getCriminals: builder.query<CriminalResponse[], { search?: string; status?: string } | void>({
      query: (params) => ({
        url: '/criminals',
        params: params || undefined,
      }),
      transformResponse: (response: any) => {
        const list = response.data ?? response ?? [];
        return list.map(decodeCriminal);
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map((c) => ({ type: 'Criminal' as const, id: c.id })),
              { type: 'Criminal', id: 'LIST' },
            ]
          : [{ type: 'Criminal', id: 'LIST' }],
    }),

    getCriminalById: builder.query<CriminalResponse, string>({
      query: (id) => `/criminals/${id}`,
      transformResponse: (response: any) => {
        const s = response.data ?? response;
        return decodeCriminal(s);
      },
      providesTags: (_result, _error, id) => [{ type: 'Criminal', id }],
    }),

    updateCriminal: builder.mutation<{ data: CriminalResponse; message: string }, { id: string; body: UpdateCriminalPayload }>({
      query: ({ id, body }) => {
        let date_of_birth = null;
        if (body.age) {
          const birthYear = new Date().getFullYear() - body.age;
          date_of_birth = `${birthYear}-01-01`;
        }

        return {
          url: `/criminals/${id}`,
          method: 'PUT',
          body: {
            full_name: body.name,
            gender: body.gender,
            date_of_birth: date_of_birth,
            photo_url: body.photoUrl,
            address: encodeAddress(body),
          },
        };
      },
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Criminal', id },
        { type: 'Criminal', id: 'LIST' },
      ],
    }),

    deleteCriminal: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/criminals/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Criminal'],
    }),
  }),
});

export const {
  useCreateCriminalMutation,
  useGetCriminalsQuery,
  useGetCriminalByIdQuery,
  useUpdateCriminalMutation,
  useDeleteCriminalMutation,
} = criminalsApi;
