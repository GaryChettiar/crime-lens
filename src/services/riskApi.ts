import { baseApi } from './baseApi';
import { generateRiskForecastZones } from '@/features/geospatial/data/mockGeospatialData';
import type { RiskForecastZone } from '@/features/geospatial/types/geospatial';
import karnatakaEvents from '@/features/intelligence/data/karnatakaEvents.json';

const forecastsData = generateRiskForecastZones();

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
 * Risk API — Risk assessment and scoring endpoints.
 * Simulates server-side logic in-browser via queryFn.
 */
export const riskApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRiskAssessments: builder.query<RiskAssessment[], RiskFilters | void>({
      queryFn: (filters) => {
        let data = [...mockRiskAssessments];
        if (filters?.district) {
          data = data.filter(item => item.district.toLowerCase() === filters.district!.toLowerCase());
        }
        if (filters?.riskLevel) {
          data = data.filter(item => item.riskLevel === filters.riskLevel);
        }
        return { data };
      },
      providesTags: ['Risk'],
    }),

    getRiskScore: builder.query<RiskScore, { zoneId: string }>({
      queryFn: ({ zoneId }) => {
        const score: RiskScore = {
          zoneId,
          overall: 78,
          breakdown: {
            crimeFrequency: 80,
            crimeSeverity: 75,
            recentTrend: 85,
            historicalPattern: 70,
            environmentalFactors: 82,
          },
          riskLevel: 'high',
          confidence: 88,
        };
        return { data: score };
      },
      providesTags: (_result, _error, { zoneId }) => [
        { type: 'Risk', id: zoneId },
      ],
    }),

    getRiskFactors: builder.query<RiskFactor[], { zoneId: string }>({
      queryFn: () => {
        const factors: RiskFactor[] = [
          { name: 'Crowd Density', score: 85, weight: 0.3, description: 'Elevated due to festivals.', trend: 'increasing' },
          { name: 'ANPR Blacklist Sightings', score: 72, weight: 0.25, description: 'Multiple triggers along border checkposts.', trend: 'stable' },
          { name: 'Historical Crime Spike', score: 68, weight: 0.25, description: 'Historically high during this calendar window.', trend: 'increasing' },
          { name: 'Weather / Lighting', score: 40, weight: 0.2, description: 'Adequate lighting, minimal precipitation forecast.', trend: 'stable' },
        ];
        return { data: factors };
      },
      providesTags: ['Risk'],
    }),

    getRiskDrivers: builder.query<RiskDriver[], { district?: string | null } | void>({
      queryFn: (filters) => {
        let data = [...mockRiskDrivers];
        if (filters?.district?.toLowerCase() === 'mysore') {
          data = data.map(d => d.name === 'Festival Crowd Surge' ? { ...d, impactScore: 98, confidence: 95 } : d);
        } else if (filters?.district?.toLowerCase() === 'bangalore') {
          data = data.map(d => d.name === 'Cyber Fraud Campaign Spike' ? { ...d, impactScore: 92, confidence: 94 } : d);
        }
        return { data };
      },
      providesTags: ['Risk'],
    }),

    getResourceRecommendations: builder.query<ResourceRecommendation[], { district?: string | null } | void>({
      queryFn: (filters) => {
        let data = [...mockResourceRecommendations];
        if (filters?.district) {
          data = data.filter(item => item.district.toLowerCase() === filters.district!.toLowerCase());
        }
        return { data };
      },
      providesTags: ['Risk'],
    }),

    getRiskForecastPoints: builder.query<RiskForecastPoint[], { days: number; district?: string | null }>({
      queryFn: ({ days, district }) => {
        let data = mockRiskForecasts.slice(0, days);
        if (district) {
          const factor = district.toLowerCase() === 'bangalore' ? 1.4 : 0.6;
          data = data.map(d => ({
            date: d.date,
            theft: Math.round(d.theft * factor),
            assault: Math.round(d.assault * factor),
            cyber: Math.round(d.cyber * factor),
            narcotics: Math.round(d.narcotics * factor),
          }));
        }
        return { data };
      },
      providesTags: ['Risk'],
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
  }),
});

export const {
  useGetRiskAssessmentsQuery,
  useGetRiskScoreQuery,
  useGetRiskFactorsQuery,
  useGetRiskDriversQuery,
  useGetResourceRecommendationsQuery,
  useGetRiskForecastPointsQuery,
  useGetRiskForecastsQuery,
  useGetFestivalEventsQuery,
} = riskApi;

