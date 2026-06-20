"use client"

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

export interface DatePickerProps {
  value?: string;
  onChange?: (e: { target: { value: string } }) => void;
  className?: string;
  placeholder?: string;
  label?: string;
  id?: string;
  showTime?: boolean; // Enable time input (datetime-local compatibility)
}

export function DatePicker({
  value = "",
  onChange,
  className,
  placeholder,
  label,
  id,
  showTime = false,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Extract date and time strings
  const datePart = React.useMemo(() => {
    if (!value) return "";
    return value.includes('T') ? value.split('T')[0] : value;
  }, [value]);

  const timePart = React.useMemo(() => {
    if (!value) return "12:00";
    return value.includes('T') ? value.split('T')[1] : "12:00";
  }, [value]);

  const selectedDate = React.useMemo(() => {
    if (!datePart) return null;
    return new Date(datePart);
  }, [datePart]);

  const handleSelect = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const finalVal = showTime ? `${dateStr}T${timePart}` : dateStr;
    
    onChange?.({
      target: {
        value: finalVal
      }
    });

    if (!showTime) {
      setIsOpen(false);
    }
  };

  const handleTimeChange = (newTime: string) => {
    const dateStr = datePart || new Date().toISOString().split('T')[0];
    onChange?.({
      target: {
        value: `${dateStr}T${newTime}`
      }
    });
  };

  const formattedLabel = React.useMemo(() => {
    if (!value) return placeholder || (showTime ? "Select Date & Time" : "Select Date");
    try {
      // Re-normalize date string for date-fns parsing to avoid local/UTC shifts
      const cleanVal = value.replace(' ', 'T');
      const dateObj = new Date(cleanVal);
      if (isNaN(dateObj.getTime())) {
        return value;
      }
      return showTime 
        ? format(dateObj, "MMM dd, yyyy HH:mm") 
        : format(new Date(datePart), "MMM dd, yyyy");
    } catch {
      return value;
    }
  }, [value, datePart, showTime, placeholder]);

  return (
    <div className={cn("flex flex-col gap-1.5 w-full", className)}>
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
        >
          {label}
        </label>
      )}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            className="w-full text-xs font-semibold h-9 px-3 border border-border justify-start text-left gap-2 cursor-pointer font-data select-none"
            aria-label={label || formattedLabel}
          >
            <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="truncate text-foreground">{formattedLabel}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0 z-50 bg-slate-950 border border-border shadow-2xl rounded-lg">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
          />
          {showTime && (
            <div className="border-t border-border/40 p-2.5 flex items-center justify-between gap-3 bg-slate-900/10">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Select Time
              </span>
              <input
                type="time"
                value={timePart}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="bg-background border border-border rounded-md px-2 py-0.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary h-7 font-data"
              />
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
