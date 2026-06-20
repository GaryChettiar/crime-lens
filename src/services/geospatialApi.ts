import { baseApi } from './baseApi';
import {
  DISTRICT_METRICS,
  generateMockIncidents,
  generateRiskForecastZones,
} from '@/features/geospatial/data/mockGeospatialData';
import type {
  CrimeIncident,
  DistrictMetric,
  RiskForecastZone,
} from '@/features/geospatial/types/geospatial';
import karnatakaEvents from '@/features/intelligence/data/karnatakaEvents.json';

// Pre-generated mock static instances
const incidentsData = generateMockIncidents();
const forecastsData = generateRiskForecastZones();

export interface ComparisonResult {
  district: string;
  crimeCount: number;
  resolutionRate: number;
  riskIndex: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  growthRate: number;
}

export interface FestivalEvent {
  id: string;
  name: string;
  type: "festival" | "political" | "sports" | "concert" | "religious";
  district: string;
  startDate: string;
  endDate: string;
  expectedAttendance: number;
  latitude: number;
  longitude: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  historicalTheftIncrease: number;
  historicalAssaultIncrease: number;
  historicalCrowdIncidents: number;
  predictedRiskScore: number;
}

/**
 * Geospatial API Slice
 * Exposes queries for map data, incidents, forecasting, and comparisons.
 * Uses queryFn to return mock data, keeping the architecture fully prepared for backend wiring.
 */
export const geospatialApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDistricts: builder.query<DistrictMetric[], void>({
      queryFn: () => {
        return { data: DISTRICT_METRICS };
      },
    }),

    getIncidents: builder.query<CrimeIncident[], void>({
      queryFn: () => {
        return { data: incidentsData };
      },
    }),

    getRiskForecasts: builder.query<RiskForecastZone[], void>({
      queryFn: () => {
        return { data: forecastsData };
      },
    }),

    getFestivalEvents: builder.query<FestivalEvent[], void>({
      queryFn: () => {
        return { data: karnatakaEvents as FestivalEvent[] };
      },
    }),

    getDistrictComparison: builder.query<ComparisonResult[], string[]>({
      queryFn: (districts) => {
        const results = DISTRICT_METRICS.filter((metric) =>
          districts.includes(metric.district)
        ).map((m) => ({
          district: m.district,
          crimeCount: m.crimeCount,
          resolutionRate: m.resolutionRate,
          riskIndex: m.riskIndex,
          trend: m.trend,
          growthRate: m.growthRate,
        }));
        return { data: results };
      },
    }),
  }),
});

export const {
  useGetDistrictsQuery,
  useGetIncidentsQuery,
  useGetRiskForecastsQuery,
  useGetFestivalEventsQuery,
  useGetDistrictComparisonQuery,
} = geospatialApi;
