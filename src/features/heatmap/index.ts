/**
 * Heatmap Feature
 *
 * Geographic crime heatmap visualization and hotspot analysis.
 */
export {
  useGetHotspotsQuery,
  useGetHeatmapDataQuery,
  useGetHotspotPredictionsQuery,
} from '@/services/hotspotApi';
export type { Hotspot, HeatmapPoint, HotspotPrediction } from '@/services/hotspotApi';
export { HeatmapPage } from './components/HeatmapPage';
