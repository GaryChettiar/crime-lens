import { useEffect, useState, useRef, useCallback } from "react";
import { Play, Pause, FastForward, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Typography } from "@/components/atoms/Typography";
import { cn } from "@/lib/utils";

export interface TemporalCrimePlaybackProps {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  currentDayOffset: number; // 0 to 30
  onDayOffsetChange: (offset: number) => void;
  timeWindow: number | "cumulative";
  onTimeWindowChange: (window: number | "cumulative") => void;
  className?: string;
}

/**
 * TemporalCrimePlayback Organism
 * Playback control player overlaying the timeline for chronological crime simulation.
 */
export function TemporalCrimePlayback({
  startDate,
  currentDayOffset,
  onDayOffsetChange,
  timeWindow,
  onTimeWindowChange,
  className,
}: TemporalCrimePlaybackProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState<1 | 2 | 5 | 10>(1); // Speed factors
  const intervalRef = useRef<any>(null);

  // Parse start date to display human readable date on slider
  const getLabelForOffset = useCallback(
    (offset: number) => {
      const start = new Date(startDate);
      start.setDate(start.getDate() + offset);
      return start.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    },
    [startDate],
  );

  const handleTogglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  const handleReset = () => {
    setIsPlaying(false);
    onDayOffsetChange(0);
  };

  const cycleSpeed = () => {
    setPlaySpeed((prev) => {
      if (prev === 1) return 2;
      if (prev === 2) return 5;
      if (prev === 5) return 10;
      return 1;
    });
  };

  const offsetRef = useRef(currentDayOffset);
  useEffect(() => {
    offsetRef.current = currentDayOffset;
  }, [currentDayOffset]);

  // Playback timer loop
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = 1500 / playSpeed; // Milliseconds per day increment

      intervalRef.current = setInterval(() => {
        if (offsetRef.current >= 30) {
          setIsPlaying(false);
        } else {
          onDayOffsetChange(offsetRef.current + 1);
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
  }, [isPlaying, playSpeed, onDayOffsetChange]);

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center bg-card/90 backdrop-blur-md border border-border rounded-lg p-3.5  gap-3 sm:gap-4",
        className,
      )}
      role="region"
      aria-label="Temporal Crime Timeline Playback"
    >
      {/* Player Controls */}
     

      {/* Slider Scrubber */}
      <div className="flex items-center gap-4 py-1 flex-1 min-w-0">
        <span className="text-[10px] font-bold font-data text-muted-foreground whitespace-nowrap">
          {getLabelForOffset(0)}
        </span>
        <div className="flex-1 min-w-0">
          <Slider
            id="timeline-scrubber"
            min={0}
            max={30}
            step={1}
            value={[currentDayOffset]}
            onValueChange={([val]) => onDayOffsetChange(val)}
            aria-label="Timeline scrubber day position"
          />
        </div>
        <span className="text-[10px] font-bold font-data text-muted-foreground whitespace-nowrap">
          {getLabelForOffset(30)}
        </span>
      </div>
       <div className="flex items-center gap-1.5 flex-wrap shrink-0">
        {/* Reset */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={handleReset}
          aria-label="Rewind timeline to day 1"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>

        {/* Play / Pause */}
        <Button
          variant="secondary"
          size="sm"
          className="h-8 gap-1.5 px-3 bg-primary text-primary-foreground hover:bg-primary/95"
          onClick={handleTogglePlay}
          aria-label={isPlaying ? "Pause simulation" : "Play simulation"}
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
          className="h-8 gap-1 px-2.5 font-data text-xs font-semibold"
          onClick={cycleSpeed}
          aria-label={`Change speed (current: ${playSpeed}x)`}
        >
          <FastForward className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{playSpeed}x</span>
        </Button>

        {/* Time Window Dropdown Selector */}
        <select
          value={timeWindow}
          onChange={(e) => {
            const val = e.target.value;
            onTimeWindowChange(
              val === "cumulative" ? "cumulative" : parseInt(val),
            );
          }}
          className="h-8 px-2 rounded-md border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-semibold cursor-pointer"
          aria-label="Select sliding time window"
        >
          <option value="cumulative">Cumulative (Full)</option>
          <option value="1">1 Day Window</option>
          <option value="3">3 Days Window</option>
          <option value="7">7 Days Window</option>
          <option value="14">14 Days Window</option>
        </select>
      </div>
    </div>
  );
}
export default TemporalCrimePlayback;
