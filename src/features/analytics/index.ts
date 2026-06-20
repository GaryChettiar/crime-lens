/**
 * Analytics Feature
 *
 * Crime trend analysis, statistical breakdowns, and comparative analytics.
 */
export {
  useGetCrimesQuery,
  useGetCrimeCategoriesQuery,
  useGetCrimeTrendsQuery,
} from '@/services/crimeApi';
export type { TrendData, TrendFilters, CrimeCategory } from '@/services/crimeApi';
export { AnalyticsPage } from './components/AnalyticsPage';
