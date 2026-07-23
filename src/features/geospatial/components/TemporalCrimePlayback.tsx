import { useEffect, useState, useRef, useCallback } from "react";
import { Play, Pause, FastForward, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setDateRange } from "@/store/slices/globalFiltersSlice";

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

export function TemporalCrimePlayback({
  startDate,
  endDate,
  currentDayOffset,
  onDayOffsetChange,
  timeWindow,
  onTimeWindowChange,
  className,
}: TemporalCrimePlaybackProps) {
  const dispatch = useAppDispatch();
  const globalFilters = useAppSelector((state) => state.globalFilters);

  // ── Mode and Playback states ───────────────────────────────
  type Mode = "range" | "playback";
  const [mode, setMode] = useState<Mode>("range");
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState<1 | 2 | 5 | 10>(1);
  const [playbackOffset, setPlaybackOffset] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playbackOffsetRef = useRef(playbackOffset);

  const [isTimeWindowOpen, setIsTimeWindowOpen] = useState(false);
  const timeWindowDropdownRef = useRef<HTMLDivElement>(null);

  // Derived active range dates from props
  const activeStart = startDate ? new Date(startDate) : MIN_DATE;
  const activeEnd = endDate ? new Date(endDate) : MAX_DATE;

  const isSingleDate = startDate === endDate;

  const playbackTotalDays = Math.max(
    0,
    Math.round((activeEnd.getTime() - activeStart.getTime()) / (1000 * 60 * 60 * 24))
  );

  useEffect(() => {
    playbackOffsetRef.current = playbackOffset;
  }, [playbackOffset]);

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

  // ── Playback: dispatch current playback subset ─────────────
  const dispatchPlaybackDate = useCallback(
    (offset: number) => {
      const currentDay = new Date(activeStart);
      currentDay.setDate(currentDay.getDate() + offset);

      if (timeWindow === "cumulative") {
        dispatch(
          setDateRange({
            start: formatDateISO(activeStart),
            end: formatDateISO(currentDay),
          })
        );
      } else {
        const windowStart = new Date(currentDay);
        windowStart.setDate(windowStart.getDate() - timeWindow);
        const finalStart = windowStart < activeStart ? activeStart : windowStart;
        dispatch(
          setDateRange({
            start: formatDateISO(finalStart),
            end: formatDateISO(currentDay),
          })
        );
      }
      onDayOffsetChange(offset);
    },
    [dispatch, activeStart, timeWindow, onDayOffsetChange]
  );

  // ── Play / Pause toggle ────────────────────────────────────
  const handleTogglePlay = useCallback(() => {
    if (playbackTotalDays === 0) return;

    if (mode === "range") {
      setPlaybackOffset(0);
      playbackOffsetRef.current = 0;
      setMode("playback");
      setIsPlaying(true);
      dispatchPlaybackDate(0);
    } else {
      setIsPlaying((prev) => !prev);
    }
  }, [mode, dispatchPlaybackDate, playbackTotalDays]);

  // ── Reset ──────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setPlaybackOffset(0);
    playbackOffsetRef.current = 0;
    setIsPlaying(false);
    setMode("range");
    dispatch(
      setDateRange({
        start: formatDateISO(activeStart),
        end: formatDateISO(activeEnd),
      })
    );
    onDayOffsetChange(0);
  }, [dispatch, activeStart, activeEnd, onDayOffsetChange]);

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
    if (isPlaying && mode === "playback" && playbackTotalDays > 0) {
      const intervalMs = 1500 / playSpeed;

      intervalRef.current = setInterval(() => {
        const current = playbackOffsetRef.current;
        if (current >= playbackTotalDays) {
          setIsPlaying(false);
          setMode("range");
          dispatch(
            setDateRange({
              start: formatDateISO(activeStart),
              end: formatDateISO(activeEnd),
            })
          );
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
    activeStart,
    activeEnd,
    dispatchPlaybackDate,
    dispatch,
  ]);

  const offsetToDate = (offset: number): Date => {
    const d = new Date(activeStart);
    d.setDate(d.getDate() + offset);
    return d;
  };

  const playbackProgress =
    playbackTotalDays > 0
      ? Math.round((playbackOffset / playbackTotalDays) * 100)
      : 0;

  return (
    <div
      className={cn(
        "flex flex-col xl:flex-row xl:items-center bg-card/90 border border-border/40 rounded-lg p-2.5 gap-3 sm:gap-4 flex-1 min-w-0",
        className
      )}
      role="region"
      aria-label="Temporal Crime Timeline Playback"
    >
      {/* ── Scrubber Slider Area ─────────────────────────── */}
      <div className="flex items-center gap-3 py-1 flex-1 min-w-0">
        {isSingleDate ? (
          <span className="text-[11px] font-medium text-muted-foreground italic select-none">
            Single date selected. Choose 'Date Range' to enable timeline playback.
          </span>
        ) : (
          <>
            <span className="text-[10px] font-bold font-data text-primary whitespace-nowrap min-w-[70px] text-right">
              {formatDateLabel(offsetToDate(playbackOffset))}
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
                  setMode("playback");
                  dispatchPlaybackDate(val);
                }}
                aria-label="Timeline playback scrubber"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold font-data text-muted-foreground whitespace-nowrap">
                {formatDateLabel(activeEnd)}
              </span>
              <span className="text-[9px] font-data text-muted-foreground/70 tabular-nums">
                {playbackProgress}%
              </span>
            </div>
          </>
        )}
      </div>

      {/* ── Controls ────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 flex-wrap shrink-0">
        {/* Reset */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
          onClick={handleReset}
          aria-label="Reset timeline playback"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>

        {/* Play / Pause */}
        <Button
          variant="secondary"
          size="sm"
          disabled={isSingleDate || playbackTotalDays === 0}
          className="h-8 gap-1.5 px-3 bg-primary text-primary-foreground hover:bg-primary/95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          onClick={handleTogglePlay}
          aria-label={isPlaying ? "Pause simulation" : "Start playback animation"}
        >
          {isPlaying ? (
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
          disabled={isSingleDate}
          className="h-8 gap-1 px-2.5 font-data text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          onClick={cycleSpeed}
          aria-label={`Change speed (current: ${playSpeed}x)`}
        >
          <FastForward className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{playSpeed}x</span>
        </Button>

        {/* Time Window Dropdown Selector */}
        <div ref={timeWindowDropdownRef} className="relative shrink-0">
          <button
            onClick={() => setIsTimeWindowOpen(!isTimeWindowOpen)}
            disabled={isSingleDate}
            className="relative border border-border/80 rounded-lg px-3 py-1 bg-background text-[11px] font-semibold min-w-[160px] h-8 flex flex-col justify-center text-left cursor-pointer hover:border-border/100 transition-colors w-full disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Select sliding time window"
          >
            <span className="absolute -top-2 left-2 px-1 text-[8px] bg-card text-muted-foreground font-bold uppercase tracking-wider">Time Window</span>
            <div className="flex items-center justify-between text-foreground w-full">
              <span className="pr-4 truncate">
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