// ---------------------------------------------------------------------------
// Mock Datasets
// ---------------------------------------------------------------------------

const mockRiskAssessments: RiskAssessment[] = [
  {
    id: 'risk-1',
    district: 'Bangalore',
    overallScore: 84,
    riskLevel: 'critical',
    trend: 'increasing',
    predictedCrimes: 420,
    currentCrimes: 380,
    confidence: 92,
    recommendedAction: 'Deploy 25 additional patrol units and increase CCTV coverage near Chinnaswamy Stadium.',
    topCrimeTypes: ['cyber', 'theft', 'assault'],
    lastUpdated: '2026-06-13 09:00:00'
  },
  {
    id: 'risk-2',
    district: 'Mysore',
    overallScore: 78,
    riskLevel: 'high',
    trend: 'increasing',
    predictedCrimes: 180,
    currentCrimes: 150,
    confidence: 88,
    recommendedAction: 'Deploy 15 additional officers to Heritage Zone in preparation for upcoming Dasara crowds.',
    topCrimeTypes: ['theft', 'pickpocketing', 'assault'],
    lastUpdated: '2026-06-13 09:00:00'
  },
  {
    id: 'risk-3',
    district: 'Gulbarga',
    overallScore: 72,
    riskLevel: 'high',
    trend: 'stable',
    predictedCrimes: 140,
    currentCrimes: 145,
    confidence: 85,
    recommendedAction: 'Establish temporary checkposts along highways and dispatch tactical units near election assembly zones.',
    topCrimeTypes: ['assault', 'riot', 'theft'],
    lastUpdated: '2026-06-13 08:30:00'
  },
  {
    id: 'risk-4',
    district: 'Belgaum',
    overallScore: 65,
    riskLevel: 'medium',
    trend: 'increasing',
    predictedCrimes: 95,
    currentCrimes: 80,
    confidence: 81,
    recommendedAction: 'Deploy extra surveillance cameras and increase night beats in commercial sectors.',
    topCrimeTypes: ['theft', 'narcotics', 'burglary'],
    lastUpdated: '2026-06-13 08:00:00'
  },
  {
    id: 'risk-5',
    district: 'Bellary',
    overallScore: 58,
    riskLevel: 'medium',
    trend: 'decreasing',
    predictedCrimes: 70,
    currentCrimes: 78,
    confidence: 84,
    recommendedAction: 'Deploy traffic safety officers and night patrols near mining transport hubs.',
    topCrimeTypes: ['theft', 'assault', 'narcotics'],
    lastUpdated: '2026-06-13 07:30:00'
  },
  {
    id: 'risk-6',
    district: 'Dakshina Kannada',
    overallScore: 52,
    riskLevel: 'medium',
    trend: 'stable',
    predictedCrimes: 110,
    currentCrimes: 108,
    confidence: 89,
    recommendedAction: 'Strengthen port-side security sweeps and monitor coastal transit routes for contraband.',
    topCrimeTypes: ['narcotics', 'smuggling', 'theft'],
    lastUpdated: '2026-06-13 07:00:00'
  },
  {
    id: 'risk-7',
    district: 'Shimoga',
    overallScore: 42,
    riskLevel: 'low',
    trend: 'decreasing',
    predictedCrimes: 45,
    currentCrimes: 52,
    confidence: 80,
    recommendedAction: 'Continue routine beats and community policing programs in residential sectors.',
    topCrimeTypes: ['theft', 'burglary'],
    lastUpdated: '2026-06-13 06:30:00'
  },
  {
    id: 'risk-8',
    district: 'Davanagere',
    overallScore: 35,
    riskLevel: 'low',
    trend: 'stable',
    predictedCrimes: 38,
    currentCrimes: 40,
    confidence: 78,
    recommendedAction: 'Establish town corridor patrol checkpoints during weekend commercial spikes.',
    topCrimeTypes: ['theft', 'cyber'],
    lastUpdated: '2026-06-13 06:00:00'
  }
];

