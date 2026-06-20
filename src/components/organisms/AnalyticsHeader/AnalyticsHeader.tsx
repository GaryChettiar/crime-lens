import * as React from 'react';
import {
  RefreshCw,
  FilePlus2,
  Share2,
  SlidersHorizontal,
  Bell,
  Play,
  Pause,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Typography } from '@/components/atoms/Typography';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/atoms/Icon';
import { Badge } from '@/components/atoms/Badge';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setDistrict,
  setCrimeTypes,
  setDateRange,
  setSelectedPoliceStations,
} from '@/store/slices/globalFiltersSlice';
import { MOCK_POLICE_STATIONS } from '@/features/geospatial/data/mockGeospatialData';
import TemporalCrimePlayback from '@/features/geospatial/components/TemporalCrimePlayback';

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
  timeWindow?: number | 'cumulative';
  onTimeWindowChange?: (val: number | 'cumulative') => void;
}

const MONTHS = [
  "Jan 2022", "Feb 2022", "Mar 2022", "Apr 2022", "May 2022", "Jun 2022",
  "Jul 2022", "Aug 2022", "Sep 2022", "Oct 2022", "Nov 2022", "Dec 2022",
  "Jan 2023", "Feb 2023", "Mar 2023", "Apr 2023", "May 2023", "Jun 2023",
  "Jul 2023", "Aug 2023", "Sep 2023", "Oct 2023", "Nov 2023", "Dec 2023",
  "Jan 2024", "Feb 2024", "Mar 2024", "Apr 2024", "May 2024", "Jun 2024",
  "Jul 2024", "Aug 2024", "Sep 2024", "Oct 2024", "Nov 2024", "Dec 2024",
  "Jan 2025", "Feb 2025", "Mar 2025", "Apr 2025", "May 2025", "Jun 2025",
  "Jul 2025", "Aug 2025", "Sep 2025", "Oct 2025", "Nov 2025", "Dec 2025",
  "Jan 2026", "Feb 2026", "Mar 2026", "Apr 2026", "May 2026", "Jun 2026",
  "Jul 2026", "Aug 2026", "Sep 2026", "Oct 2026", "Nov 2026", "Dec 2026"
];

const DISTRICTS = [
  "Bagalkot", "Bangalore", "BangaloreRural", "Belgaum", "Bellary", "Bidar",
  "Bijapur", "Chamrajnagar", "Chikballapura", "Chikmagalur", "Chitradurga",
  "DakshinaKannada", "Davanagere", "Dharwad", "Gadag", "Gulbarga", "Hassan",
  "Haveri", "Kodagu", "Kolar", "Koppal", "Mandya", "Mysore", "Raichur",
  "Ramanagara", "Shimoga", "Tumkur", "Udupi", "UttaraKannada", "Yadgir"
];

const CRIME_TYPES = [
  { value: "theft", label: "Theft" },
  { value: "burglary", label: "Burglary" },
  { value: "assault", label: "Assault" },
  { value: "narcotics", label: "Narcotics" },
  { value: "cyber", label: "Cyber Crime" },
  { value: "homicide", label: "Homicide" }
];

const formatDistrictName = (name: string): string => {
  if (name === 'all') return 'All Districts';
  if (name === 'BangaloreRural') return 'Bangalore Rural';
  if (name === 'DakshinaKannada') return 'Dakshina Kannada';
  if (name === 'UttaraKannada') return 'Uttara Kannada';
  return name;
};

