import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const FORECAST_API_URL =
  import.meta.env.VITE_FORECAST_API_URL ||
  'https://forecast-50043087097.development.catalystappsail.in';

export interface PredictedIncidentsResponse {
  as_of: string;
  forecast_horizon_days: number;
  last_30_days: {
    start_date: string;
    end_date: string;
    total_incidents: number;
    daily_average: number;
  };
  next_30_days: {
    start_date: string;
    end_date: string;
    predicted_total_incidents: number;
    predicted_daily_average: number;
  };
  change_vs_last_30_days: {
    absolute_change: number;
    percent_change: number | null;
    direction: 'increase' | 'decrease' | 'stable';
  };
}

export interface HighRiskDistrictItem {
  district_id: string;
  district_name: string;
  risk_level: 'HIGH' | 'MEDIUM' | 'LOW';
  last_30_days_incidents: number;
  predicted_next_30_days_incidents: number;
  percent_change_vs_last_30_days: number | null;
  direction: 'increase' | 'decrease' | 'stable';
}

export interface HighRiskDistrictsResponse {
  as_of: string;
  forecast_horizon_days: number;
  district_count: number;
  high_risk_district_count: number;
  districts: HighRiskDistrictItem[];
}

export interface CrimeTrendItem {
  date: string;
  actual: number | null;
  predicted: number;
  is_forecast: boolean;
}

export interface CrimeTrendResponse {
  as_of: string;
  start_date: string;
  end_date: string;
  summary: {
    actual_total: number;
    predicted_total: number;
  };
  trend: CrimeTrendItem[];
}

export const forecastApi = createApi({
  reducerPath: 'forecastApi',
  baseQuery: fetchBaseQuery({
    baseUrl: FORECAST_API_URL,
  }),
  tagTypes: ['Forecast'],
  endpoints: (builder) => ({
    getPredictedIncidents: builder.query<PredictedIncidentsResponse, { as_of?: string } | void>({
      query: (params) => ({
        url: '/api/forecast/predicted-incidents',
        params: params?.as_of ? { as_of: params.as_of } : undefined,
      }),
      providesTags: ['Forecast'],
    }),

    getHighRiskDistricts: builder.query<HighRiskDistrictsResponse, { as_of?: string } | void>({
      query: (params) => ({
        url: '/api/forecast/high-risk-districts',
        params: params?.as_of ? { as_of: params.as_of } : undefined,
      }),
      providesTags: ['Forecast'],
    }),

    getCrimeTrend: builder.query<
      CrimeTrendResponse,
      { start_date: string; end_date: string; as_of?: string }
    >({
      query: (params) => ({
        url: '/api/forecast/crime-trend',
        params: {
          start_date: params.start_date,
          end_date: params.end_date,
          ...(params.as_of ? { as_of: params.as_of } : {}),
        },
      }),
      providesTags: ['Forecast'],
    }),
  }),
});

export const {
  useGetPredictedIncidentsQuery,
  useGetHighRiskDistrictsQuery,
  useGetCrimeTrendQuery,
} = forecastApi;
