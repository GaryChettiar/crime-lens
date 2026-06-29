import * as React from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setDistrict,
  setPoliceStation,
  setCrimeCategory,
  setStatus,
  setSingleDate,
  setCrimeTypes,
  setSeverities,
  setDateRange,
  loadSavedView,
  saveView,
  deleteSavedView,
  resetFilters,
} from '@/store/slices/globalFiltersSlice';
import { useGetStationsQuery } from '@/services/policeStationsApi';
import { useGetOfficersQuery } from '@/services/policeOfficersApi';
import { useGetAllUsersQuery } from '@/services/usersApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DISTRICT_CENTERS } from '@/features/geospatial/data/mockGeospatialData';
import {
  RotateCcw,
  Save,
  Trash2,
  Layers,
  ChevronDown,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DateRangePicker } from '@/components/ui/date-range-picker';

const CRIME_OPTIONS = [
  { value: 'theft', label: 'Theft' },
  { value: 'burglary', label: 'Burglary' },
  { value: 'assault', label: 'Assault' },
  { value: 'narcotics', label: 'Narcotics' },
  { value: 'cyber', label: 'Cyber Crime' },
  { value: 'homicide', label: 'Homicide' },
  { value: 'robbery', label: 'Robbery' },
  { value: 'murder', label: 'Murder' },
  { value: 'kidnapping', label: 'Kidnapping' },
  { value: 'fraud', label: 'Fraud' },
  { value: 'vehicle_theft', label: 'Vehicle Theft' },
];

const CRIME_STATUS_OPTIONS = [
  { value: 'reported', label: 'Reported' },
  { value: 'under_investigation', label: 'Under Investigation' },
  { value: 'suspects_identified', label: 'Suspects Identified' },
  { value: 'evidence_collected', label: 'Evidence Collected' },
  { value: 'charge_sheet_filed', label: 'Charge Sheet Filed' },
  { value: 'closed', label: 'Closed' },
];

const SEVERITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

