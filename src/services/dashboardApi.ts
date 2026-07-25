import { baseApi } from './baseApi';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DistrictCrimeStat {
  districtId: string;
  districtName?: string;
  crimeCount: number;
  solvedCount?: number;
  pendingCount?: number;
  updatedAt?: string;
}

export interface TotalCrimeCount {
  totalCrimeCount: number;
}

export interface FilteredCrimeCount {
  totalCrimeCount: number;
}

// NEW: a single point in the trend series
export interface CrimeSeriesPoint {
  date: string;
  count: number;
}

export interface CrimeCountWithPreviousYear {
  currentPeriodCount: number;
  previousYearCount: number;
  currentPeriodSeries: CrimeSeriesPoint[];
  previousYearSeries: CrimeSeriesPoint[];
}

export interface CrimeGrowth {
  currentPeriodCount: number;
  previousPeriodCount: number;
  difference: number;
  growthPercentage: number;
}

export interface CategoryVolumeRankingItem {
  categoryId: string;
  categoryName: string;
  count: number;
  growthPercentage: number;
}

export interface DashboardCrimeFilters {
  stationId?: string;
  districtId?: string;
  categoryId?: string;
  gender?: string;
  date?: string;
  fromDate?: string;
  toDate?: string;
}

export interface CrimeGrowthFilters extends Omit<DashboardCrimeFilters, 'date'> {
  fromDate: string;
  toDate: string;
}

// ---------------------------------------------------------------------------
// Helpers to decode
// ---------------------------------------------------------------------------

const decodeDistrictCrimeStat = (d: any): DistrictCrimeStat => ({
  districtId: d.district_id || d.ROWID || d.id,
  districtName: d.district_name || d.district || '',
  crimeCount: Number(d.crime_count ?? 0),
  solvedCount: d.solved_count !== undefined ? Number(d.solved_count) : undefined,
  pendingCount: d.pending_count !== undefined ? Number(d.pending_count) : undefined,
  updatedAt: d.updatedAt || d.updated_at,
});

const decodeTotalCrimeCount = (r: any): TotalCrimeCount => ({
  totalCrimeCount: Number(r?.total_crime_count ?? 0),
});

const decodeFilteredCrimeCount = (r: any): FilteredCrimeCount => ({
  totalCrimeCount: Number(r?.total_crime_count ?? 0),
});

// NEW: decode a raw series array safely
const decodeCrimeSeries = (arr: any): CrimeSeriesPoint[] => {
  if (!Array.isArray(arr)) return [];
  return arr.map((p: any) => ({
    date: String(p?.date ?? ''),
    count: Number(p?.count ?? 0),
  }));
};

const decodeCrimeCountWithPreviousYear = (r: any): CrimeCountWithPreviousYear => ({
  currentPeriodCount: Number(r?.current_period_count ?? 0),
  previousYearCount: Number(r?.previous_year_count ?? 0),
  currentPeriodSeries: decodeCrimeSeries(r?.current_period_series),
  previousYearSeries: decodeCrimeSeries(r?.previous_year_series),
});

const decodeCrimeGrowth = (r: any): CrimeGrowth => ({
  currentPeriodCount: Number(r?.current_period_count ?? 0),
  previousPeriodCount: Number(r?.previous_period_count ?? 0),
  difference: Number(r?.difference ?? 0),
  growthPercentage: Number(r?.growth_percentage ?? 0),
});

const decodeCategoryVolumeRanking = (response: any): CategoryVolumeRankingItem[] => {
  const payload = response?.data ?? response;
  const items = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : [];

  return items.map((item: any) => ({
    categoryId: String(item?.categoryId ?? item?.category_id ?? ''),
    categoryName: String(item?.categoryName ?? item?.category_name ?? 'Unknown'),
    count: Number(item?.count ?? 0),
    growthPercentage: Number(item?.growthPercentage ?? item?.growth_percentage ?? 0),
  }));
};

