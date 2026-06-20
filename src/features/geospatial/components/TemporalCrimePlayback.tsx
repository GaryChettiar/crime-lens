import { useEffect, useState, useRef, useCallback } from "react";
import { Play, Pause, FastForward, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useAppDispatch } from "@/store/hooks";
import { setDateRange } from "@/store/slices/globalFiltersSlice";

// Hardcoded date boundaries (will come from BE later)
const MIN_DATE = new Date("2022-01-01");
const MAX_DATE = new Date("2026-06-20");

// Total days in the full range
const TOTAL_DAYS = Math.round(
  (MAX_DATE.getTime() - MIN_DATE.getTime()) / (1000 * 60 * 60 * 24)
);

/** Convert a day-offset from MIN_DATE to a Date object */
const offsetToDate = (offset: number): Date => {
  const d = new Date(MIN_DATE);
  d.setDate(d.getDate() + offset);
  return d;
};

/** Format a Date as "DD Mon YYYY" for display */
const formatDateLabel = (d: Date): string =>
  d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

/** Format a Date as "YYYY-MM-DD" for Redux dispatch */
const formatDateISO = (d: Date): string => d.toISOString().split("T")[0];

const TIME_WINDOWS: { value: number | "cumulative"; label: string }[] = [
  { value: "cumulative", label: "Cumulative (Full)" },
  { value: 1, label: "1 Day Window" },
  { value: 3, label: "3 Days Window" },
  { value: 7, label: "7 Days Window" },
  { value: 14, label: "14 Days Window" },
];

export interface TemporalCrimePlaybackProps {
  startDate: string; // YYYY-MM-DD (kept for interface compat)
  endDate: string; // YYYY-MM-DD (kept for interface compat)
  currentDayOffset: number;
  onDayOffsetChange: (offset: number) => void;
  timeWindow: number | "cumulative";
  onTimeWindowChange: (window: number | "cumulative") => void;
  className?: string;
}

/**
 * TemporalCrimePlayback Organism
 *
 * Two modes:
 *  1. RANGE mode  – dual-thumb slider to pick a date range. Map updates live.
 *  2. PLAYER mode – single-thumb animated playback through the selected range.
 *
 * Transitions smoothly between modes with CSS animations.
 */