const mockRiskDrivers: RiskDriver[] = [
  { id: 'driver-1', name: 'Festival Crowd Surge', impactScore: 88, confidence: 91, category: 'event' },
  { id: 'driver-2', name: 'Vehicle Theft Cluster', impactScore: 76, confidence: 85, category: 'cluster' },
  { id: 'driver-3', name: 'Cyber Fraud Campaign Spike', impactScore: 72, confidence: 88, category: 'spike' },
  { id: 'driver-4', name: 'Gang Activity / Syndicate Expansion', impactScore: 68, confidence: 82, category: 'syndicate' },
  { id: 'driver-5', name: 'Political Assembly & Rallies', impactScore: 64, confidence: 89, category: 'event' }
];

const mockResourceRecommendations: ResourceRecommendation[] = [
  {
    id: 'rec-1',
    priority: 'critical',
    district: 'Bangalore',
    recommendation: 'Deploy 20 additional officers near Chinnaswamy stadium.',
    reason: 'High crowd density overlapping with recent vehicle theft clusters.',
    expectedImpact: 'Reduce petty theft and crowd friction by 35%.'
  },
  {
    id: 'rec-2',
    priority: 'high',
    district: 'Mysore',
    recommendation: 'Deploy 20 additional officers to Mysore Palace grounds.',
    reason: 'Impending Mysuru Dasara festival crowd surge with elevated historical risk.',
    expectedImpact: 'Prevent pickpocketing and street incidents during tourist peak.'
  },
  {
    id: 'rec-3',
    priority: 'high',
    district: 'Gulbarga',
    recommendation: 'Establish temporary checkposts along highways and dispatch tactical units.',
    reason: 'Political rally tensions showing historical correlation with minor clashes.',
    expectedImpact: 'Maintain public order and ensure prompt incident response.'
  },
  {
    id: 'rec-4',
    priority: 'medium',
    district: 'Belgaum',
    recommendation: 'Increase CCTV monitoring and double night patrol shifts.',
    reason: 'Spike in interstate vehicle thefts reported along boundary checkposts.',
    expectedImpact: 'Improve stolen vehicle interception rate by 25%.'
  },
  {
    id: 'rec-5',
    priority: 'low',
    district: 'Dakshina Kannada',
    recommendation: 'Strengthen port checkpoint and harbor scanner patrols.',
    reason: 'Contraband movements flagged along maritime trade corridor routes.',
    expectedImpact: 'Deter narcotics smuggling and secure critical transit lanes.'
  }
];

const mockRiskForecasts: RiskForecastPoint[] = [];
const baseDate = new Date('2026-06-13');
for (let i = 0; i < 90; i++) {
  const date = new Date(baseDate);
  date.setDate(baseDate.getDate() + i);
  const dateString = date.toISOString().split('T')[0];
  
  const theft = Math.round(50 + 20 * Math.sin(i / 5) + Math.random() * 8);
  const assault = Math.round(30 + 10 * Math.sin(i / 7) + Math.random() * 5);
  const cyber = Math.round(40 + 15 * Math.cos(i / 10) + Math.random() * 6);
  const narcotics = Math.round(15 + 8 * Math.sin(i / 12) + Math.random() * 3);
  
  mockRiskForecasts.push({
    date: dateString,
    theft,
    assault,
    cyber,
    narcotics
  });
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RiskAssessment {
  id: string;
  district: string;
  overallScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  trend: 'increasing' | 'stable' | 'decreasing';
  predictedCrimes: number;
  currentCrimes: number;
  confidence: number;
  recommendedAction: string;
  topCrimeTypes: string[];
  lastUpdated: string;
}

export interface RiskScore {
  zoneId: string;
  overall: number;
  breakdown: {
    crimeFrequency: number;
    crimeSeverity: number;
    recentTrend: number;
    historicalPattern: number;
    environmentalFactors: number;
  };
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
}

export interface RiskFactor {
  name: string;
  score: number;
  weight: number;
  description: string;
  trend: 'increasing' | 'stable' | 'decreasing';
}

export interface RiskDriver {
  id: string;
  name: string;
  impactScore: number;
  confidence: number;
  category: string;
}

export interface ResourceRecommendation {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  district: string;
  recommendation: string;
  reason: string;
  expectedImpact: string;
}

export interface RiskForecastPoint {
  date: string;
  theft: number;
  assault: number;
  cyber: number;
  narcotics: number;
}

export interface RiskFilters {
  riskLevel?: string;
  district?: string | null;
  minScore?: number;
  maxScore?: number;
}
