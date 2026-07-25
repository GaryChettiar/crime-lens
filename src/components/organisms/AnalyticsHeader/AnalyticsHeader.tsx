import * as React from "react";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setDistrict,
  setCrimeTypes,
  setCrimeCategory,
  setSelectedPoliceStations,
  setDateRange,
} from "@/store/slices/globalFiltersSlice";
import TemporalCrimePlayback from "@/features/geospatial/components/TemporalCrimePlayback";
import { useGetDistrictsQuery } from "@/services/districtsApi";
import { useGetStationsQuery } from "@/services/policeStationsApi";
import { useGetCrimeCategoriesQuery } from "@/services/crimeCategoryApi";
import { useAnalyticsFilters } from "@/hooks/useAnalyticsFilters";
import usePermissions from "@/hooks/usePermissions";
import { useGetCurrentUserQuery } from "@/services/authApi";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export interface AnalyticsHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  onGenerateReport?: () => void;
  isRefreshing?: boolean;
  activeFiltersCount?: number;
  onOpenFilters?: () => void;
  onOpenAlerts?: () => void;
  unreadAlertsCount?: number;

  // Temporal playback props
  currentDayOffset?: number;
  onDayOffsetChange?: (val: number) => void;
  timeWindow?: number | "cumulative";
  onTimeWindowChange?: (val: number | "cumulative") => void;
}

// Hardcoded date boundaries
const MIN_DATE = new Date("2022-01-01");
const MAX_DATE = new Date("2026-06-20");

/** Format a Date as "DD Mon YYYY" for display */
const formatDateLabel = (d: Date): string =>
  d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

/** Format a Date as "YYYY-MM-DD" for Redux dispatch */
const formatDateISO = (d: Date): string => d.toISOString().split("T")[0];

// Removed hardcoded CRIME_TYPES in favor of dynamic fetched ones

const formatDistrictName = (name: string): string => {
  if (name === "all") return "All Districts";
  if (name === "BangaloreRural") return "Bangalore Rural";
  if (name === "DakshinaKannada") return "Dakshina Kannada";
  if (name === "UttaraKannada") return "Uttara Kannada";
  return name;
};

