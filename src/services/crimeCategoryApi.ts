import { baseApi } from './baseApi';

export interface CrimeCategory {
  ROWID: string;
  crime_category_name: string;
  crime_category_number?: number;
  description?: string;
  CREATEDTIME?: string;
  MODIFIEDTIME?: string;
}

export const crimeCategoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCrimeCategories: builder.query<CrimeCategory[], void>({
      query: () => '/crime-categories',
      transformResponse: (response: any) => response.data ?? response,
      providesTags: ['CrimeCategory'],
    }),
  }),
});

export const { useGetCrimeCategoriesQuery } = crimeCategoryApi;
