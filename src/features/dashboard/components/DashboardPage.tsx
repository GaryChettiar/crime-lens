"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/templates/DashboardLayout";

import { MetricCard } from "@/components/molecules/MetricCard";
import { FilterPanel } from "@/components/organisms/FilterPanel";
import {
  CrimeDataTable,
  type CrimeIncident,
} from "@/components/organisms/CrimeDataTable";
import {
  AlertCenter,
  type AlertData,
} from "@/components/organisms/AlertCenter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Typography } from "@/components/atoms/Typography";
import { Badge } from "@/components/atoms/Badge";
import { Separator } from "@/components/ui/separator";
import { GeospatialMapContainer } from "@/features/geospatial";
import { ExternalIntelligenceWidget } from "@/features/intelligence";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Link } from "react-router-dom";
import { ArrowRight, Brain, ChevronRight } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setDistrict,
  setCrimeTypes,
  setSeverities,
  setDateRange,
  resetFilters,
} from "@/store/slices/globalFiltersSlice";
import { useAnalyticsFilters } from "@/hooks/useAnalyticsFilters";

import { useGetDistrictMetricsQuery } from "@/services/districtsApi";
import { useGetCrimesQuery } from "@/services/crimeApi";
import { useGetCrimeCategoriesQuery } from "@/services/crimeCategoryApi";
import { useGetRiskForecastsQuery } from "@/services/riskApi";
import { useGetCrimeCountWithPreviousYearQuery } from "@/services/dashboardApi";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PermissionGuard } from '@/features/auth';
import { buildCrimeQuery, haveCrimeFiltersChanged } from '@/utils/buildQueryParams';

const CUSTOM_TOOLTIP_STYLE = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '6px',
  fontSize: '11px',
  color: 'hsl(var(--foreground))',
};

// Formats an ISO date string ("2025-04-06") into a short chart label ("Apr 6")
function formatChartDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="size-1 rounded-full bg-primary" />
      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">{children}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

const INITIAL_ALERTS: AlertData[] = [
  {
    id: "a1",
    type: "crime-spike",
    title: "Spike in Armed Robberies",
    message:
      "Downtown robbery frequency exceeds standard limits by 40% in past 12h.",
    severity: "critical",
    timestamp: "15m ago",
    read: false,
  },
  {
    id: "a2",
    type: "threshold-breach",
    title: "Response Queue Threshold Breach",
    message:
      "911 response dispatch backlog in Sector 5 exceeds AAA target SLA metrics.",
    severity: "high",
    timestamp: "45m ago",
    read: false,
  },
  {
    id: "a3",
    type: "pattern-detected",
    title: "Vehicle Break-in Pattern",
    message:
      "Repetitive burglary pattern matching grey sedan suspect in Sector 2.",
    severity: "medium",
    timestamp: "2h ago",
    read: true,
  },
  {
    id: "a4",
    type: "system",
    title: "Visual Node Online",
    message:
      "CCTV Analytics integration nodes verified operational in Sector 4.",
    severity: "low",
    timestamp: "6h ago",
    read: true,
  },
];