// ---------------------------------------------------------------------------
// API Slice
// ---------------------------------------------------------------------------

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDistrictCrimeStats: builder.query<DistrictCrimeStat[], void>({
      query: () => '/dashboard/district-crime-stats',
      transformResponse: (response: any): DistrictCrimeStat[] => {
        const nestedData = response?.data ?? response;
        const rawList = Array.isArray(nestedData)
          ? nestedData
          : (Array.isArray(nestedData?.data) ? nestedData.data : []);
        return rawList.map(decodeDistrictCrimeStat);
      },
      providesTags: [{ type: 'DashboardStats', id: 'DISTRICT_LIST' }],
    }),

    getTotalCrimeCount: builder.query<TotalCrimeCount, void>({
      query: () => '/dashboard/total-crime-count',
      transformResponse: (response: any) => decodeTotalCrimeCount(response?.data ?? response),
      providesTags: [{ type: 'DashboardStats', id: 'TOTAL_COUNT' }],
    }),

    getFilteredCrimeCount: builder.query<FilteredCrimeCount, DashboardCrimeFilters | void>({
      query: (params) => ({
        url: '/dashboard/crimes/count',
        params: params
          ? {
              stationId: params.stationId || undefined,
              districtId: params.districtId || undefined,
              categoryId: params.categoryId || undefined,
              gender: params.gender || undefined,
              date: params.date || undefined,
              fromDate: params.fromDate || undefined,
              toDate: params.toDate || undefined,
            }
          : undefined,
      }),
      transformResponse: (response: any) => decodeFilteredCrimeCount(response?.data ?? response),
      providesTags: [{ type: 'DashboardStats', id: 'FILTERED_COUNT' }],
    }),

    getCrimeCountWithPreviousYear: builder.query<CrimeCountWithPreviousYear, DashboardCrimeFilters | void>({
      query: (params) => ({
        url: '/dashboard/crimes/count-with-previous-year',
        params: params
          ? {
              stationId: params.stationId || undefined,
              districtId: params.districtId || undefined,
              categoryId: params.categoryId || undefined,
              gender: params.gender || undefined,
              date: params.date || undefined,
              fromDate: params.fromDate || undefined,
              toDate: params.toDate || undefined,
            }
          : undefined,
      }),
      transformResponse: (response: any) => decodeCrimeCountWithPreviousYear(response?.data ?? response),
      providesTags: [{ type: 'DashboardStats', id: 'COUNT_PREV_YEAR' }],
    }),

    getCrimeGrowth: builder.query<CrimeGrowth, CrimeGrowthFilters>({
      query: (params) => ({
        url: '/dashboard/crimes/growth',
        params: {
          stationId: params.stationId || undefined,
          districtId: params.districtId || undefined,
          categoryId: params.categoryId || undefined,
          gender: params.gender || undefined,
          fromDate: params.fromDate,
          toDate: params.toDate,
        },
      }),
      transformResponse: (response: any) => decodeCrimeGrowth(response?.data ?? response),
      providesTags: [{ type: 'DashboardStats', id: 'GROWTH' }],
    }),

    getCategoryVolumeRanking: builder.query<
      CategoryVolumeRankingItem[],
      CrimeGrowthFilters
    >({
      query: (params) => ({
        url: '/dashboard/crimes/category-volume',
        params: {
          stationId: params.stationId || undefined,
          districtId: params.districtId || undefined,
          categoryId: params.categoryId || undefined,
          gender: params.gender || undefined,
          fromDate: params.fromDate,
          toDate: params.toDate,
        },
      }),
      transformResponse: decodeCategoryVolumeRanking,
      providesTags: [{ type: 'DashboardStats', id: 'CATEGORY_VOLUME' }],
    }),
  }),
});

export const {
  useGetDistrictCrimeStatsQuery,
  useGetTotalCrimeCountQuery,
  useGetFilteredCrimeCountQuery,
  useGetCrimeCountWithPreviousYearQuery,
  useGetCrimeGrowthQuery,
  useLazyGetCategoryVolumeRankingQuery,
} = dashboardApi;
