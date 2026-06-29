import * as React from 'react';
import { BrainCircuit, AlertTriangle, Info } from 'lucide-react';

export interface PredictionSummary {
  totalPredictedIncidents: number;
  highRiskDistricts: number;
  avgConfidence: number;
  forecastPeriod: string;
  modelName?: string;
  lastUpdated?: string;
  notes?: string;
}

interface PredictionSummaryCardProps {
  data?: PredictionSummary;
}

const MOCK_SUMMARY: PredictionSummary = {
  totalPredictedIncidents: 1512,
  highRiskDistricts: 3,
  avgConfidence: 73,
  forecastPeriod: 'Next 30 Days',
  modelName: 'CrimeLens Forecast v1 (Pending)',
  lastUpdated: 'Not available',
  notes: 'Forecast engine is not yet configured. These figures are mock data for UI demonstration.',
};

/**
 * PredictionSummaryCard — Summary card showing key forecast KPIs.
 * Pass `data` prop to use live API data when forecast engine is ready.
 */
export function PredictionSummaryCard({ data }: PredictionSummaryCardProps) {
  const summary = data ?? MOCK_SUMMARY;
  const isMock = !data;

  return (
    <div className="bg-card/60 border border-border/60 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <BrainCircuit className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">Prediction Summary</p>
            <p className="text-[10px] text-muted-foreground">{summary.forecastPeriod}</p>
          </div>
        </div>
        {isMock && (
          <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full shrink-0">
            Mock Data
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-muted/20 rounded-lg p-2.5 text-center">
          <p className="text-xl font-bold text-foreground font-data">{summary.totalPredictedIncidents.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Predicted Incidents</p>
        </div>
        <div className="bg-muted/20 rounded-lg p-2.5 text-center">
          <p className="text-xl font-bold text-destructive font-data">{summary.highRiskDistricts}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">High Risk Districts</p>
        </div>
        <div className="bg-muted/20 rounded-lg p-2.5 text-center">
          <p className="text-xl font-bold text-foreground font-data">{summary.avgConfidence}%</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Avg Confidence</p>
        </div>
      </div>

      <div className="space-y-1.5 border-t border-border/40 pt-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">Model</span>
          <span className="text-[10px] text-foreground font-medium">{summary.modelName ?? '—'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">Last Updated</span>
          <span className="text-[10px] text-foreground font-data">{summary.lastUpdated ?? '—'}</span>
        </div>
      </div>

      {summary.notes && (
        <div className="mt-3 p-2.5 bg-amber-500/5 border border-amber-500/20 rounded-lg flex items-start gap-2">
          <Info className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">{summary.notes}</p>
        </div>
      )}
    </div>
  );
}