export function DashboardPage() {
  const dispatch = useAppDispatch();
  const globalFilters = useAppSelector((state) => state.globalFilters);
  const {
    district: ctxDistrict,
    crimeCategory,
    startDate: ctxStart,
    endDate: ctxEnd,
    districtId,
    stationId,
    setDistrict: setCtxDistrict,
    setCrimeCategory,
    setStartDate,
    setEndDate,
  } = useAnalyticsFilters();

  // Table state
  const [pageSize, setPageSize] = React.useState(10);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [searchQuery, setSearchQuery] = React.useState("");
  const prevFiltersRef = React.useRef(null as any);
  const prevLocationRef = React.useRef({ districtId, stationId });

  // RTK Query hooks
  const { data: districtsMetrics = [], isLoading: isLoadingDistricts } =
    useGetDistrictMetricsQuery();
  // Build server-side crime query using global + analytics filters
  const tableState = React.useMemo(
    () => ({ page: currentPage, pageSize, sortBy: 'crime_occured_date_time', sortOrder: 'desc' }),
    [currentPage, pageSize],
  );

  const locationScope = React.useMemo(
    () => ({ districtId: districtId || undefined, stationId: stationId || undefined }),
    [districtId, stationId],
  );

  const crimeQuery = React.useMemo(
    () => buildCrimeQuery(tableState, globalFilters, searchQuery || '', locationScope),
    [tableState, globalFilters, searchQuery, locationScope],
  );

  const { data: crimesResponse, isLoading: isLoadingIncidents } = useGetCrimesQuery(crimeQuery);
  const { data: categories = [] } = useGetCrimeCategoriesQuery();

  const incidents  = React.useMemo(() => {
    if (!crimesResponse?.data) return [];
    return crimesResponse.data.map(c => {
      const cat = categories.find((cat) => String(cat.ROWID) === String(c.crimeCategory));
      const typeName = cat ? cat.crime_category_name : (c.crimeCategory || "Unknown");

      return {
        id: c.id,
        caseNumber: c.crimeNumber || c.caseNumber || c.id,
        type: typeName,
        categoryId: c.crimeCategory,
        location: c.crimeLocation || c.location?.address || c.district || "Unknown",
        timestamp: c.incidentDate || c.createdAt || "",
        severity: ((c as any).severity || "medium") as "low" | "medium" | "high" | "critical",
        status: (c.status === "closed" ? "closed" : (c.status === "reported" ? "open" : "investigating")) as "closed" | "open" | "investigating" | "resolved",
        description: c.description || c.title || "",
        policeStation: c.assignedStationId || "",
        district: c.district || "",
      };
    });
  }, [crimesResponse, categories]);
  useGetRiskForecastsQuery();

  // Filters read from Context (and Redux for severities)
  const district = ctxDistrict || "all";
  const crimeType = crimeCategory || "all";
  const startDate = ctxStart || "";
  const endDate = ctxEnd || "";
  const selectedSeverities = globalFilters.severities;


  // Search query (local to page search input) moved up

  // ── Crime trend chart: driven by real API data ──
  const trendQueryFilters = React.useMemo(
    () => ({
      districtId: districtId || undefined,
      stationId: stationId || undefined,
      categoryId: globalFilters.crimeTypes[0] || undefined,
      fromDate: globalFilters.dateRange.start || undefined,
      toDate: globalFilters.dateRange.end || undefined,
    }),
    [globalFilters, districtId, stationId],
  );

  const { data: countWithPrevYear, isLoading: isLoadingTrend } =
    useGetCrimeCountWithPreviousYearQuery(trendQueryFilters);

  // Merge current & previous series by index into recharts-friendly rows
  const trendData = React.useMemo(() => {
    const currentSeries = countWithPrevYear?.currentPeriodSeries ?? [];
    const previousSeries = countWithPrevYear?.previousYearSeries ?? [];
    const length = Math.max(currentSeries.length, previousSeries.length);

    return Array.from({ length }, (_, i) => {
      const currentPoint = currentSeries[i];
      const previousPoint = previousSeries[i];
      return {
        day: formatChartDate(currentPoint?.date ?? previousPoint?.date ?? ""),
        current: currentPoint?.count ?? null,
        previous: previousPoint?.count ?? null,
      };
    });
  }, [countWithPrevYear]);

  // Lifted temporal playback states
  const [currentDayOffset, setCurrentDayOffset] = React.useState(30);
  const [timeWindow, setTimeWindow] = React.useState<number | "cumulative">("cumulative");

  // Table state moved up for RTK query
  const [isFiltersOpen, setIsFiltersOpen] = React.useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = React.useState(false);

  // Sync / Refresh states
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [alerts, setAlerts] = React.useState(INITIAL_ALERTS);

  // Detail Dialog state
  const [selectedIncident, setSelectedIncident] =
    React.useState<CrimeIncident | null>(null);

  // Reset pagination when relevant global filters or analytics location change
  React.useEffect(() => {
    if (haveCrimeFiltersChanged(prevFiltersRef.current, globalFilters)) {
      setCurrentPage(1);
    }
    prevFiltersRef.current = globalFilters;
  }, [globalFilters]);

  React.useEffect(() => {
    if (
      prevLocationRef.current.districtId !== districtId ||
      prevLocationRef.current.stationId !== stationId
    ) {
      setCurrentPage(1);
      prevLocationRef.current = { districtId, stationId };
    }
  }, [districtId, stationId]);

  // Sync handler
  const handleRefresh = React.useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      const newAlert: AlertData = {
        id: `a${Date.now()}`,
        type: "system",
        title: "Tactical Streams Updated",
        message:
          "Aggregated analytics pipeline successfully synced with latest CAD log logs.",
        severity: "low",
        timestamp: "Just now",
        read: false,
      };
      setAlerts((prev) => [newAlert, ...prev]);
    }, 1000);
  }, []);

  // Filter actions bound to Redux & Context
  const handleResetFilters = React.useCallback(() => {
    setCtxDistrict(null);
    setCrimeCategory(null);
    setStartDate(null);
    setEndDate(null);
    dispatch(resetFilters());
    setSearchQuery("");
  }, [dispatch, setCtxDistrict, setCrimeCategory, setStartDate, setEndDate]);

  const handleSeverityToggle = React.useCallback(
    (sev: string) => {
      const isSelected = selectedSeverities.includes(sev);
      const updated = isSelected
        ? selectedSeverities.filter((s) => s !== sev)
        : [...selectedSeverities, sev];
      dispatch(setSeverities(updated));
    },
    [dispatch, selectedSeverities],
  );

  const handleRemoveFilter = React.useCallback(
    (id: string) => {
      if (id === "district") setCtxDistrict(null);
      if (id === "crimeType") setCrimeCategory(null);
      if (id === "dateRange") {
        setStartDate(null);
        setEndDate(null);
      }
      if (id.startsWith("sev-")) {
        const sevVal = id.split("sev-")[1];
        dispatch(setSeverities(selectedSeverities.filter((s) => s !== sevVal)));
      }
    },
    [dispatch, selectedSeverities, setCtxDistrict, setCrimeCategory, setStartDate, setEndDate],
  );

  const handleDistrictChangeLocal = React.useCallback(
    (val: string) => {
      setCtxDistrict(val === "all" ? null : val);
    },
    [setCtxDistrict],
  );

  const handleCrimeTypeChangeLocal = React.useCallback(
    (val: string) => {
      setCrimeCategory(val === "all" ? null : val);
    },
    [setCrimeCategory],
  );

  const handleDateChangeLocal = React.useCallback(
    (field: "start" | "end", val: string) => {
      if (field === "start") setStartDate(val || null);
      if (field === "end") setEndDate(val || null);
    },
    [setStartDate, setEndDate],
  );

  // Pre-compute active filter badges
  const activeFilters = React.useMemo(() => {
    const list = [];
    if (district !== "all") {
      list.push({ id: "district", label: "District", value: district });
    }
    if (crimeType !== "all") {
      const cat = categories.find((cat) => String(cat.ROWID) === String(crimeType));
      const catName = cat ? cat.crime_category_name : crimeType;
      list.push({ id: "crimeType", label: "Type", value: catName });
    }
    if (startDate || endDate) {
      list.push({
        id: "dateRange",
        label: "Date",
        value: `${startDate || "*"} to ${endDate || "*"}`,
      });
    }
    selectedSeverities.forEach((sev) => {
      list.push({ id: `sev-${sev}`, label: "Severity", value: sev });
    });
    return list;
  }, [district, crimeType, startDate, endDate, selectedSeverities, categories]);

  // Use server-side filtered/paginated incidents directly
  const paginatedIncidents = React.useMemo(() => incidents, [incidents]);

  // Alert actions
  const handleMarkAlertRead = React.useCallback((id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, read: true } : a)),
    );
  }, []);

  const handleMarkAllAlertsRead = React.useCallback(() => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  }, []);

  // Compute metrics
  const highRiskDistrictsCount = React.useMemo(() => {
    return districtsMetrics.filter((d) => d.riskIndex >= 70).length;
  }, [districtsMetrics]);

  const criticalAlertsCount = React.useMemo(() => {
    return alerts.filter((a) => a.severity === "critical").length;
  }, [alerts]);

  const unreadAlertsCount = React.useMemo(() => {
    return alerts.filter((a) => !a.read).length;
  }, [alerts]);

  const avgResolutionRate = React.useMemo(() => {
    if (districtsMetrics.length === 0) return "78.2%";
    const total = districtsMetrics.reduce(
      (sum, d) => sum + d.resolutionRate,
      0,
    );
    return (total / districtsMetrics.length).toFixed(1) + "%";
  }, [districtsMetrics]);

  const showKpisLoading = isLoadingIncidents || isLoadingDistricts;

  return (
    <DashboardLayout title="Dashboard">
      <div className=" pb-12 px-1">

        {/* KPI Overview (with Loading skeletons support) */}
        <PermissionGuard permissions={['view_map']} fallback={null}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4   border border-border rounded-lg bg-card/10 ">
         
        {isLoadingIncidents || isLoadingDistricts ? (
            <div className="w-full h-[700px] md:h-[75vh] bg-slate-900/40 border border-border rounded-lg flex flex-col items-center justify-center space-y-4 animate-pulse">
              <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <div className="text-muted-foreground text-sm font-medium">
                Loading geospatial command canvas...
              </div>
            </div>
          ) : (
            <GeospatialMapContainer
              selectedDistrict={district}
              onDistrictChange={handleDistrictChangeLocal}
              showHeatmap={true}
              showClusters={true}
              showPredictions={true}
              heatmapRadius={25}
              className="w-full"
              currentDayOffset={currentDayOffset}
              timeWindow={timeWindow}
            />
          )}
            {/* <ExternalIntelligenceWidget /> */}
          </div>
        </PermissionGuard>

        {/* ── Crime Trend Analysis ── */}
        <PermissionGuard permissions={['view_analytics']} fallback={null}>
          <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <SectionLabel>Crime Trend Analysis</SectionLabel>
          </div>
          <Card className="border-border bg-card">
            <CardHeader className="p-4 pb-2 border-b border-border flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Activity className="size-4 text-primary" />
                Crime Volume — Current vs Previous Year
              </CardTitle>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <div className="flex items-center gap-1"><div className="size-2 rounded-full bg-primary" /> Current Period</div>
                <div className="flex items-center gap-1"><div className="size-2 rounded-full bg-slate-500" /> Previous Period</div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-3">
              {isLoadingTrend ? (
                <div className="h-[280px] flex items-center justify-center text-xs text-muted-foreground">
                  Loading trend data...
                </div>
              ) : trendData.length === 0 ? (
                <div className="h-[280px] flex items-center justify-center text-xs text-muted-foreground">
                  No trend data available for the current filters.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={trendData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                    <defs>
                      <linearGradient id="gradCurrent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradPrev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#64748B" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#64748B" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                    <XAxis dataKey="day" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                    <RechartsTooltip contentStyle={CUSTOM_TOOLTIP_STYLE} />
                    <Area type="monotone" dataKey="previous" stroke="#64748B" strokeWidth={1.5} fill="url(#gradPrev)" strokeDasharray="4 2" dot={false} name="Previous Period" connectNulls />
                    <Area type="monotone" dataKey="current"  stroke="#3B82F6" strokeWidth={2} fill="url(#gradCurrent)" dot={false} name="Current Period" connectNulls />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
          </div>
        </PermissionGuard>

        {/* Incident Logs (TanStack Table) */}
        <PermissionGuard permissions={['view_crimes']} fallback={null}>
          <div className="space-y-3 pt-2">
          
          <CrimeDataTable
            data={paginatedIncidents}
            isLoading={isLoadingIncidents}
            currentPage={currentPage}
            totalPages={crimesResponse?.pagination?.totalPages || 1}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            totalRecords={crimesResponse?.pagination?.totalRecords || 0}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeFilters={activeFilters}
            onRemoveFilter={handleRemoveFilter}
            onClearAllFilters={handleResetFilters}
            onToggleFilters={() => setIsFiltersOpen(true)}
            showFilters={isFiltersOpen}
            onRowClick={(inc) => setSelectedIncident(inc)}
          />
          </div>
        </PermissionGuard>

        {/* Filters Left Drawer */}
        <PermissionGuard permissions={['view_filters']} fallback={null}>
          <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <SheetContent
            side="left"
            className="w-[360px] sm:max-w-[360px] border-r border-border bg-slate-950 p-0 flex flex-col h-full"
          >
            <SheetHeader className="border-b border-border p-4 bg-card/10">
              <SheetTitle className="font-semibold text-lg">
                Filter Parameters
              </SheetTitle>
              <SheetDescription>
                Refine geospatial and incident metrics
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-4">
              <FilterPanel
                startDate={startDate}
                endDate={endDate}
                district={district}
                crimeType={crimeType}
                selectedSeverities={selectedSeverities}
                onStartDateChange={(val) => handleDateChangeLocal("start", val)}
                onEndDateChange={(val) => handleDateChangeLocal("end", val)}
                onDistrictChange={handleDistrictChangeLocal}
                onCrimeTypeChange={handleCrimeTypeChangeLocal}
                onSeverityToggle={handleSeverityToggle}
                onReset={handleResetFilters}
                className="w-full h-full border-none shadow-none rounded-none bg-transparent p-0"
              />
            </div>
          </SheetContent>
          </Sheet>
        </PermissionGuard>

        {/* Alerts Drawer */}
        <Sheet open={isAlertsOpen} onOpenChange={setIsAlertsOpen}>
          <SheetContent
            side="right"
            className="w-[400px] sm:max-w-[400px] border-l border-border bg-slate-950 p-0 flex flex-col h-full"
          >
            <SheetHeader className="border-b border-border p-4 bg-card/10">
              <SheetTitle className="font-semibold text-lg">
                Alert Center
              </SheetTitle>
              <SheetDescription>
                Real-time tactical anomalies & notifications
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto">
              <AlertCenter
                alerts={alerts}
                onMarkRead={handleMarkAlertRead}
                onMarkAllRead={handleMarkAllAlertsRead}
                onViewDetails={(id) => {
                  const alert = alerts.find((a) => a.id === id);
                  if (alert) alert.read = true;
                }}
                className="w-full h-full border-none shadow-none rounded-none max-w-none bg-transparent"
              />
            </div>
          </SheetContent>
        </Sheet>

        {/* Incident Detail Modal */}
        <Dialog
          open={selectedIncident !== null}
          onOpenChange={(open) => !open && setSelectedIncident(null)}
        >
          <DialogContent className="max-w-md">
            {selectedIncident && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2.5">
                    <Badge
                      variant={
                        selectedIncident.severity === "critical"
                          ? "risk-critical"
                          : selectedIncident.severity === "high"
                            ? "risk-high"
                            : "secondary"
                      }
                      size="sm"
                    >
                      {selectedIncident.severity}
                    </Badge>
                    <DialogTitle className="font-data font-bold">
                      {selectedIncident.caseNumber}
                    </DialogTitle>
                  </div>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Incident Type
                    </span>
                    <Typography
                      variant="body-md"
                      className="font-semibold text-foreground capitalize"
                    >
                      {selectedIncident.type}
                    </Typography>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Date & Timestamp
                    </span>
                    <Typography
                      variant="body-sm"
                      color="muted"
                      className="font-data"
                    >
                      {selectedIncident.timestamp}
                    </Typography>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Location Address
                    </span>
                    <Typography variant="body-sm" color="default">
                      {selectedIncident.location}
                    </Typography>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Case Brief / Narrative
                    </span>
                    <Typography
                      variant="body-sm"
                      color="muted"
                      className="leading-relaxed pt-1 border p-2.5 rounded-md bg-muted/15 border-border"
                    >
                      {selectedIncident.description}
                    </Typography>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                        Status
                      </span>
                      <Badge
                        variant={
                          selectedIncident.status === "resolved"
                            ? "success"
                            : "warning"
                        }
                        dot
                        size="sm"
                      >
                        {selectedIncident.status}
                      </Badge>
                    </div>
                    <div className="space-y-0.5 text-right">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                        Assigned Unit
                      </span>
                      <Typography
                        variant="caption"
                        className="font-semibold text-foreground"
                      >
                        Patrol Unit Sector 1
                      </Typography>
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

export default DashboardPage;