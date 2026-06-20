"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/templates/DashboardLayout";
import { AnalyticsHeader } from "@/components/organisms/AnalyticsHeader";
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
import {
  useGetDistrictsQuery,
  useGetIncidentsQuery,
  useGetRiskForecastsQuery,
} from "@/services/geospatialApi";

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

  // RTK Query hooks
  const { data: districtsMetrics = [], isLoading: isLoadingDistricts } =
    useGetDistrictsQuery();
  const { data: incidents = [], isLoading: isLoadingIncidents } =
    useGetIncidentsQuery();
  useGetRiskForecastsQuery();

  // Filters read from Redux
  const district = globalFilters.district || "all";
  const crimeType = globalFilters.crimeTypes[0] || "all";
  const startDate = globalFilters.dateRange.start || "";
  const endDate = globalFilters.dateRange.end || "";
  const selectedSeverities = globalFilters.severities;

  // Search query (local to page search input)
  const [searchQuery, setSearchQuery] = React.useState("");

  // Lifted temporal playback states
  const [currentDayOffset, setCurrentDayOffset] = React.useState(30);
  const [timeWindow, setTimeWindow] = React.useState<number | "cumulative">("cumulative");

  // Table state
  const [pageSize, setPageSize] = React.useState(10);
  const [currentPage, setCurrentPage] = React.useState(1);

  // Drawer states
  const [isFiltersOpen, setIsFiltersOpen] = React.useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = React.useState(false);

  // Sync / Refresh states
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [alerts, setAlerts] = React.useState(INITIAL_ALERTS);

  // Detail Dialog state
  const [selectedIncident, setSelectedIncident] =
    React.useState<CrimeIncident | null>(null);

  // Reset pagination on filter change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [
    district,
    crimeType,
    startDate,
    endDate,
    selectedSeverities,
    searchQuery,
  ]);

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

  // Filter actions bound to Redux dispatches
  const handleResetFilters = React.useCallback(() => {
    dispatch(resetFilters());
    setSearchQuery("");
  }, [dispatch]);

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
      if (id === "district") dispatch(setDistrict(null));
      if (id === "crimeType") dispatch(setCrimeTypes([]));
      if (id === "dateRange") {
        dispatch(setDateRange({ start: null, end: null }));
      }
      if (id.startsWith("sev-")) {
        const sevVal = id.split("sev-")[1];
        dispatch(setSeverities(selectedSeverities.filter((s) => s !== sevVal)));
      }
    },
    [dispatch, selectedSeverities],
  );

  const handleDistrictChangeLocal = React.useCallback(
    (val: string) => {
      dispatch(setDistrict(val === "all" ? null : val));
    },
    [dispatch],
  );

  const handleCrimeTypeChangeLocal = React.useCallback(
    (val: string) => {
      dispatch(setCrimeTypes(val === "all" ? [] : [val]));
    },
    [dispatch],
  );

  const handleDateChangeLocal = React.useCallback(
    (field: "start" | "end", val: string) => {
      dispatch(
        setDateRange({
          start: field === "start" ? val || null : startDate || null,
          end: field === "end" ? val || null : endDate || null,
        }),
      );
    },
    [dispatch, startDate, endDate],
  );

  // Pre-compute active filter badges
  const activeFilters = React.useMemo(() => {
    const list = [];
    if (district !== "all") {
      list.push({ id: "district", label: "District", value: district });
    }
    if (crimeType !== "all") {
      list.push({ id: "crimeType", label: "Type", value: crimeType });
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
  }, [district, crimeType, startDate, endDate, selectedSeverities]);

  // Compute filtered incidents
  const filteredIncidents = React.useMemo(() => {
    return incidents.filter((inc) => {
      // District check
      if (globalFilters.district) {
        const matchesDistrict = inc.district
          ? inc.district.toLowerCase() === globalFilters.district.toLowerCase()
          : inc.location
              .toLowerCase()
              .includes(globalFilters.district.toLowerCase());
        if (!matchesDistrict) return false;
      }
      // Police Station check
      if (
        globalFilters.selectedPoliceStations &&
        globalFilters.selectedPoliceStations.length > 0
      ) {
        if (
          !inc.policeStation ||
          !globalFilters.selectedPoliceStations.includes(inc.policeStation)
        ) {
          return false;
        }
      }
      // Type check
      if (
        globalFilters.crimeTypes.length > 0 &&
        !globalFilters.crimeTypes.includes(inc.type)
      ) {
        return false;
      }
      // Severity check
      if (
        globalFilters.severities.length > 0 &&
        !globalFilters.severities.includes(inc.severity)
      ) {
        return false;
      }
      // Search text check
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          inc.caseNumber.toLowerCase().includes(query) ||
          inc.type.toLowerCase().includes(query) ||
          inc.description.toLowerCase().includes(query) ||
          inc.location.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      // Date bounds
      if (
        globalFilters.dateRange.start &&
        inc.timestamp < globalFilters.dateRange.start
      )
        return false;
      if (
        globalFilters.dateRange.end &&
        inc.timestamp > `${globalFilters.dateRange.end} 23:59`
      )
        return false;

      return true;
    });
  }, [incidents, globalFilters, searchQuery]);

  // Paginated incidents slice
  const paginatedIncidents = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredIncidents.slice(startIndex, startIndex + pageSize);
  }, [filteredIncidents, currentPage, pageSize]);

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
        {/* Header with drawer toggles */}
        <AnalyticsHeader
          title="Tactical Command Dashboard"
          subtitle="Real-time incident dispatch logs, response statuses, and anomaly warnings."
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          activeFiltersCount={activeFilters.length}
          onOpenFilters={() => setIsFiltersOpen(true)}
          onOpenAlerts={() => setIsAlertsOpen(true)}
          unreadAlertsCount={unreadAlertsCount}
          onGenerateReport={() => {}}
          currentDayOffset={currentDayOffset}
          onDayOffsetChange={setCurrentDayOffset}
          timeWindow={timeWindow}
          onTimeWindowChange={setTimeWindow}
        />
 <div className="grid grid-cols-1 sm:grid-cols-[19fr_19fr_19fr_3fr] gap-4 p-2 border border-border rounded-lg bg-card/10">
          <MetricCard
            label="Total Crimes (Active Selection)"
            value={filteredIncidents.length}
            change={12.4}
            changeLabel="vs historic average"
            sparklineData={[]}
            isLoading={showKpisLoading}
            status={filteredIncidents.length > 50 ? "warning" : "success"}
          />
          <MetricCard
            label="High Risk Districts"
            value={`${highRiskDistrictsCount || 5} Areas`}
            change={0}
            changeLabel="No change from yesterday"
            sparklineData={[]}
            isLoading={showKpisLoading}
            status="danger"
          />
          <MetricCard
            label="Critical Alerts"
            value={`${criticalAlertsCount} Active`}
            change={unreadAlertsCount > 0 ? 15 : 0}
            changeLabel="unread system alerts"
            sparklineData={[]}
            isLoading={showKpisLoading}
            status="danger"
          />
          <Link
            to="/analytics"
            className="flex flex-col justify-center items-center p-4 rounded-lg border bg-card text-card-foreground shadow-xs relative overflow-hidden transition-all duration-200 hover:border-primary/50 hover:shadow-md group cursor-pointer"
          >
            <ChevronRight className="h-10 w-10 text-primary transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>
        {/* KPI Overview (with Loading skeletons support) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4  p-2 border border-border rounded-lg bg-card/10 mt-2">
         
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
            <ExternalIntelligenceWidget />
        </div>

        {/* External Intelligence Layer */}
      

        

        {/* Incident Logs (TanStack Table) */}
        <div className="space-y-3 pt-2">
          
          <CrimeDataTable
            data={paginatedIncidents}
            isLoading={isLoadingIncidents}
            currentPage={currentPage}
            totalPages={Math.ceil(filteredIncidents.length / pageSize) || 1}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            totalRecords={filteredIncidents.length}
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

        {/* Filters Left Drawer */}
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