export function AnalyticsHeader({
  title,
  subtitle,
  onRefresh,
  onGenerateReport,
  isRefreshing = false,
  activeFiltersCount = 0,
  onOpenFilters,
  onOpenAlerts,
  unreadAlertsCount = 0,
  className,

  // Lifted temporal playback props
  currentDayOffset: propCurrentDayOffset,
  onDayOffsetChange: propOnDayOffsetChange,
  timeWindow: propTimeWindow,
  onTimeWindowChange: propOnTimeWindowChange,
  ...props
}: AnalyticsHeaderProps) {
  const dispatch = useAppDispatch();
  const globalFilters = useAppSelector((state) => state.globalFilters);
  const { data: currentUser } = useGetCurrentUserQuery();
  const { hasPermission } = usePermissions();

  const isOfficer = Boolean(currentUser?.isOfficer);
  const canViewDistrictFilter =
    !isOfficer || hasPermission("view_district_filters");

  // Sync selections with Redux
  const activeDistrict = globalFilters.district || "all";
  const activeStation = globalFilters.selectedPoliceStations[0] || null;
  const activeCrimeType = globalFilters.crimeTypes[0] || "all";

  const {
    setDistrict: setContextDistrict,
    setDistrictId: setContextDistrictId,
    setStationId: setContextStationId,
    setCrimeCategory: setContextCrimeCategory,
    setStartDate,
    setEndDate,
    setIsSingleDate,
  } = useAnalyticsFilters();

  React.useEffect(() => {
    setContextDistrict(activeDistrict === "all" ? null : activeDistrict);
    setContextCrimeCategory(activeCrimeType === "all" ? null : activeCrimeType);
    setStartDate(globalFilters.dateRange.start);
    setEndDate(globalFilters.dateRange.end);
    setIsSingleDate(globalFilters.singleDate !== null);
  }, [
    activeDistrict,
    activeCrimeType,
    globalFilters.dateRange,
    globalFilters.singleDate,
    setContextDistrict,
    setContextCrimeCategory,
    setStartDate,
    setEndDate,
    setIsSingleDate,
  ]);

  const { data: districtsData } = useGetDistrictsQuery();
  const { data: stationsData } = useGetStationsQuery();

  // Officers without view_district_filter: lock filters to their assigned IDs
  React.useEffect(() => {
    if (!isOfficer || canViewDistrictFilter) return;

    setContextDistrictId(currentUser?.districtId ?? null);
    setContextStationId(currentUser?.stationId ?? null);
  }, [
    isOfficer,
    canViewDistrictFilter,
    currentUser?.districtId,
    currentUser?.stationId,
    setContextDistrictId,
    setContextStationId,
  ]);

  const currentDistrictObj = districtsData?.find(
    (d) => d.name === activeDistrict,
  );

  // Sync district/station IDs to context when the user can change location filters
  React.useEffect(() => {
    if (!canViewDistrictFilter) return;

    if (activeDistrict === "all") {
      setContextDistrictId(null);
    } else if (currentDistrictObj) {
      setContextDistrictId(currentDistrictObj.id);
    }

    if (activeStation && stationsData) {
      const station = stationsData.find((s) => s.name === activeStation);
      setContextStationId(station?.id ?? null);
    } else {
      setContextStationId(null);
    }
  }, [
    canViewDistrictFilter,
    activeDistrict,
    activeStation,
    currentDistrictObj,
    stationsData,
    setContextDistrictId,
    setContextStationId,
  ]);
  const { data: crimeCategoriesData } = useGetCrimeCategoriesQuery();

  const crimeTypes = React.useMemo(() => {
    if (!crimeCategoriesData) return [];
    return crimeCategoriesData.map((c) => ({
      value: c.ROWID,
      label: c.crime_category_name,
    }));
  }, [crimeCategoriesData]);

  const activeCrimeTypeLabel =
    activeCrimeType === "all"
      ? "All Crime Types"
      : crimeTypes.find((c) => c.value === activeCrimeType)?.label ||
        activeCrimeType;

  const districts = React.useMemo(() => {
    if (!districtsData) return [];
    return Array.from(
      new Set(districtsData.map((d) => d.name).filter(Boolean)),
    ).sort();
  }, [districtsData]);

  const activeStations = React.useMemo(() => {
    if (activeDistrict === "all" || !currentDistrictObj || !stationsData)
      return [];
    return stationsData.filter((s) => s.districtId === currentDistrictObj.id);
  }, [activeDistrict, currentDistrictObj, stationsData]);

  const [localCurrentDayOffset, setLocalCurrentDayOffset] = React.useState(30);
  const [localTimeWindow, setLocalTimeWindow] = React.useState<
    number | "cumulative"
  >("cumulative");

  const currentDayOffset =
    propCurrentDayOffset !== undefined
      ? propCurrentDayOffset
      : localCurrentDayOffset;
  const onDayOffsetChange = propOnDayOffsetChange || setLocalCurrentDayOffset;
  const timeWindow =
    propTimeWindow !== undefined ? propTimeWindow : localTimeWindow;
  const onTimeWindowChange = propOnTimeWindowChange || setLocalTimeWindow;

  // ── Date Picker states ──────────────────────────────────────
  const [dateMode, setDateMode] = React.useState<'single' | 'range'>('range');
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);

  const [selectedSingle, setSelectedSingle] = React.useState<Date>(() => {
    if (globalFilters.dateRange.start) {
      return new Date(globalFilters.dateRange.start);
    }
    return new Date("2026-06-20");
  });

  const [selectedRange, setSelectedRange] = React.useState<{ from: Date | null; to: Date | null }>(() => {
    const from = globalFilters.dateRange.start ? new Date(globalFilters.dateRange.start) : new Date("2025-06-20");
    const to = globalFilters.dateRange.end ? new Date(globalFilters.dateRange.end) : new Date("2026-06-20");
    return { from, to };
  });

  // Computed active range dates
  const activeStart = dateMode === 'single' ? selectedSingle : (selectedRange.from || MIN_DATE);
  const activeEnd = dateMode === 'single' ? selectedSingle : (selectedRange.to || selectedRange.from || MAX_DATE);

  const dispatchRange = React.useCallback(
    (start: Date, end: Date) => {
      dispatch(
        setDateRange({
          start: formatDateISO(start),
          end: formatDateISO(end),
        })
      );
    },
    [dispatch]
  );

  // Synchronize local states if global filters change from outside (e.g. presets)
  React.useEffect(() => {
    if (globalFilters.dateRange.start && globalFilters.dateRange.end) {
      const startD = new Date(globalFilters.dateRange.start);
      const endD = new Date(globalFilters.dateRange.end);
      const isSameDate = startD.getTime() === endD.getTime();

      if (isSameDate) {
        setDateMode('single');
        setSelectedSingle(startD);
      } else {
        setDateMode('range');
        setSelectedRange({ from: startD, to: endD });
      }
    } else if (!globalFilters.dateRange.start && !globalFilters.dateRange.end) {
      setSelectedRange({ from: new Date("2025-06-20"), to: new Date("2026-06-20") });
      setSelectedSingle(new Date("2026-06-20"));
      setDateMode('range');
    }
  }, [globalFilters.dateRange.start, globalFilters.dateRange.end]);

  const [isLocationOpen, setIsLocationOpen] = React.useState(false);
  const [isCrimeTypeOpen, setIsCrimeTypeOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const crimeTypeRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsLocationOpen(false);
      }
      if (
        crimeTypeRef.current &&
        !crimeTypeRef.current.contains(event.target as Node)
      ) {
        setIsCrimeTypeOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelectDistrict = (d: string) => {
    dispatch(setDistrict(d === "all" ? null : d));
    dispatch(setSelectedPoliceStations([]));
  };

  const handleSelectStation = (stationName: string) => {
    if (activeStation === stationName) {
      dispatch(setSelectedPoliceStations([]));
    } else {
      dispatch(setSelectedPoliceStations([stationName]));
    }
  };

  const handleIndicatorChange = (val: string) => {
    const category = val === "all" ? null : val;
    dispatch(setCrimeTypes(category ? [category] : []));
    dispatch(setCrimeCategory(category));
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-5  w-full select-none relative z-20",
        className,
      )}
      {...props}
    >
     
      {/* Row 2: Control Ribbon */}
      <div className="flex flex-row lg:items-center gap-4 w-full bg-card  shadow-sm">
        {/* Crime Type (Indicator) Dropdown */}
        <div ref={crimeTypeRef} className="relative shrink-0">
          <button
            onClick={() => setIsCrimeTypeOpen(!isCrimeTypeOpen)}
            className="relative border border-border/80 rounded-lg px-3 py-1 bg-background text-[11px] font-semibold min-w-[210px] h-9 flex flex-col justify-center text-left cursor-pointer hover:border-border/100 transition-colors"
          >
            <span className="absolute -top-2 left-2 px-1 text-[8px] bg-card text-muted-foreground font-bold uppercase tracking-wider">
              Crime Category
            </span>
            <div className="flex items-center justify-between text-foreground w-full">
              <span className="truncate pr-4">{activeCrimeTypeLabel}</span>
              <span className="text-[9px] text-muted-foreground">▼</span>
            </div>
          </button>

          {/* Custom Dropdown Menu Overlay */}
          {isCrimeTypeOpen && (
            <div className="absolute top-full mt-1.5 left-0 w-[220px] bg-card border border-border rounded-lg shadow-xl z-50 flex flex-col overflow-hidden max-h-72">
              <div className="overflow-y-auto flex-1 py-1.5 scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent">
                <button
                  onClick={() => {
                    handleIndicatorChange("all");
                    setIsCrimeTypeOpen(false);
                  }}
                  className="relative w-full text-left pl-7 pr-3 py-1 text-xs text-foreground hover:bg-muted/80 cursor-pointer transition-colors"
                >
                  {activeCrimeType === "all" && (
                    <span className="absolute left-3 text-primary font-bold">
                      ✓
                    </span>
                  )}
                  <span
                    className={cn(
                      activeCrimeType === "all" && "font-semibold text-primary",
                    )}
                  >
                    All Crime Types
                  </span>
                </button>
                {crimeTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => {
                      handleIndicatorChange(type.value);
                      setIsCrimeTypeOpen(false);
                    }}
                    className="relative w-full text-left pl-7 pr-3 py-1 text-xs text-foreground hover:bg-muted/80 cursor-pointer transition-colors"
                  >
                    {activeCrimeType === type.value && (
                      <span className="absolute left-3 text-primary font-bold">
                        ✓
                      </span>
                    )}
                    <span
                      className={cn(
                        activeCrimeType === type.value &&
                          "font-semibold text-primary",
                      )}
                    >
                      {type.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* District (Location) Dropdown — hidden for officers without view_district_filter */}
        {canViewDistrictFilter && (
        <div ref={dropdownRef} className="relative shrink-0">
          <button
            onClick={() => setIsLocationOpen(!isLocationOpen)}
            className="relative border border-border/80 rounded-lg px-3 py-1 bg-background text-[11px] font-semibold min-w-[170px] h-9 flex flex-col justify-center text-left cursor-pointer hover:border-border/100 transition-colors"
          >
            <span className="absolute -top-2 left-2 px-1 text-[8px] bg-card text-muted-foreground font-bold uppercase tracking-wider">
              District / Station
            </span>
            <div className="flex items-center justify-between text-foreground w-full">
              <span className="truncate pr-4">
                {activeStation
                  ? activeStation
                  : formatDistrictName(activeDistrict)}
              </span>
              <span className="text-[9px] text-muted-foreground">▼</span>
            </div>
          </button>

          {/* Grouped Custom Dropdown Menu Overlay */}
          {isLocationOpen && (
            <div className="absolute top-full mt-1.5 left-0 w-[260px] bg-card border border-border rounded-lg shadow-xl z-50 flex flex-col overflow-hidden max-h-72">
              <div className="overflow-y-auto flex-1 py-1.5 scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent">
                {/* ── Districts Group ── */}
                <div className="px-3 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Districts
                </div>

                <button
                  onClick={() => handleSelectDistrict("all")}
                  className="relative w-full text-left pl-7 pr-3 py-1 text-xs text-foreground hover:bg-muted/80 cursor-pointer transition-colors"
                >
                  {activeDistrict === "all" && !activeStation && (
                    <span className="absolute left-3 text-primary font-bold">
                      ✓
                    </span>
                  )}
                  <span
                    className={cn(
                      activeDistrict === "all" &&
                        !activeStation &&
                        "font-semibold text-primary",
                    )}
                  >
                    All Districts
                  </span>
                </button>

                {districts.map((d, index) => (
                  <button
                    key={d || `district-${index}`}
                    onClick={() => handleSelectDistrict(d)}
                    className="relative w-full text-left pl-7 pr-3 py-1 text-xs text-foreground hover:bg-muted/80 cursor-pointer transition-colors"
                  >
                    {activeDistrict === d && !activeStation && (
                      <span className="absolute left-3 text-primary font-bold">
                        ✓
                      </span>
                    )}
                    <span
                      className={cn(
                        activeDistrict === d &&
                          !activeStation &&
                          "font-semibold text-primary",
                      )}
                    >
                      {formatDistrictName(d)}
                    </span>
                  </button>
                ))}

                {/* ── Sub-Divisions / Stations Group ── */}
                <div className="px-3 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-t border-border/40 mt-2 pt-2">
                  Sub-Divisions / Stations
                </div>

                {activeDistrict === "all" ? (
                  <div className="pl-7 pr-3 py-1.5 text-[10px] text-muted-foreground italic">
                    Select a district to view stations
                  </div>
                ) : activeStations.length === 0 ? (
                  <div className="pl-7 pr-3 py-1.5 text-[10px] text-muted-foreground italic">
                    No stations found
                  </div>
                ) : (
                  activeStations.map((station) => (
                    <button
                      key={station.id}
                      onClick={() => handleSelectStation(station.name)}
                      className="relative w-full text-left pl-7 pr-3 py-1 text-xs text-foreground hover:bg-muted/80 cursor-pointer transition-colors"
                    >
                      {activeStation === station.name && (
                        <span className="absolute left-3 text-primary font-bold">
                          ✓
                        </span>
                      )}
                      <span
                        className={cn(
                          activeStation === station.name &&
                            "font-semibold text-primary",
                        )}
                      >
                        {station.name}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        )}

        {/* Date / Date Range Picker */}
        <div className="relative shrink-0">
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="relative border border-border/80 rounded-lg px-3 py-1 bg-background text-[11px] font-semibold min-w-[220px] h-9 flex flex-col justify-center text-left cursor-pointer hover:border-border/100 transition-colors font-data select-none"
              >
                <span className="absolute -top-2 left-2 px-1 text-[8px] bg-card text-muted-foreground font-bold uppercase tracking-wider">
                  Date / Timeframe
                </span>
                <div className="flex items-center gap-2 text-foreground w-full">
                  <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate pr-4">
                    {dateMode === "single"
                      ? formatDateLabel(selectedSingle)
                      : selectedRange.from
                        ? selectedRange.to
                          ? `${formatDateLabel(selectedRange.from)} - ${formatDateLabel(selectedRange.to)}`
                          : `${formatDateLabel(selectedRange.from)} - Select End`
                        : "Select dates..."}
                  </span>
                  <span className="text-[9px] text-muted-foreground ml-auto">▼</span>
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="p-0 z-50 bg-card border border-border shadow-2xl rounded-lg flex flex-col"
            >
              {/* Mode selection toggle */}
              <div className="flex border-b border-border/60 p-1.5 gap-1 bg-muted/20">
                <button
                  type="button"
                  className={cn(
                    "flex-1 text-[11px] font-bold py-1.5 px-2.5 rounded transition-all cursor-pointer",
                    dateMode === "single"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
                  )}
                  onClick={() => setDateMode("single")}
                >
                  Single Date
                </button>
                <button
                  type="button"
                  className={cn(
                    "flex-1 text-[11px] font-bold py-1.5 px-2.5 rounded transition-all cursor-pointer",
                    dateMode === "range"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
                  )}
                  onClick={() => setDateMode("range")}
                >
                  Date Range
                </button>
              </div>

              {/* Calendar */}
              <div className="p-1">
                {dateMode === "single" ? (
                  <ShadcnCalendar
                    mode="single"
                    selected={selectedSingle}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedSingle(date);
                        setIsCalendarOpen(false);
                        dispatchRange(date, date);
                      }
                    }}
                    disabledDates={(d) => d < MIN_DATE || d > MAX_DATE}
                  />
                ) : (
                  <ShadcnCalendar
                    mode="range"
                    selected={selectedRange}
                    onSelect={(range) => {
                      setSelectedRange(range || { from: null, to: null });
                      if (range && range.from && range.to) {
                        setIsCalendarOpen(false);
                        dispatchRange(range.from, range.to);
                      }
                    }}
                    disabledDates={(d) => d < MIN_DATE || d > MAX_DATE}
                  />
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Temporal Timeline Playback (manages its own date range via Redux) */}
        {/* <TemporalCrimePlayback
          startDate={formatDateISO(activeStart)}
          endDate={formatDateISO(activeEnd)}
          currentDayOffset={currentDayOffset}
          onDayOffsetChange={onDayOffsetChange}
          timeWindow={timeWindow}
          onTimeWindowChange={onTimeWindowChange}
          className="flex-1 min-w-0 border border-border"
        /> */}
      </div>
    </div>
  );
}
