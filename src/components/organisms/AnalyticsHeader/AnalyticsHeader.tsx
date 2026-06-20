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


  const [isLocationOpen, setIsLocationOpen] = React.useState(false);
  const [isCrimeTypeOpen, setIsCrimeTypeOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const crimeTypeRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLocationOpen(false);
      }
      if (crimeTypeRef.current && !crimeTypeRef.current.contains(event.target as Node)) {
        setIsCrimeTypeOpen(false);
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



  return (
    <div
      className={cn(
        "flex flex-col gap-5 pb-2 w-full select-none relative z-20",
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
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 w-full p-1.5 bg-card border border-border/70 rounded-xl shadow-sm">
        
        {/* Crime Type (Indicator) Dropdown */}
        <div ref={crimeTypeRef} className="relative shrink-0">
          <button
            onClick={() => setIsCrimeTypeOpen(!isCrimeTypeOpen)}
            className="relative border border-border/80 rounded-lg px-3 py-1 bg-background text-[11px] font-semibold min-w-[210px] h-9 flex flex-col justify-center text-left cursor-pointer hover:border-border/100 transition-colors"
          >
            <span className="absolute -top-2 left-2 px-1 text-[8px] bg-card text-muted-foreground font-bold uppercase tracking-wider">Crime Category</span>
            <div className="flex items-center justify-between text-foreground w-full">
              <span className="truncate pr-4">
                {activeCrimeTypeLabel}
              </span>
              <span className="text-[9px] text-muted-foreground">▼</span>
            </div>
          </button>

          {/* Custom Dropdown Menu Overlay */}
          {isCrimeTypeOpen && (
            <div className="absolute top-full mt-1.5 left-0 w-[220px] bg-card border border-border rounded-lg shadow-xl z-50 flex flex-col overflow-hidden max-h-72">
              <div className="overflow-y-auto flex-1 py-1.5 scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent">
                <button
                  onClick={() => { handleIndicatorChange('all'); setIsCrimeTypeOpen(false); }}
                  className="relative w-full text-left pl-7 pr-3 py-1 text-xs text-foreground hover:bg-muted/80 cursor-pointer transition-colors"
                >
                  {activeCrimeType === 'all' && (
                    <span className="absolute left-3 text-primary font-bold">✓</span>
                  )}
                  <span className={cn(activeCrimeType === 'all' && "font-semibold text-primary")}>
                    All Crime Types
                  </span>
                </button>
                {CRIME_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => { handleIndicatorChange(type.value); setIsCrimeTypeOpen(false); }}
                    className="relative w-full text-left pl-7 pr-3 py-1 text-xs text-foreground hover:bg-muted/80 cursor-pointer transition-colors"
                  >
                    {activeCrimeType === type.value && (
                      <span className="absolute left-3 text-primary font-bold">✓</span>
                    )}
                    <span className={cn(activeCrimeType === type.value && "font-semibold text-primary")}>
                      {type.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
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

        {/* Temporal Timeline Playback (manages its own date range via Redux) */}
        <TemporalCrimePlayback
          startDate=""
          endDate=""
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
