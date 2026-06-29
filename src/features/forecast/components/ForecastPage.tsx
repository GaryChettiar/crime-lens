import * as React from 'react';
import { AdminLayout } from '@/components/templates/AdminLayout/AdminLayout';
import { BrainCircuit, AlertTriangle, Zap } from 'lucide-react';
import { ForecastCard } from './ForecastCard';
import { ForecastTrendChart } from './ForecastTrendChart';
import { DistrictForecastTable } from './DistrictForecastTable';
import { PredictionSummaryCard } from './PredictionSummaryCard';

const MOCK_CARDS = [
  { label: 'Predicted Incidents (30d)', value: 1512, change: 8.3, unit: '', confidence: 73 },
  { label: 'High Risk Zones', value: 3, change: 1, unit: 'districts', confidence: 81 },
  { label: 'Avg Response Time Trend', value: '14.2', change: -4.7, unit: 'min', confidence: 65 },
  { label: 'Crime Reduction Target', value: '82', change: -2.1, unit: '%', confidence: 58 },
];

/**
 * ForecastPage — Crime prediction command centre.
 *
 * ARCHITECTURE NOTE:
 * The forecast engine is not yet configured. This page renders placeholder components
 * that accept `data` props. When the Crime Prediction API is ready:
 * 1. Inject data via RTK Query into each component's `data` prop
 * 2. Remove the "No forecast engine configured" notice
 * 3. Update PredictionSummaryCard with real model metadata
 *
 * DO NOT implement AI forecasting logic here — keep this modular.
 */
export function ForecastPage() {
  return (
    <AdminLayout>
      <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <BrainCircuit className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Crime Forecast</h1>
            <p className="text-xs text-muted-foreground">Predictive intelligence & risk modelling</p>
          </div>
        </div>

        {/* Engine Not Configured Notice */}
        <div className="flex items-start gap-4 p-5 bg-amber-500/5 border border-amber-500/20 rounded-xl">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">No forecast engine configured.</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              The Crime Prediction AI has not been connected to this instance. All figures below are
              mock data for UI demonstration only. Once the Crime Prediction API is integrated, this
              notice will be removed and real forecast data will populate these components automatically.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wide">
                Ready for integration — plug in the API endpoint to go live
              </span>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {MOCK_CARDS.map((card) => (
            <ForecastCard key={card.label} data={card} />
          ))}
        </div>

        {/* Charts & Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <ForecastTrendChart />
          </div>
          <div>
            <PredictionSummaryCard />
          </div>
        </div>

        {/* District Table */}
        <DistrictForecastTable />

        {/* Future integration section */}
        <div className="bg-card/40 border border-dashed border-primary/20 rounded-xl p-6 text-center">
          <BrainCircuit className="h-8 w-8 text-primary/40 mx-auto mb-3" />
          <p className="text-sm font-semibold text-muted-foreground">Crime Prediction API</p>
          <p className="text-xs text-muted-foreground/70 mt-1 max-w-md mx-auto">
            Connect the forecast engine by providing the Crime Prediction API endpoint in environment
            configuration. The UI is ready to display live predictions, confidence intervals,
            and hotspot risk scores.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
