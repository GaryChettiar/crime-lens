import * as React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface DistrictForecast {
  district: string;
  predictedIncidents: number;
  change: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  topCategory: string;
  confidence: number;
}

interface DistrictForecastTableProps {
  data?: DistrictForecast[];
}

const RISK_COLORS: Record<string, string> = {
  low: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  high: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  critical: 'bg-red-500/15 text-red-400 border-red-500/30',
};

const MOCK_DATA: DistrictForecast[] = [
  { district: 'Bengaluru Urban', predictedIncidents: 428, change: 12.4, riskLevel: 'high', topCategory: 'Vehicle Theft', confidence: 78 },
  { district: 'Mysuru', predictedIncidents: 187, change: -3.2, riskLevel: 'medium', topCategory: 'Robbery', confidence: 72 },
  { district: 'Tumakuru', predictedIncidents: 142, change: 5.6, riskLevel: 'medium', topCategory: 'Theft', confidence: 65 },
  { district: 'Belagavi', predictedIncidents: 213, change: 18.9, riskLevel: 'critical', topCategory: 'Assault', confidence: 81 },
  { district: 'Kalaburagi', predictedIncidents: 156, change: -1.5, riskLevel: 'medium', topCategory: 'Cyber Crime', confidence: 59 },
  { district: 'Mangaluru', predictedIncidents: 98, change: -8.1, riskLevel: 'low', topCategory: 'Fraud', confidence: 74 },
  { district: 'Shivamogga', predictedIncidents: 121, change: 2.3, riskLevel: 'medium', topCategory: 'Theft', confidence: 68 },
  { district: 'Ballari', predictedIncidents: 167, change: 24.7, riskLevel: 'critical', topCategory: 'Narcotics', confidence: 83 },
];

/**
 * DistrictForecastTable — Shows predicted incident counts per district with risk levels.
 * Uses mock data until forecast API is configured.
 * Pass `data` prop to use live API data.
 */
export function DistrictForecastTable({ data }: DistrictForecastTableProps) {
  const tableData = data ?? MOCK_DATA;
  const isLive = Boolean(data && data.length > 0);

  return (
    <div className="bg-card/60 border border-border/60 rounded-xl overflow-hidden backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <span className="text-xs font-semibold text-foreground">District Risk Forecast</span>
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
            isLive
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          }`}
        >
          {isLive ? 'Live API' : 'Mock Data'}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/40">
              {['District', 'Predicted', 'Change', 'Risk Level', 'Top Category', 'Confidence'].map((h) => (
                <th
                  key={h}
                  className="px-4 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wide"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((row) => {
              const resolvedRiskLevel = row.riskLevel.toString().toLowerCase();
              return (
              <tr key={row.district} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-2.5 font-medium text-foreground">{row.district}</td>
                <td className="px-4 py-2.5 font-data text-foreground font-bold">{row.predictedIncidents}</td>
                <td className="px-4 py-2.5">
                  <div className={`flex items-center gap-1 font-semibold ${row.change >= 0 ? 'text-destructive' : 'text-success'}`}>
                    {row.change >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {Math.abs(row.change)}%
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${
                      RISK_COLORS[resolvedRiskLevel] ?? RISK_COLORS.low
                    }`}
                  >
                    {resolvedRiskLevel}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{row.topCategory}</td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 bg-muted/40 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          row.confidence >= 80
                            ? 'bg-success'
                            : row.confidence >= 65
                              ? 'bg-warning'
                              : 'bg-destructive/70'
                        }`}
                        style={{ width: `${row.confidence}%` }}
                      />
                    </div>
                    <span className="font-data text-muted-foreground">{row.confidence}%</span>
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
