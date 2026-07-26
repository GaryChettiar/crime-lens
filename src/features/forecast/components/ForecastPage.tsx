import * as React from 'react';
import { AdminLayout } from '@/components/templates/AdminLayout/AdminLayout';
import { BrainCircuit, RefreshCw, CheckCircle2, AlertCircle, Loader2, ShieldAlert, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/atoms/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useIntelligence, computeIntelligenceScore } from '@/features/intelligence';
import { ForecastCard } from './ForecastCard';
import { ForecastTrendChart } from './ForecastTrendChart';
import { DistrictForecastTable } from './DistrictForecastTable';
import { PredictionSummaryCard } from './PredictionSummaryCard';
import {
  useGetModelStatusQuery,
  useGetPredictedIncidentsQuery,
  useGetHighRiskDistrictsQuery,
  useGetCrimeTrendQuery,
  useTrainModelMutation,
} from '@/services/forecastApi';
import { useAnalyticsFilters } from '@/hooks/useAnalyticsFilters';
import { useGetCurrentUserQuery } from '@/services/authApi';
import { useGetDistrictsQuery } from '@/services/districtsApi';
import { useGetStationsQuery } from '@/services/policeStationsApi';
import { useAppSelector } from '@/store/hooks';

export function ForecastPage() {
  // Sector Safety Matrix state + OSINT
  const [sectorSelectedDistrict, setSectorSelectedDistrict] = React.useState<string>('all');
  const { classifiedArticles, isAvailable } = useIntelligence();

  const sectorTableData = React.useMemo(() => {
    return Object.entries(DISTRICT_BASE_METRICS).map(([district, metrics]) => {
      const intelScore = computeIntelligenceScore(classifiedArticles, district);

      const compositeScore = Math.round(
        metrics.historical * 0.35 +
        metrics.forecast * 0.25 +
        intelScore * 0.20 +
        metrics.crowd * 0.20
      );

      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (compositeScore >= 75) riskLevel = 'critical';
      else if (compositeScore >= 50) riskLevel = 'high';
      else if (compositeScore >= 30) riskLevel = 'medium';

      return {
        district,
        historical: metrics.historical,
        forecast: metrics.forecast,
        crowd: metrics.crowd,
        intel: intelScore,
        composite: compositeScore,
        riskLevel,
      };
    }).sort((a, b) => b.composite - a.composite);
  }, [classifiedArticles]);

  const sectorSelectedMetrics = React.useMemo(() => {
    if (sectorSelectedDistrict === 'all') {
      return { historical: 55, forecast: 53, crowd: 38 };
    }
    const base = DISTRICT_BASE_METRICS[sectorSelectedDistrict];
    return base || { historical: 40, forecast: 40, crowd: 30 };
  }, [sectorSelectedDistrict]);

  const getRiskLevelBadge = (level: 'low' | 'medium' | 'high' | 'critical') => {
    switch (level) {
      case 'critical':
        return <Badge variant="risk-critical" size="sm">Critical</Badge>;
      case 'high':
        return <Badge variant="risk-high" size="sm">High</Badge>;
      case 'medium':
        return <Badge variant="risk-medium" size="sm">Medium</Badge>;
      case 'low':
      default:
        return <Badge variant="risk-low" size="sm">Low</Badge>;
    }
  };
  const {
    districtId: contextDistrictId,
    stationId: contextStationId,
    startDate: contextStartDate,
    endDate: contextEndDate,
    setStartDate: setContextStartDate,
    setEndDate: setContextEndDate,
  } = useAnalyticsFilters();
  const { data: currentUser } = useGetCurrentUserQuery();
  const globalFilters = useAppSelector((state) => state.globalFilters);
  const { data: districtsData } = useGetDistrictsQuery();
  const { data: stationsData } = useGetStationsQuery();

  const districtId = React.useMemo(() => {
    if (contextDistrictId) return contextDistrictId;
    if (currentUser?.districtId) return currentUser.districtId;

    const districtName = globalFilters.district;
    if (!districtName || districtName === 'all' || !districtsData) return null;

    const matchedDistrict = districtsData.find(
      (district) => district.name?.toLowerCase() === districtName.toLowerCase(),
    );

    return matchedDistrict?.id ?? null;
  }, [contextDistrictId, currentUser?.districtId, globalFilters.district, districtsData]);

  const stationId = React.useMemo(() => {
    if (contextStationId) return contextStationId;
    if (currentUser?.stationId) return currentUser.stationId;

    const stationName = globalFilters.selectedPoliceStations?.[0];
    if (!stationName || !stationsData) return null;

    const matchedStation = stationsData.find(
      (station) => station.name?.toLowerCase() === stationName.toLowerCase(),
    );

    return matchedStation?.id ?? null;
  }, [contextStationId, currentUser?.stationId, globalFilters.selectedPoliceStations, stationsData]);
console.log(districtId)
  const [asOfDate, setAsOfDate] = React.useState<string>('');
  const [trainStatusMessage, setTrainStatusMessage] = React.useState<string | null>(null);

  const [trainModel, { isLoading: isTraining }] = useTrainModelMutation();

  const {
    data: modelStatusData,
    isLoading: isLoadingModelStatus,
    isError: isErrorModelStatus,
    refetch: refetchModelStatus,
  } = useGetModelStatusQuery();

  // Fetch forecast data with start_date and end_date
  const queryParams = React.useMemo(() => {
    const params: {
      start_date?: string;
      end_date?: string;
      as_of?: string;
      district_id?: string;
      station_id?: string;
      districtId?: string;
      stationId?: string;
    } = {};

    if (contextStartDate) params.start_date = contextStartDate;
    if (contextEndDate) params.end_date = contextEndDate;
    if (asOfDate) params.as_of = asOfDate;
    if (districtId) {
      params.district_id = districtId;
      params.districtId = districtId;
    }
    if (stationId) {
      params.station_id = stationId;
      params.stationId = stationId;
    }

    return params;
  }, [contextStartDate, contextEndDate, asOfDate, districtId, stationId]);

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

  const isLoading = isLoadingPredicted || isLoadingHighRisk || isLoadingTrend || isLoadingModelStatus;
  const isError = isErrorPredicted || isErrorHighRisk || isErrorTrend || isErrorModelStatus;

  const handleRefresh = () => {
    refetchPredicted();
    refetchHighRisk();
    refetchTrend();
    refetchModelStatus();
  };

  const handleTrainModel = async () => {
    try {
      setTrainStatusMessage('Training forecast model...');
      const res = await trainModel().unwrap();
      const detail = res.message || (res.model_type ? `Model: ${res.model_type}` : 'Model refreshed');
      setTrainStatusMessage(`Forecast model ready. ${detail}`);
      setTimeout(() => setTrainStatusMessage(null), 6000);
      handleRefresh();
    } catch (err) {
      setTrainStatusMessage('Model training failed.');
      setTimeout(() => setTrainStatusMessage(null), 6000);
    }
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

    const modelMetadata = (modelStatusData?.model_metadata ?? {}) as Record<string, unknown>;
    const trainingState = (modelStatusData?.training_state ?? {}) as Record<string, unknown>;
    const modelName =
      typeof predictedData.model_used === 'string' && predictedData.model_used.trim()
        ? predictedData.model_used
        : typeof modelMetadata.model_type === 'string' && modelMetadata.model_type.trim()
          ? modelMetadata.model_type
          : 'CrimeLens AI Forecaster (AppSail)';

    const notes = [
      `Direction: ${predictedData.change_vs_last_30_days.direction.toUpperCase()} (${predictedData.change_vs_last_30_days.percent_change ?? 0}% vs previous 30 days).`,
      typeof modelMetadata.message === 'string' && modelMetadata.message.trim()
        ? modelMetadata.message
        : undefined,
    ].filter(Boolean) as string[];

    return {
      totalPredictedIncidents: predictedData.next_30_days.predicted_total_incidents,
      highRiskDistricts: highRiskData.high_risk_district_count,
      avgConfidence: modelStatusData?.warm ? 86 : 72,
      forecastPeriod: `${predictedData.next_30_days.start_date} → ${predictedData.next_30_days.end_date}`,
      modelName,
      lastUpdated:
        typeof predictedData.as_of === 'string'
          ? predictedData.as_of
          : typeof trainingState.last_trained_at === 'string'
            ? trainingState.last_trained_at
            : undefined,
      notes: notes.join(' '),
    };
  }, [predictedData, highRiskData, modelStatusData]);

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
                value={contextStartDate ?? ''}
                onChange={(e) => setContextStartDate(e.target.value || null)}
                className="px-2.5 py-1.5 rounded-lg border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                title="Start Date"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">To:</label>
              <input
                type="date"
                value={contextEndDate ?? ''}
                onChange={(e) => setContextEndDate(e.target.value || null)}
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
            {(contextStartDate || contextEndDate || asOfDate) && (
              <button
                onClick={() => {
                  setContextStartDate(null);
                  setContextEndDate(null);
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
            <button
              onClick={handleTrainModel}
              disabled={isTraining}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
              title="Train CatBoost Regressor on latest incident dataset"
            >
              <BrainCircuit className={`h-3.5 w-3.5 ${isTraining ? 'animate-spin' : ''}`} />
              {isTraining ? 'Training...' : 'Train Model'}
            </button>
          </div>
        </div>

        {/* Training Notification Banner */}
        {trainStatusMessage && (
          <div className="flex items-center justify-between p-3.5 bg-primary/10 border border-primary/25 rounded-xl text-primary animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center gap-2.5">
              <BrainCircuit className="h-4 w-4 shrink-0 animate-pulse" />
              <span className="text-xs font-semibold">{trainStatusMessage}</span>
            </div>
          </div>
        )}

        {/* Forecast Engine Status Banner */}
        {!isError ? (
          <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-400">
                  {modelStatusData?.warm ? 'Crime Forecast Engine Online' : 'Forecast model warming up'}
                </p>
                <p className="text-[11px] text-emerald-400/80 mt-0.5 font-mono">
                  {typeof (modelStatusData?.model_metadata as Record<string, unknown> | undefined)?.model_type === 'string'
                    ? String((modelStatusData?.model_metadata as Record<string, unknown>).model_type)
                    : 'Connected to forecast-50043087097.development.catalystappsail.in'}
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

        {/* Sector Safety Matrix (moved from RiskPage) */}
        <Card className="lg:col-span-2 bg-card/45 border-border/80 backdrop-blur-sm shadow-md overflow-hidden mt-4">
          <CardHeader className="p-4 border-b border-border bg-card/20 flex flex-row items-center justify-between shrink-0">
            <div>
              <CardTitle className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-danger animate-pulse" />
                Sector Safety Matrix
              </CardTitle>
              <CardDescription className="text-[11px] mt-0.5">Click on a sector row to view localized driver details.</CardDescription>
            </div>
            {!isAvailable && (
              <Badge variant="outline" className="text-warning/60 border-warning/20 bg-warning/5 text-[9px] uppercase tracking-wider font-bold">
                OSINT Offline
              </Badge>
            )}
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-950/40">
                  <TableRow className="border-b border-border/50 hover:bg-transparent">
                    <TableHead className="text-[10px] uppercase font-bold tracking-wider py-3 pl-4">District Sector</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold tracking-wider text-center py-3">Historical</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold tracking-wider text-center py-3">Forecast</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold tracking-wider text-center py-3 text-warning font-semibold">OSINT Intel</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold tracking-wider text-center py-3">Composite</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold tracking-wider text-right py-3 pr-4">Threat Level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sectorTableData.map((row) => {
                    const isSelected = sectorSelectedDistrict === row.district;
                    return (
                      <TableRow
                        key={row.district}
                        onClick={() => setSectorSelectedDistrict(row.district)}
                        className={`border-b border-border/40 transition-colors cursor-pointer hover:bg-muted/15 ${
                          isSelected ? 'bg-primary/5 hover:bg-primary/10 border-l-2 border-l-primary' : ''
                        }`}
                      >
                        <TableCell className="font-semibold text-xs py-3 pl-4 flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          {row.district}
                        </TableCell>
                        <TableCell className="text-center font-data text-xs py-3 text-muted-foreground">{row.historical}</TableCell>
                        <TableCell className="text-center font-data text-xs py-3 text-muted-foreground">{row.forecast}</TableCell>
                        <TableCell className="text-center font-data text-xs py-3 font-semibold text-warning">{row.intel}</TableCell>
                        <TableCell className="text-center font-data text-xs py-3 font-black text-foreground">{row.composite}</TableCell>
                        <TableCell className="text-right py-3 pr-4">{getRiskLevelBadge(row.riskLevel)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* District Table */}
        {/* <DistrictForecastTable data={districtTableData} /> */}
      </div>
    </AdminLayout>
  );
}

// District mock metrics (historical & forecasts) moved from RiskPage
const DISTRICT_BASE_METRICS: Record<string, { historical: number; forecast: number; crowd: number }> = {
  'Bengaluru Urban': { historical: 78, forecast: 85, crowd: 65 },
  'Mysuru': { historical: 54, forecast: 48, crowd: 40 },
  'Belagavi': { historical: 48, forecast: 62, crowd: 35 },
  'Dakshina Kannada': { historical: 62, forecast: 55, crowd: 50 },
  'Hubballi-Dharwad': { historical: 58, forecast: 52, crowd: 30 },
  'Kalaburagi': { historical: 50, forecast: 42, crowd: 45 },
  'Ballari': { historical: 45, forecast: 48, crowd: 25 },
  'Tumakuru': { historical: 38, forecast: 35, crowd: 20 },
  'Shivamogga': { historical: 42, forecast: 50, crowd: 30 },
};
