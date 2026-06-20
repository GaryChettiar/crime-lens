"use client"

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface CalendarProps {
  mode?: 'single' | 'range';
  selected?: Date | null | { from: Date | null; to: Date | null };
  onSelect?: (date: any) => void;
  className?: string;
  disabledDates?: (date: Date) => boolean;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function Calendar({
  mode = 'single',
  selected,
  onSelect,
  className,
  disabledDates,
}: CalendarProps) {
  const [currentDate, setCurrentDate] = React.useState<Date>(() => {
    if (mode === 'single' && selected instanceof Date) {
      return new Date(selected);
    }
    if (mode === 'range' && selected && typeof selected === 'object' && 'from' in selected && selected.from instanceof Date) {
      return new Date(selected.from);
    }
    return new Date();
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Helper to check date equality
  const isSameDay = (d1: Date | null, d2: Date | null) => {
    if (!d1 || !d2) return false;
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  const isDateBetween = (date: Date, start: Date | null, end: Date | null) => {
    if (!start || !end) return false;
    const t = date.getTime();
    const s = new Date(start).setHours(0, 0, 0, 0);
    const e = new Date(end).setHours(23, 59, 59, 999);
    return t >= s && t <= e;
  };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const days = React.useMemo(() => {
    const list = [];
    
    // Add blanks for preceding month days
    for (let i = 0; i < firstDayIndex; i++) {
      list.push(null);
    }

    // Add actual days
    for (let i = 1; i <= daysInMonth; i++) {
      list.push(new Date(year, month, i));
    }

    return list;
  }, [year, month, daysInMonth, firstDayIndex]);

  const handleDayClick = (date: Date) => {
    if (disabledDates?.(date)) return;

    if (mode === 'single') {
      onSelect?.(date);
    } else if (mode === 'range') {
      const range = selected as { from: Date | null; to: Date | null } || { from: null, to: null };
      
      if (!range.from || (range.from && range.to)) {
        onSelect?.({ from: date, to: null });
      } else {
        // Set range.to
        if (date.getTime() < range.from.getTime()) {
          onSelect?.({ from: date, to: null });
        } else {
          onSelect?.({ from: range.from, to: date });
        }
      }
    }
  };

  const rangeFrom = mode === 'range' && selected && typeof selected === 'object' && 'from' in selected ? selected.from : null;
  const rangeTo = mode === 'range' && selected && typeof selected === 'object' && 'to' in selected ? selected.to : null;

  return (
    <div className={cn("p-3 w-fit text-foreground bg-card select-none", className)}>
      <div className="flex items-center justify-between pb-3">
        <span className="text-xs font-bold text-foreground">
          {MONTHS[month]} {year}
        </span>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevMonth}
            className="h-7 w-7 rounded-md p-0 flex items-center justify-center cursor-pointer hover:bg-accent/40"
            aria-label="Go to previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextMonth}
            className="h-7 w-7 rounded-md p-0 flex items-center justify-center cursor-pointer hover:bg-accent/40"
            aria-label="Go to next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-muted-foreground pb-2">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day} className="w-8 h-4 flex items-center justify-center uppercase">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 font-sans text-xs">
        {days.map((date, idx) => {
          if (!date) {
            return <div key={`empty-${idx}`} className="w-8 h-8" />;
          }

          const isDisabled = disabledDates?.(date);
          const isSelectedSingle = mode === 'single' && selected instanceof Date && isSameDay(date, selected);
          const isFrom = mode === 'range' && rangeFrom && isSameDay(date, rangeFrom);
          const isTo = mode === 'range' && rangeTo && isSameDay(date, rangeTo);
          const isInRange = mode === 'range' && rangeFrom && rangeTo && isDateBetween(date, rangeFrom, rangeTo);
          const isToday = isSameDay(date, new Date());

          return (
            <button
              key={date.toISOString()}
              type="button"
              disabled={isDisabled}
              onClick={() => handleDayClick(date)}
              className={cn(
                "w-8 h-8 rounded-md flex items-center justify-center text-[11px] font-semibold transition-all cursor-pointer relative",
                isToday && "border border-primary/40 text-primary",
                isSelectedSingle && "bg-primary text-primary-foreground font-bold hover:bg-primary/95",
                isFrom && "bg-primary text-primary-foreground font-bold rounded-l-md rounded-r-none hover:bg-primary/95 z-10",
                isTo && "bg-primary text-primary-foreground font-bold rounded-r-md rounded-l-none hover:bg-primary/95 z-10",
                isFrom && !rangeTo && "rounded-md", // single point selection
                isInRange && "bg-primary/10 text-primary rounded-none",
                !isSelectedSingle && !isFrom && !isTo && !isInRange && "hover:bg-accent hover:text-accent-foreground text-foreground",
                isDisabled && "opacity-30 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground"
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