export function GlobalFilterBar() {
  const dispatch = useAppDispatch();
  const filters = useAppSelector((state) => state.globalFilters);

  const { data: stations } = useGetStationsQuery();
  const { data: officers } = useGetOfficersQuery();
  const { data: usersData } = useGetAllUsersQuery({ limit: 500 });

  const officerOptions = React.useMemo(() => {
    if (!officers) return [];
    return officers.map((o: any) => {
      const u = usersData?.users?.find((user: any) => user.id === o.userId);
      return { id: o.id, name: u?.userInfo?.name || `Badge ${o.badgeNumber || o.id}` };
    });
  }, [officers, usersData]);

  const [activeDropdown, setActiveDropdown] = React.useState<'crime' | 'severity' | 'saved' | null>(null);
  const [newViewName, setNewViewName] = React.useState('');
  const [showSaveDialog, setShowSaveDialog] = React.useState(false);
  const [selectedSavedViewId, setSelectedSavedViewId] = React.useState('');

  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    dispatch(setDistrict(val === 'all' ? null : val));
  };

  const handleCrimeTypeToggle = (type: string) => {
    const isSelected = filters.crimeTypes.includes(type);
    const updated = isSelected
      ? filters.crimeTypes.filter((t) => t !== type)
      : [...filters.crimeTypes, type];
    dispatch(setCrimeTypes(updated));
  };

  const handleSeverityToggle = (sev: string) => {
    const isSelected = filters.severities.includes(sev);
    const updated = isSelected
      ? filters.severities.filter((s) => s !== sev)
      : [...filters.severities, sev];
    dispatch(setSeverities(updated));
  };

  const handleSaveViewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newViewName.trim()) return;
    dispatch(saveView({ name: newViewName.trim() }));
    setNewViewName('');
    setShowSaveDialog(false);
  };

  const handleLoadSavedView = (viewId: string) => {
    setSelectedSavedViewId(viewId);
    if (viewId) {
      dispatch(loadSavedView(viewId));
    }
  };

  const handleDeleteView = () => {
    if (selectedSavedViewId) {
      dispatch(deleteSavedView(selectedSavedViewId));
      setSelectedSavedViewId('');
    }
  };

  return (
    <div
      ref={dropdownRef}
      className="bg-slate-950/80 backdrop-blur-md border-b border-border px-4 py-3 flex flex-wrap items-center gap-3 z-30 relative shadow-sm"
      role="search"
      aria-label="Global filter and controls"
    >

      {/* District Selector */}
      <div className="flex flex-col gap-0.5">
        <select
          value={filters.district || 'all'}
          onChange={(e) => dispatch(setDistrict(e.target.value === 'all' ? null : e.target.value))}
          className="h-8.5 px-3 rounded-md border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary min-w-[140px] font-semibold cursor-pointer"
          aria-label="Filter by district"
        >
          <option value="all">All Districts</option>
          {Object.keys(DISTRICT_CENTERS).sort().map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      {/* Police Station Selector */}
      <select
        value={filters.policeStation || 'all'}
        onChange={(e) => dispatch(setPoliceStation(e.target.value === 'all' ? null : e.target.value))}
        className={cn(
          "h-8.5 px-3 rounded-md border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary min-w-[160px] font-semibold cursor-pointer",
          filters.policeStation && "border-primary/50 bg-primary/5"
        )}
        aria-label="Filter by police station"
      >
        <option value="all">All Stations</option>
        {(stations ?? []).map((s: any) => (
          <option key={s.id} value={s.id}>{s.name || s.id}</option>
        ))}
      </select>

      {/* Status Selector */}
      <select
        value={filters.status || 'all'}
        onChange={(e) => dispatch(setStatus(e.target.value === 'all' ? null : e.target.value))}
        className={cn(
          "h-8.5 px-3 rounded-md border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary min-w-[150px] font-semibold cursor-pointer",
          filters.status && "border-primary/50 bg-primary/5"
        )}
        aria-label="Filter by status"
      >
        <option value="all">All Statuses</option>
        {CRIME_STATUS_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

      {/* Crime Types Dropdown */}
      <div className="relative">
        <button
          onClick={() => setActiveDropdown(activeDropdown === 'crime' ? null : 'crime')}
          className={cn(
            "h-8.5 px-3 rounded-md border border-border bg-card text-xs text-foreground focus:outline-none flex items-center justify-between gap-2.5 font-semibold min-w-[140px] cursor-pointer hover:bg-muted/10 transition-colors",
            filters.crimeTypes.length > 0 && "border-primary/50 bg-primary/5"
          )}
        >
          <span className="truncate">
            {filters.crimeTypes.length === 0
              ? 'All Crimes'
              : `${filters.crimeTypes.length} Crime Types`}
          </span>
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </button>

        {activeDropdown === 'crime' && (
          <div className="absolute top-9.5 left-0 z-40 bg-card border border-border rounded-md shadow-xl p-2 w-48 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="text-[9px] uppercase font-bold text-muted-foreground px-2 py-1 border-b border-border/40 mb-1.5">
              Select Crime Types
            </div>
            {CRIME_OPTIONS.map((opt) => {
              const active = filters.crimeTypes.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  onClick={() => handleCrimeTypeToggle(opt.value)}
                  className={cn(
                    "w-full text-left px-2.5 py-1.5 rounded-sm text-xs flex items-center justify-between transition-colors hover:bg-muted/30 text-foreground font-medium",
                    active && "bg-primary/10 text-primary hover:bg-primary/15"
                  )}
                >
                  <span>{opt.label}</span>
                  {active && <Check className="h-3.5 w-3.5 text-primary" />}
                </button>
              );
            })}
            {filters.crimeTypes.length > 0 && (
              <button
                onClick={() => dispatch(setCrimeTypes([]))}
                className="w-full text-center py-1 text-[10px] font-bold text-danger hover:underline border-t border-border/40 mt-1.5"
              >
                Clear Selection
              </button>
            )}
          </div>
        )}
      </div>

      {/* Severities Dropdown */}
      <div className="relative">
        <button
          onClick={() => setActiveDropdown(activeDropdown === 'severity' ? null : 'severity')}
          className={cn(
            "h-8.5 px-3 rounded-md border border-border bg-card text-xs text-foreground focus:outline-none flex items-center justify-between gap-2.5 font-semibold min-w-[130px] cursor-pointer hover:bg-muted/10 transition-colors",
            filters.severities.length > 0 && "border-primary/50 bg-primary/5"
          )}
        >
          <span className="truncate">
            {filters.severities.length === 0
              ? 'All Severities'
              : `${filters.severities.length} Severities`}
          </span>
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </button>

        {activeDropdown === 'severity' && (
          <div className="absolute top-9.5 left-0 z-40 bg-card border border-border rounded-md shadow-xl p-2 w-44 space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="text-[9px] uppercase font-bold text-muted-foreground px-2 py-1 border-b border-border/40 mb-1.5">
              Select Severities
            </div>
            {SEVERITY_OPTIONS.map((opt) => {
              const active = filters.severities.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  onClick={() => handleSeverityToggle(opt.value)}
                  className={cn(
                    "w-full text-left px-2.5 py-1.5 rounded-sm text-xs flex items-center justify-between transition-colors hover:bg-muted/30 text-foreground font-medium",
                    active && "bg-primary/10 text-primary hover:bg-primary/15"
                  )}
                >
                  <span className="capitalize">{opt.label}</span>
                  {active && <Check className="h-3.5 w-3.5 text-primary" />}
                </button>
              );
            })}
            {filters.severities.length > 0 && (
              <button
                onClick={() => dispatch(setSeverities([]))}
                className="w-full text-center py-1 text-[10px] font-bold text-danger hover:underline border-t border-border/40 mt-1.5"
              >
                Clear Selection
              </button>
            )}
          </div>
        )}
      </div>

      {/* Date Picker (single date) */}
      <input
        type="date"
        value={filters.singleDate ?? ''}
        onChange={(e) => dispatch(setSingleDate(e.target.value || null))}
        className={cn(
          "h-8.5 px-3 rounded-md border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer font-semibold",
          filters.singleDate && "border-primary/50 bg-primary/5"
        )}
        aria-label="Filter by single date"
        title="Single Date"
      />

      {/* Date Range Selector */}
      <DateRangePicker
        value={filters.dateRange}
        onChange={(range) => dispatch(setDateRange(range))}
        className="min-w-[240px]"
      />

      <div className="h-5 w-px bg-border" />

      {/* Saved Views Controls */}
      <div className="flex items-center gap-1.5">
        <select
          value={selectedSavedViewId}
          onChange={(e) => handleLoadSavedView(e.target.value)}
          className="h-8.5 px-3 rounded-md border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary min-w-[170px] font-semibold cursor-pointer"
          aria-label="Select saved operational view"
        >
          <option value="">Operational Presets</option>
          {filters.savedViews.map((view) => (
            <option key={view.id} value={view.id}>
              {view.name}
            </option>
          ))}
        </select>

        {selectedSavedViewId && (
          <Button
            onClick={handleDeleteView}
            variant="ghost"
            size="icon"
            className="h-8.5 w-8.5 text-danger hover:text-danger hover:bg-danger/10 border border-border/50 shrink-0"
            aria-label="Delete active saved view"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}

        <Button
          onClick={() => setShowSaveDialog(true)}
          variant="outline"
          size="sm"
          className="h-8.5 text-xs font-semibold gap-1 px-2.5"
          aria-label="Save current filter view"
        >
          <Save className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Save View</span>
        </Button>
      </div>

      {/* Reset workspace filters */}
      <Button
        onClick={() => {
          dispatch(resetFilters());
          setSelectedSavedViewId('');
        }}
        variant="ghost"
        size="sm"
        className="h-8.5 text-xs font-semibold gap-1 ml-auto text-muted-foreground hover:text-foreground"
        aria-label="Reset all active filters"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        <span>Reset</span>
      </Button>

      {/* Save View Modal Dialog overlay */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-start justify-center pt-24 p-4">
          <div className="bg-card border border-border rounded-lg p-4 w-full max-w-sm shadow-2xl animate-in scale-in duration-200">
            <h3 className="text-sm font-bold text-foreground mb-1.5 flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-primary" />
              Save Operational View
            </h3>
            <p className="text-[11px] text-muted-foreground leading-normal mb-4">
              Type a custom name to save the currently selected filters as a view preset.
            </p>
            <form onSubmit={handleSaveViewSubmit} className="space-y-3.5">
              <Input
                value={newViewName}
                onChange={(e) => setNewViewName(e.target.value)}
                placeholder="e.g. South Crime Patrol Unit"
                className="text-xs h-9"
                required
                autoFocus
              />
              <div className="flex justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowSaveDialog(false);
                    setNewViewName('');
                  }}
                  className="h-8 text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="h-8 text-xs font-semibold"
                >
                  Save Preset
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default GlobalFilterBar;
