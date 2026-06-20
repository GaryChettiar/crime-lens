/**
 * Risk Feature
 *
 * Zone-based risk assessment, scoring, and factor analysis.
 */
export {
  useGetRiskAssessmentsQuery,
  useGetRiskScoreQuery,
  useGetRiskFactorsQuery,
  useGetRiskDriversQuery,
  useGetResourceRecommendationsQuery,
  useGetRiskForecastPointsQuery,
} from '@/services/riskApi';
export type {
  RiskAssessment,
  RiskScore,
  RiskFactor,
  RiskDriver,
  ResourceRecommendation,
  RiskForecastPoint,
} from '@/services/riskApi';
export { RiskPage } from './components/RiskPage';