export function TemporalCrimePlayback({
  currentDayOffset,
  onDayOffsetChange,
  timeWindow,
  onTimeWindowChange,
  className,
}: TemporalCrimePlaybackProps) {
  const dispatch = useAppDispatch();

  // ── Mode state ──────────────────────────────────────────────
  type Mode = "range" | "playback";
  const [mode, setMode] = useState<Mode>("range");

  // ── Range selection state (offsets from MIN_DATE) ───────────
  // Default: last 365 days of the full range
  const defaultStart = Math.max(0, TOTAL_DAYS - 365);
  const [rangeStart, setRangeStart] = useState(defaultStart);
  const [rangeEnd, setRangeEnd] = useState(TOTAL_DAYS);

  // ── Playback state ─────────────────────────────────────────
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState<1 | 2 | 5 | 10>(1);
  const [playbackOffset, setPlaybackOffset] = useState(0);
  const playbackTotalDays = rangeEnd - rangeStart;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playbackOffsetRef = useRef(playbackOffset);

  const [isTimeWindowOpen, setIsTimeWindowOpen] = useState(false);
  const timeWindowDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        timeWindowDropdownRef.current &&
        !timeWindowDropdownRef.current.contains(event.target as Node)
      ) {
        setIsTimeWindowOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Keep ref in sync
  useEffect(() => {
    playbackOffsetRef.current = playbackOffset;
  }, [playbackOffset]);

  // ── Dispatch date range to Redux on range change ───────────
  const dispatchRange = useCallback(
    (start: number, end: number) => {
      dispatch(
        setDateRange({
          start: formatDateISO(offsetToDate(start)),
          end: formatDateISO(offsetToDate(end)),
        })
      );
    },
    [dispatch]
  );

  // Dispatch initial range on mount
  useEffect(() => {
    dispatchRange(rangeStart, rangeEnd);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Range slider change handler ────────────────────────────
  const handleRangeChange = useCallback(
    (values: number[]) => {
      const [s, e] = values;
      setRangeStart(s);
      setRangeEnd(e);
      dispatchRange(s, e);
    },
    [dispatchRange]
  );

  // ── Playback: dispatch the current playback date ───────────
  const dispatchPlaybackDate = useCallback(
    (offset: number) => {
      const currentDay = rangeStart + offset;
      // During playback, set the date range to start → current playback position
      // so the map shows data up to where the playback cursor is
      if (timeWindow === "cumulative") {
        dispatch(
          setDateRange({
            start: formatDateISO(offsetToDate(rangeStart)),
            end: formatDateISO(offsetToDate(currentDay)),
          })
        );
      } else {
        const windowStart = Math.max(rangeStart, currentDay - timeWindow);
        dispatch(
          setDateRange({
            start: formatDateISO(offsetToDate(windowStart)),
            end: formatDateISO(offsetToDate(currentDay)),
          })
        );
      }
      onDayOffsetChange(offset);
    },
    [dispatch, rangeStart, timeWindow, onDayOffsetChange]
  );

  // ── Play / Pause toggle ────────────────────────────────────
  const handleTogglePlay = useCallback(() => {
    if (mode === "range") {
      // Transition range → playback
      setPlaybackOffset(0);
      playbackOffsetRef.current = 0;
      setMode("playback");
      setIsPlaying(true);
      dispatchPlaybackDate(0);
    } else {
      // Toggle play/pause within playback mode
      setIsPlaying((prev) => !prev);
    }
  }, [mode, dispatchPlaybackDate]);

  // ── Reset button ───────────────────────────────────────────
  const handleReset = useCallback(() => {
    if (mode === "playback") {
      // Reset to 0 and restart animation
      setPlaybackOffset(0);
      playbackOffsetRef.current = 0;
      dispatchPlaybackDate(0);
      setIsPlaying(true);
    } else {
      // In range mode, reset to default range
      const defStart = Math.max(0, TOTAL_DAYS - 365);
      setRangeStart(defStart);
      setRangeEnd(TOTAL_DAYS);
      dispatchRange(defStart, TOTAL_DAYS);
    }
  }, [mode, dispatchPlaybackDate, dispatchRange]);

  // ── Speed cycle ────────────────────────────────────────────
  const cycleSpeed = useCallback(() => {
    setPlaySpeed((prev) => {
      if (prev === 1) return 2;
      if (prev === 2) return 5;
      if (prev === 5) return 10;
      return 1;
    });
  }, []);

  // ── Playback interval timer ────────────────────────────────
  useEffect(() => {
    if (isPlaying && mode === "playback") {
      const intervalMs = 1500 / playSpeed;

      intervalRef.current = setInterval(() => {
        const current = playbackOffsetRef.current;
        if (current >= playbackTotalDays) {
          // Playback finished → transition back to range mode
          setIsPlaying(false);
          setMode("range");
          // Restore the full selected range in Redux
          dispatchRange(rangeStart, rangeEnd);
        } else {
          const next = current + 1;
          setPlaybackOffset(next);
          dispatchPlaybackDate(next);
        }
      }, intervalMs);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [
    isPlaying,
    mode,
    playSpeed,
    playbackTotalDays,
    rangeStart,
    rangeEnd,
    dispatchPlaybackDate,
    dispatchRange,
  ]);

  // ── When leaving playback mode (e.g. paused then user moves range), restore range
  const handleBackToRange = useCallback(() => {
    setIsPlaying(false);
    setMode("range");
    dispatchRange(rangeStart, rangeEnd);
  }, [rangeStart, rangeEnd, dispatchRange]);

  // ── Computed labels ────────────────────────────────────────
  const rangeStartLabel = formatDateLabel(offsetToDate(rangeStart));
  const rangeEndLabel = formatDateLabel(offsetToDate(rangeEnd));
  const playbackCurrentLabel =
    mode === "playback"
      ? formatDateLabel(offsetToDate(rangeStart + playbackOffset))
      : "";
  const playbackProgress =
    playbackTotalDays > 0
      ? Math.round((playbackOffset / playbackTotalDays) * 100)
      : 0;

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center bg-card/90 backdrop-blur-md border border-border rounded-lg p-3.5 gap-3 sm:gap-4",
        className
      )}
      role="region"
      aria-label="Temporal Crime Timeline Playback"
    >
      {/* ── Slider Area ─────────────────────────────────── */}
      <div className="flex items-center gap-4 py-1 flex-1 min-w-0 relative">
        {/* Mode transition wrapper */}
        <div
          className={cn(
            "flex items-center gap-3 w-full transition-all duration-300 ease-in-out",
            mode === "playback" ? "opacity-0 scale-y-0 h-0 absolute pointer-events-none" : "opacity-100 scale-y-100"
          )}
        >
          {/* RANGE MODE: Dual-thumb slider */}
          <span className="text-[10px] font-bold font-data text-muted-foreground whitespace-nowrap">
            {rangeStartLabel}
          </span>
          <div className="flex-1 min-w-0">
            <Slider
              id="timeline-range-slider"
              min={0}
              max={TOTAL_DAYS}
              step={1}
              value={[rangeStart, rangeEnd]}
              onValueChange={handleRangeChange}
              aria-label="Date range selection slider"
            />
          </div>
          <span className="text-[10px] font-bold font-data text-muted-foreground whitespace-nowrap">
            {rangeEndLabel}
          </span>
        </div>

        <div
          className={cn(
            "flex items-center gap-3 w-full transition-all duration-300 ease-in-out",
            mode === "range" ? "opacity-0 scale-y-0 h-0 absolute pointer-events-none" : "opacity-100 scale-y-100"
          )}
        >
          {/* PLAYBACK MODE: Single-thumb animated slider */}
          <span className="text-[10px] font-bold font-data text-primary whitespace-nowrap">
            {playbackCurrentLabel}
          </span>
          <div className="flex-1 min-w-0">
            <Slider
              id="timeline-playback-scrubber"
              min={0}
              max={playbackTotalDays}
              step={1}
              value={[playbackOffset]}
              onValueChange={([val]) => {
                setPlaybackOffset(val);
                dispatchPlaybackDate(val);
              }}
              aria-label="Timeline playback scrubber"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold font-data text-muted-foreground whitespace-nowrap">
              {formatDateLabel(offsetToDate(rangeEnd))}
            </span>
            <span className="text-[9px] font-data text-muted-foreground/70 tabular-nums">
              {playbackProgress}%
            </span>
          </div>
        </div>
      </div>

      {/* ── Controls ────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 flex-wrap shrink-0">
        {/* Back to range (only in playback when paused) */}
        {mode === "playback" && !isPlaying && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={handleBackToRange}
            aria-label="Back to range selection"
          >
            Range
          </Button>
        )}

        {/* Reset */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={handleReset}
          aria-label={mode === "playback" ? "Restart playback from beginning" : "Reset date range"}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>

        {/* Play / Pause */}
        <Button
          variant="secondary"
          size="sm"
          className="h-8 gap-1.5 px-3 bg-primary text-primary-foreground hover:bg-primary/95"
          onClick={handleTogglePlay}
          aria-label={
            mode === "range"
              ? "Start playback animation"
              : isPlaying
                ? "Pause simulation"
                : "Resume simulation"
          }
        >
          {mode === "playback" && isPlaying ? (
            <>
              <Pause className="h-3.5 w-3.5 fill-current" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Play</span>
            </>
          )}
        </Button>

        {/* Speed Toggle */}
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1 px-2.5 font-data text-xs font-semibold"
          onClick={cycleSpeed}
          aria-label={`Change speed (current: ${playSpeed}x)`}
        >
          <FastForward className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{playSpeed}x</span>
        </Button>

        {/* Time Window Dropdown Selector (styled) */}
        <div ref={timeWindowDropdownRef} className="relative shrink-0">
          <button
            onClick={() => setIsTimeWindowOpen(!isTimeWindowOpen)}
            className="relative border border-border/80 rounded-lg px-3 py-1 bg-background text-[11px] font-semibold min-w-[160px] h-8 flex flex-col justify-center text-left cursor-pointer hover:border-border/100 transition-colors w-full"
            aria-label="Select sliding time window"
          >
            <span className="absolute -top-2 left-2 px-1 text-[8px] bg-card text-muted-foreground font-bold uppercase tracking-wider">Time Window</span>
            <div className="flex items-center justify-between text-foreground w-full">
              <span className="truncate pr-4">
                {timeWindow === "cumulative"
                  ? "Cumulative (Full)"
                  : `${timeWindow} Day${timeWindow === 1 ? "" : "s"} Window`}
              </span>
              <span className="text-[9px] text-muted-foreground">▼</span>
            </div>
          </button>

          {isTimeWindowOpen && (
            <div className="absolute top-full mt-1.5 right-0 w-[170px] bg-card border border-border rounded-lg shadow-xl z-50 flex flex-col overflow-hidden max-h-72 animate-in fade-in-50 slide-in-from-top-1 duration-200">
              <div className="overflow-y-auto flex-1 py-1.5 scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent">
                {TIME_WINDOWS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      onTimeWindowChange(opt.value);
                      setIsTimeWindowOpen(false);
                    }}
                    className="relative w-full text-left pl-7 pr-3 py-1.5 text-xs text-foreground hover:bg-muted/80 cursor-pointer transition-colors"
                  >
                    {timeWindow === opt.value && (
                      <span className="absolute left-3 text-primary font-bold">✓</span>
                    )}
                    <span className={cn(timeWindow === opt.value && "font-semibold text-primary")}>
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TemporalCrimePlayback;
