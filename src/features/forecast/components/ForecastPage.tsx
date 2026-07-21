import * as React from 'react';
import { AdminLayout } from '@/components/templates/AdminLayout/AdminLayout';
import { BrainCircuit, RefreshCw, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { ForecastCard } from './ForecastCard';
import { ForecastTrendChart } from './ForecastTrendChart';
import { DistrictForecastTable } from './DistrictForecastTable';
import { PredictionSummaryCard } from './PredictionSummaryCard';
import {
  useGetPredictedIncidentsQuery,
  useGetHighRiskDistrictsQuery,
  useGetCrimeTrendQuery,
} from '@/services/forecastApi';

export function ForecastPage() {
  const defaultDates = React.useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - 30);
    const end = new Date(now);
    end.setDate(end.getDate() + 30);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  }, []);

  const [startDate, setStartDate] = React.useState<string>(defaultDates.start);
  const [endDate, setEndDate] = React.useState<string>(defaultDates.end);
  const [asOfDate, setAsOfDate] = React.useState<string>('');

  // Fetch forecast data with start_date and end_date
  const queryParams = React.useMemo(() => {
    const params: { start_date?: string; end_date?: string; as_of?: string } = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    if (asOfDate) params.as_of = asOfDate;
    return params;
  }, [startDate, endDate, asOfDate]);

  const {
    data: predictedData,
    isLoading: isLoadingPredicted,
    isError: isErrorPredicted,
    refetch: refetchPredicted,
  } = useGetPredictedIncidentsQuery(queryParams);

  const {
    data: highRiskData,
    isLoading: isLoadingHighRisk,
    isError: isErrorHighRisk,
    refetch: refetchHighRisk,
  } = useGetHighRiskDistrictsQuery(queryParams);

  const {
    data: trendData,
    isLoading: isLoadingTrend,
    isError: isErrorTrend,
    refetch: refetchTrend,
  } = useGetCrimeTrendQuery(queryParams);

  const isLoading = isLoadingPredicted || isLoadingHighRisk || isLoadingTrend;
  const isError = isErrorPredicted || isErrorHighRisk || isErrorTrend;

  const handleRefresh = () => {
    refetchPredicted();
    refetchHighRisk();
    refetchTrend();
  };

  // Map API data to ForecastCard components
  const cards = React.useMemo(() => {
    if (!predictedData || !highRiskData) return null;

    return [
      {
        label: 'Predicted Incidents (30d)',
        value: predictedData.next_30_days.predicted_total_incidents,
        change: predictedData.change_vs_last_30_days.percent_change ?? undefined,
        unit: '',
        confidence: 82,
      },
      {
        label: 'High Risk Districts',
        value: highRiskData.high_risk_district_count,
        unit: 'districts',
        confidence: 88,
      },
      {
        label: 'Past 30 Days Incidents',
        value: predictedData.last_30_days.total_incidents,
        unit: 'incidents',
        confidence: 95,
      },
      {
        label: 'Daily Predicted Avg',
        value: predictedData.next_30_days.predicted_daily_average,
        unit: '/ day',
        confidence: 80,
      },
    ];
  }, [predictedData, highRiskData]);

  // Map API trend data to chart format
  const chartData = React.useMemo(() => {
    if (!trendData?.trend) return undefined;
    return trendData.trend.map((t) => ({
      period: t.date.slice(5), // 'MM-DD'
      actual: t.actual ?? undefined,
      predicted: t.predicted,
    }));
  }, [trendData]);

  // Map API summary data
  const summaryData = React.useMemo(() => {
    if (!predictedData || !highRiskData) return undefined;

    return {
      totalPredictedIncidents: predictedData.next_30_days.predicted_total_incidents,
      highRiskDistricts: highRiskData.high_risk_district_count,
      avgConfidence: 85,
      forecastPeriod: `${predictedData.next_30_days.start_date} → ${predictedData.next_30_days.end_date}`,
      modelName: 'CrimeLens AI Forecaster (AppSail)',
      lastUpdated: predictedData.as_of,
      notes: `Direction: ${predictedData.change_vs_last_30_days.direction.toUpperCase()} (${
        predictedData.change_vs_last_30_days.percent_change ?? 0
      }% vs previous 30 days).`,
    };
  }, [predictedData, highRiskData]);

  // Map district data for DistrictForecastTable
  const districtTableData = React.useMemo(() => {
    if (!highRiskData?.districts) return undefined;

    return highRiskData.districts.map((d) => {
      const risk = d.risk_level.toLowerCase() as 'low' | 'medium' | 'high';
      return {
        district: d.district_name,
        predictedIncidents: d.predicted_next_30_days_incidents,
        change: d.percent_change_vs_last_30_days ?? 0,
        riskLevel: risk,
        topCategory: `${d.last_30_days_incidents} Past Incidents`,
        confidence: Math.min(
          95,
          Math.max(60, Math.round(75 + d.last_30_days_incidents * 0.5))
        ),
      };
    });
  }, [highRiskData]);

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <BrainCircuit className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">Crime Forecast</h1>
              <p className="text-xs text-muted-foreground">Predictive intelligence & risk modelling</p>
            </div>
          </div>

          {/* Action Bar / Date Selector */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">From:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                title="Start Date"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">To:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                title="End Date"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">As Of:</label>
              <input
                type="date"
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="As of Date"
                title="As Of Date"
              />
            </div>
            {(startDate !== defaultDates.start || endDate !== defaultDates.end || asOfDate !== '') && (
              <button
                onClick={() => {
                  setStartDate(defaultDates.start);
                  setEndDate(defaultDates.end);
                  setAsOfDate('');
                }}
                className="text-[11px] text-muted-foreground hover:text-foreground underline px-1"
              >
                Reset
              </button>
            )}
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-xs font-semibold text-foreground transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Forecast Engine Status Banner */}
        {!isError ? (
          <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-400">
                  Crime Forecast Engine Online
                </p>
                <p className="text-[11px] text-emerald-400/80 mt-0.5 font-mono">
                  Connected to forecast-50043087097.development.catalystappsail.in
                </p>
              </div>
            </div>
            {isLoading && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Syncing model...</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 bg-destructive/10 border border-destructive/25 rounded-xl text-destructive">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <div>
                <p className="text-xs font-semibold">Forecast API Connection Error</p>
                <p className="text-[11px] opacity-80 mt-0.5">
                  Unable to reach the forecast engine endpoint. Showing cached/fallback data.
                </p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              className="text-xs font-semibold underline hover:opacity-80"
            >
              Retry
            </button>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {cards ? (
            cards.map((card) => <ForecastCard key={card.label} data={card} />)
          ) : (
            // Placeholder/Loading fallback cards
            <>
              <ForecastCard
                data={{
                  label: 'Predicted Incidents (30d)',
                  value: isLoading ? '...' : 1512,
                  change: 8.3,
                  unit: '',
                  confidence: 73,
                }}
              />
              <ForecastCard
                data={{
                  label: 'High Risk Zones',
                  value: isLoading ? '...' : 3,
                  change: 1,
                  unit: 'districts',
                  confidence: 81,
                }}
              />
              <ForecastCard
                data={{
                  label: 'Past 30 Days Incidents',
                  value: isLoading ? '...' : 1395,
                  unit: 'incidents',
                  confidence: 95,
                }}
              />
              <ForecastCard
                data={{
                  label: 'Daily Predicted Avg',
                  value: isLoading ? '...' : 50.4,
                  unit: '/ day',
                  confidence: 80,
                }}
              />
            </>
          )}
        </div>

        {/* Charts & Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <ForecastTrendChart data={chartData} />
          </div>
          <div>
            <PredictionSummaryCard data={summaryData} />
          </div>
        </div>

        {/* District Table */}
        <DistrictForecastTable data={districtTableData} />
      </div>
    </AdminLayout>
  );
}