// Helper to convert "Month YYYY" string to "YYYY-MM-DD"
const mapMonthToDateStr = (monthStr: string, position: 'start' | 'end'): string => {
  const [mName, yStr] = monthStr.split(' ');
  const year = parseInt(yStr);
  const monthMap: Record<string, number> = {
    Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
    Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12
  };
  const mNum = monthMap[mName] || 1;
  const monthPad = String(mNum).padStart(2, '0');
  
  if (position === 'start') {
    return `${year}-${monthPad}-01`;
  } else {
    const lastDay = new Date(year, mNum, 0).getDate();
    return `${year}-${monthPad}-${lastDay}`;
  }
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

  const [localCurrentDayOffset, setLocalCurrentDayOffset] = React.useState(30);
  const [localTimeWindow, setLocalTimeWindow] = React.useState<number | 'cumulative'>('cumulative');

  const currentDayOffset = propCurrentDayOffset !== undefined ? propCurrentDayOffset : localCurrentDayOffset;
  const onDayOffsetChange = propOnDayOffsetChange || setLocalCurrentDayOffset;
  const timeWindow = propTimeWindow !== undefined ? propTimeWindow : localTimeWindow;
  const onTimeWindowChange = propOnTimeWindowChange || setLocalTimeWindow;

  // Convert dates for Temporal Timeline Playback
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = new Date().toISOString().split('T')[0];

  const [sliderVal, setSliderVal] = React.useState(53); // Default to June 2026 (index 53)
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isLocationOpen, setIsLocationOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLocationOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Sync selections with Redux
  const activeDistrict = globalFilters.district || 'all';
  const activeStation = globalFilters.selectedPoliceStations[0] || null;
  const activeCrimeType = globalFilters.crimeTypes[0] || 'all';
  const activeCrimeTypeLabel = activeCrimeType === 'all'
    ? 'All Crime Types'
    : (CRIME_TYPES.find((c) => c.value === activeCrimeType)?.label || activeCrimeType);

  // Sync date range on initial mount or load active date range
  React.useEffect(() => {
    if (!globalFilters.dateRange.start && !globalFilters.dateRange.end) {
      dispatch(setDateRange({
        start: '2025-07-01',
        end: '2026-06-30'
      }));
    } else {
      const reduxEnd = globalFilters.dateRange.end;
      if (reduxEnd) {
        const [year, month] = reduxEnd.split('-');
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const mIndex = parseInt(month) - 1;
        const targetStr = `${monthNames[mIndex]} ${year}`;
        const foundIdx = MONTHS.indexOf(targetStr);
        if (foundIdx !== -1) {
          setSliderVal(foundIdx);
        }
      }
    }
  }, [dispatch]);

  // Handle timeline animation playback
  React.useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setSliderVal((prev) => {
          const next = prev >= MONTHS.length - 1 ? 0 : prev + 1;
          const endMonthStr = MONTHS[next];
          const startMonthStr = MONTHS[Math.max(0, next - 11)];
          dispatch(setDateRange({
            start: mapMonthToDateStr(startMonthStr, 'start'),
            end: mapMonthToDateStr(endMonthStr, 'end')
          }));
          return next;
        });
      }, 500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, dispatch]);

  const handleSelectDistrict = (d: string) => {
    dispatch(setDistrict(d === 'all' ? null : d));
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
    dispatch(setCrimeTypes(val === 'all' ? [] : [val]));
  };

  const handleSliderChange = (val: number) => {
    setSliderVal(val);
    const endMonthStr = MONTHS[val];
    const startMonthStr = MONTHS[Math.max(0, val - 11)];
    dispatch(setDateRange({
      start: mapMonthToDateStr(startMonthStr, 'start'),
      end: mapMonthToDateStr(endMonthStr, 'end')
    }));
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-5 pb-4 w-full select-none",
        className
      )}
      {...props}
    >
      {/* Row 1: Title block and utility buttons */}
      {/* <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 w-full">
        <div>
          <div className="flex items-center gap-3">
            <Typography variant="heading-xl" as="h1" className="font-bold text-foreground">
              {title}
            </Typography>
            {activeFiltersCount > 0 && (
              <Badge variant="default" size="sm" className="font-medium">
                {activeFiltersCount} active filter{activeFiltersCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          {subtitle && (
            <Typography variant="body-sm" color="muted" className="mt-1">
              {subtitle}
            </Typography>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenFilters && (
            <Button
              variant={activeFiltersCount > 0 ? "secondary" : "outline"}
              size="sm"
              onClick={onOpenFilters}
              className="h-8 gap-1.5 cursor-pointer"
              aria-label="Open Filters Drawer"
            >
              <Icon icon={SlidersHorizontal} size="xs" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold font-data px-1">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          )}

          {onOpenAlerts && (
            <Button
              variant={unreadAlertsCount > 0 ? "secondary" : "outline"}
              size="sm"
              onClick={onOpenAlerts}
              className="h-8 gap-1.5 relative cursor-pointer"
              aria-label="Open Alerts Drawer"
            >
              <Icon icon={Bell} size="xs" className={cn(unreadAlertsCount > 0 && "animate-pulse")} />
              <span>Alerts</span>
              {unreadAlertsCount > 0 && (
                <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-danger text-danger-foreground text-[10px] font-bold font-data px-1">
                  {unreadAlertsCount}
                </span>
              )}
            </Button>
          )}

          <Button variant="outline" size="sm" className="h-8 gap-1.5 cursor-pointer">
            <Icon icon={Share2} size="xs" />
            Share
          </Button>

          {onGenerateReport && (
            <Button onClick={onGenerateReport} size="sm" className="h-8 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold cursor-pointer">
              <Icon icon={FilePlus2} size="xs" />
              Generate Report
            </Button>
          )}
        </div>
      </div> */}

      {/* Row 2: Control Ribbon */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 w-full p-3.5 bg-card border border-border/70 rounded-xl shadow-sm">
        
        {/* Crime Type (Indicator) Dropdown */}
        <div className="relative border border-border/80 rounded-lg px-3 py-1 bg-background text-[11px] font-semibold min-w-[210px] h-9 flex flex-col justify-center shrink-0">
          <span className="absolute -top-2 left-2 px-1 text-[8px] bg-card text-muted-foreground font-bold uppercase tracking-wider">Crime Category</span>
          <div className="flex items-center justify-between text-foreground">
            <span className="truncate pr-4">
              {activeCrimeTypeLabel}
            </span>
            <span className="text-[9px] text-muted-foreground">▼</span>
          </div>
          <select
            value={activeCrimeType}
            onChange={(e) => handleIndicatorChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          >
            <option value="all">All Crime Types</option>
            {CRIME_TYPES.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        {/* District (Location) Dropdown */}
        <div ref={dropdownRef} className="relative shrink-0">
          <button
            onClick={() => setIsLocationOpen(!isLocationOpen)}
            className="relative border border-border/80 rounded-lg px-3 py-1 bg-background text-[11px] font-semibold min-w-[170px] h-9 flex flex-col justify-center text-left cursor-pointer hover:border-border/100 transition-colors"
          >
            <span className="absolute -top-2 left-2 px-1 text-[8px] bg-card text-muted-foreground font-bold uppercase tracking-wider">District / Station</span>
            <div className="flex items-center justify-between text-foreground w-full">
              <span className="truncate pr-4">
                {activeStation ? activeStation : formatDistrictName(activeDistrict)}
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
                  onClick={() => handleSelectDistrict('all')}
                  className="relative w-full text-left pl-7 pr-3 py-1 text-xs text-foreground hover:bg-muted/80 cursor-pointer transition-colors"
                >
                  {activeDistrict === 'all' && !activeStation && (
                    <span className="absolute left-3 text-primary font-bold">✓</span>
                  )}
                  <span className={cn(activeDistrict === 'all' && !activeStation && "font-semibold text-primary")}>
                    All Districts
                  </span>
                </button>

                {DISTRICTS.map((d) => (
                  <button
                    key={d}
                    onClick={() => handleSelectDistrict(d)}
                    className="relative w-full text-left pl-7 pr-3 py-1 text-xs text-foreground hover:bg-muted/80 cursor-pointer transition-colors"
                  >
                    {activeDistrict === d && !activeStation && (
                      <span className="absolute left-3 text-primary font-bold">✓</span>
                    )}
                    <span className={cn(activeDistrict === d && !activeStation && "font-semibold text-primary")}>
                      {formatDistrictName(d)}
                    </span>
                  </button>
                ))}

                {/* ── Sub-Divisions / Stations Group ── */}
                <div className="px-3 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-t border-border/40 mt-2 pt-2">
                  Sub-Divisions / Stations
                </div>

                {activeDistrict === 'all' ? (
                  <div className="pl-7 pr-3 py-1.5 text-[10px] text-muted-foreground italic">
                    Select a district to view stations
                  </div>
                ) : (
                  (MOCK_POLICE_STATIONS[activeDistrict] || []).map((station) => (
                    <button
                      key={station.id}
                      onClick={() => handleSelectStation(station.name)}
                      className="relative w-full text-left pl-7 pr-3 py-1 text-xs text-foreground hover:bg-muted/80 cursor-pointer transition-colors"
                    >
                      {activeStation === station.name && (
                        <span className="absolute left-3 text-primary font-bold">✓</span>
                      )}
                      <span className={cn(activeStation === station.name && "font-semibold text-primary")}>
                        {station.name}
                      </span>
                    </button>
                  ))
                )}

              </div>
            </div>
          )}
        </div>

        {/* Timeline Start Date Label */}
        <TemporalCrimePlayback
          startDate={startDateStr}
          endDate={endDateStr}
          currentDayOffset={currentDayOffset}
          onDayOffsetChange={onDayOffsetChange}
          timeWindow={timeWindow}
          onTimeWindowChange={onTimeWindowChange}
          className="flex-1 min-w-0 border border-border"
        />

      </div>
    </div>
  );
}
