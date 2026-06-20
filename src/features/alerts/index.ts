/**
 * Alerts Feature
 *
 * Real-time alerts, notifications, and threshold-based warnings.
 */

export {
  useGetAlertsQuery,
  useGetAlertTimelineQuery,
  useGetAlertResponsesQuery,
  useGetAlertAnalyticsQuery,
} from '@/services/alertsApi';

export type {
  Alert,
  AlertFilters,
  AlertTimelineStage,
  AlertResponseAction,
  AlertAnalytics,
} from '@/services/alertsApi';

export { AlertsPage } from './components/AlertsPage';
