import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const FORECAST_API_URL =
  import.meta.env.VITE_FORECAST_API_URL ||
  'https://forecast-50043087097.development.catalystappsail.in';

type ForecastQueryParams = {
  start_date?: string;
  end_date?: string;
  as_of?: string;
  district_id?: string;
  station_id?: string;
  districtId?: string;
  stationId?: string;
};

const buildForecastUrl = (endpoint: string, params?: ForecastQueryParams | void) => {
  const districtId = params?.district_id ?? params?.districtId;
  const stationId = params?.station_id ?? params?.stationId;

  if (districtId && stationId) {
    return `/api/forecast/district/${encodeURIComponent(districtId)}/station/${encodeURIComponent(stationId)}${endpoint}`;
  }

  if (districtId) {
    return `/api/forecast/district/${encodeURIComponent(districtId)}${endpoint}`;
  }

  return `/api/forecast${endpoint}`;
};

export interface PredictedIncidentsResponse {
  as_of: string;
  forecast_horizon_days: number;
  model_used?: string;
  model_metadata?: Record<string, unknown>;
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

export interface ModelStatusResponse {
  warm: boolean;
  model_metadata?: Record<string, unknown>;
  training_state?: {
    status?: string;
    last_trained_at?: string;
    district_id?: string | null;
    station_id?: string | null;
    incident_count?: number;
  };
}

export interface TrainModelResponse {
  status: string;
  model_type?: string;
  model_source?: string;
  message?: string;
  trained_at?: string;
  training_records?: number;
  days_covered?: number;
  start_date?: string;
  end_date?: string;
  features?: string[];
  iterations?: number;
  fallback?: boolean;
  fallback_reason?: string;
}

export const forecastApi = createApi({
  reducerPath: 'forecastApi',
  baseQuery: fetchBaseQuery({
    baseUrl: FORECAST_API_URL,
  }),
  tagTypes: ['Forecast'],
  endpoints: (builder) => ({
    getModelStatus: builder.query<ModelStatusResponse, void>({
      query: () => ({
        url: '/api/forecast/model-status',
      }),
      providesTags: ['Forecast'],
    }),

    getPredictedIncidents: builder.query<
      PredictedIncidentsResponse,
      ForecastQueryParams | void
    >({
      query: (params) => {
        const districtId = params?.district_id ?? params?.districtId;
        const stationId = params?.station_id ?? params?.stationId;

        return {
          url: buildForecastUrl('/predicted-incidents', params),
          params: {
            ...(params?.start_date ? { start_date: params.start_date } : {}),
            ...(params?.end_date ? { end_date: params.end_date } : {}),
            ...(params?.as_of ? { as_of: params.as_of } : {}),
            ...(districtId ? { district_id: districtId, districtId } : {}),
            ...(stationId ? { station_id: stationId, stationId } : {}),
          },
        };
      },
      providesTags: ['Forecast'],
    }),

    getHighRiskDistricts: builder.query<
      HighRiskDistrictsResponse,
      ForecastQueryParams | void
    >({
      query: (params) => {
        const districtId = params?.district_id ?? params?.districtId;
        const stationId = params?.station_id ?? params?.stationId;

        return {
          url: buildForecastUrl('/high-risk-districts', params),
          params: {
            ...(params?.start_date ? { start_date: params.start_date } : {}),
            ...(params?.end_date ? { end_date: params.end_date } : {}),
            ...(params?.as_of ? { as_of: params.as_of } : {}),
            ...(districtId ? { district_id: districtId, districtId } : {}),
            ...(stationId ? { station_id: stationId, stationId } : {}),
          },
        };
      },
      providesTags: ['Forecast'],
    }),

    getCrimeTrend: builder.query<
      CrimeTrendResponse,
      ForecastQueryParams | void
    >({
      query: (params) => {
        const districtId = params?.district_id ?? params?.districtId;
        const stationId = params?.station_id ?? params?.stationId;

        return {
          url: buildForecastUrl('/crime-trend', params),
          params: {
            ...(params?.start_date ? { start_date: params.start_date } : {}),
            ...(params?.end_date ? { end_date: params.end_date } : {}),
            ...(params?.as_of ? { as_of: params.as_of } : {}),
            ...(districtId ? { district_id: districtId, districtId } : {}),
            ...(stationId ? { station_id: stationId, stationId } : {}),
          },
        };
      },
      providesTags: ['Forecast'],
    }),

    trainModel: builder.mutation<TrainModelResponse, void>({
      query: () => ({
        url: '/api/forecast/train',
        method: 'POST',
      }),
      invalidatesTags: ['Forecast'],
    }),
  }),
});

export const {
  useGetModelStatusQuery,
  useGetPredictedIncidentsQuery,
  useGetHighRiskDistrictsQuery,
  useGetCrimeTrendQuery,
  useTrainModelMutation,
} = forecastApi;

