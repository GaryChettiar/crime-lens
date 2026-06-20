"use client"

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, HelpCircle, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/atoms/Badge';
import karnatakaEvents from '@/features/intelligence/data/karnatakaEvents.json';

export interface DateRange {
  start: string | null;
  end: string | null;
}

export interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
  placeholder?: string;
}

export function DateRangePicker({
  value,
  onChange,
  className,
  placeholder = "Select date range",
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Parse strings to Date objects for Calendar rendering
  const calendarValue = React.useMemo(() => {
    return {
      from: value.start ? new Date(value.start) : null,
      to: value.end ? new Date(value.end) : null,
    };
  }, [value.start, value.end]);

  const handleSelect = (range: { from: Date | null; to: Date | null }) => {
    const startStr = range.from ? range.from.toISOString().split('T')[0] : null;
    const endStr = range.to ? range.to.toISOString().split('T')[0] : null;
    
    onChange({ start: startStr, end: endStr });
    
    // Close Popover only when both dates are selected
    if (startStr && endStr) {
      setIsOpen(false);
    }
  };

  const handlePresetClick = (preset: 'today' | '7days' | '30days' | '90days' | 'thisMonth' | 'custom') => {
    const today = new Date();
    let start: Date | null = new Date();
    let end: Date | null = new Date();

    if (preset === 'today') {
      // both today
    } else if (preset === '7days') {
      start.setDate(today.getDate() - 7);
    } else if (preset === '30days') {
      start.setDate(today.getDate() - 30);
    } else if (preset === '90days') {
      start.setDate(today.getDate() - 90);
    } else if (preset === 'thisMonth') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else {
      start = null;
      end = null;
    }

    const startStr = start ? start.toISOString().split('T')[0] : null;
    const endStr = end ? end.toISOString().split('T')[0] : null;

    onChange({ start: startStr, end: endStr });
    if (preset !== 'custom') {
      setIsOpen(false);
    }
  };

  const formattedLabel = React.useMemo(() => {
    if (!value.start && !value.end) return placeholder;
    const startFmt = value.start ? format(new Date(value.start), "MMM dd, yyyy") : "";
    const endFmt = value.end ? format(new Date(value.end), "MMM dd, yyyy") : "";
    if (value.start && !value.end) return `${startFmt} ➔ Pick End Date`;
    return `[ ${startFmt} ➔ ${endFmt} ]`;
  }, [value.start, value.end, placeholder]);

  // Dynamic Event Filtering based on selected Date Range (Overlapping Events)
  const activeEventsInRange = React.useMemo(() => {
    if (!value.start || !value.end) return [];
    const sTime = new Date(value.start).getTime();
    const eTime = new Date(value.end).getTime();

    return karnatakaEvents.filter((event) => {
      const evStart = new Date(event.startDate).getTime();
      const evEnd = new Date(event.endDate).getTime();
      return evStart <= eTime && evEnd >= sTime;
    });
  }, [value.start, value.end]);

  return (
    <div className={cn("relative", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full text-xs font-semibold h-8.5 px-3 border border-border justify-start text-left gap-2 cursor-pointer font-data select-none"
            aria-label={`Selected date range: ${formattedLabel}`}
          >
            <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="truncate text-foreground">{formattedLabel}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0 z-50 flex flex-col md:flex-row bg-slate-950 border border-border shadow-2xl rounded-lg max-h-[85vh] overflow-y-auto md:overflow-visible">
          
          {/* Presets Sidebar */}
          <div className="flex flex-col gap-1 p-3 border-b md:border-b-0 md:border-r border-border/40 min-w-[125px]">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest pb-1 border-b border-border/20 mb-1 flex items-center gap-1">
              <HelpCircle className="h-3 w-3" /> presets
            </span>
            {[
              { id: 'today', label: 'Today' },
              { id: '7days', label: 'Last 7 Days' },
              { id: '30days', label: 'Last 30 Days' },
              { id: '90days', label: 'Last 90 Days' },
              { id: 'thisMonth', label: 'This Month' },
              { id: 'custom', label: 'Custom Range' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePresetClick(p.id as any)}
                className="text-left text-[11px] font-bold text-muted-foreground hover:text-foreground hover:bg-muted/30 px-2 py-1.5 rounded transition-all cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Calendar Picker Panel */}
          <div className="border-b md:border-b-0 md:border-r border-border/40">
            <Calendar
              mode="range"
              selected={calendarValue}
              onSelect={handleSelect}
            />
          </div>

          {/* Event Intelligence Preview Panel */}
          <div className="w-[280px] p-3 flex flex-col gap-2 bg-slate-900/10">
            <span className="text-[9px] font-bold text-primary uppercase tracking-widest pb-1 border-b border-border/20 flex items-center gap-1.5 shrink-0">
              <ShieldAlert className="h-3.5 w-3.5 text-primary animate-pulse" />
              Events in Selected Range
            </span>

            <div className="flex-1 overflow-y-auto min-h-[150px] max-h-[260px] space-y-2.5 pr-1">
              {activeEventsInRange.length === 0 ? (
                <div className="text-[10px] text-muted-foreground italic text-center pt-8 leading-normal">
                  No public festivals or mass gatherings registered during this window.
                </div>
              ) : (
                activeEventsInRange.map((ev) => (
                  <div key={ev.id} className="border border-border/40 p-2 rounded bg-muted/15 space-y-1">
                    <div className="flex justify-between items-start gap-1">
                      <span className="font-bold text-foreground text-xs leading-tight">{ev.name}</span>
                      <Badge
                        variant={
                          ev.riskLevel === 'critical' ? 'risk-critical' :
                          ev.riskLevel === 'high' ? 'risk-high' :
                          ev.riskLevel === 'medium' ? 'risk-medium' : 'success'
                        }
                        size="sm"
                        className="scale-80 origin-top-right shrink-0 uppercase tracking-wide"
                      >
                        {ev.riskLevel}
                      </Badge>
                    </div>
                    <div className="text-[9px] text-muted-foreground leading-normal">
                      District: <strong className="text-foreground">{ev.district}</strong> · Projected Crowd: <strong className="text-foreground font-data">{ev.expectedAttendance.toLocaleString()}</strong>
                    </div>
                    <div className="text-[8.5px] text-muted-foreground flex justify-between pt-1 border-t border-border/10">
                      <span>Thefts: <strong className="text-danger font-data">+{ev.historicalTheftIncrease}%</strong></span>
                      <span>Assaults: <strong className="text-warning font-data">+{ev.historicalAssaultIncrease}%</strong></span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </PopoverContent>
      </Popover>
    </div>
  );
}
