/**
 * Forecast Feature — Barrel Exports
 *
 * Architecture note: All components accept optional `data` props.
 * When undefined, they use mock data. When provided (from live API),
 * they display real forecast data. This is the plug-in contract.
 */
export { ForecastPage } from './components/ForecastPage';
export { ForecastCard } from './components/ForecastCard';
export { ForecastTrendChart } from './components/ForecastTrendChart';
export { DistrictForecastTable } from './components/DistrictForecastTable';
export { PredictionSummaryCard } from './components/PredictionSummaryCard';

export type { ForecastCardData } from './components/ForecastCard';
export type { TrendDataPoint } from './components/ForecastTrendChart';
export type { DistrictForecast } from './components/DistrictForecastTable';
export type { PredictionSummary } from './components/PredictionSummaryCard';
