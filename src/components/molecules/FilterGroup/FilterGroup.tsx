import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { ComponentBaseProps } from '@/types/component-states';

/**
 * FilterGroup Molecule
 *
 * Horizontal group of filter controls (selects, toggles, date pickers).
 * Provides consistent spacing and layout for filter bars.
 *
 * @example
 * <FilterGroup label="Filters">
 *   <Select ... />
 *   <DatePicker ... />
 *   <Button variant="outline">Reset</Button>
 * </FilterGroup>
 */

interface FilterGroupProps extends ComponentBaseProps {
  /** Accessible label for the filter group */
  label?: string;
  /** Filter control children */
  children: ReactNode;
  /** Show active filter count */
  activeCount?: number;
}

export function FilterGroup({
  label = 'Filters',
  children,
  activeCount,
  className,
  id,
  testId,
}: FilterGroupProps) {
  return (
    <div
      id={id}
      data-testid={testId}
      role="group"
      aria-label={label}
      className={cn(
        'flex flex-wrap items-center gap-2',
        className,
      )}
    >
      {children}
      {activeCount !== undefined && activeCount > 0 && (
        <span
          className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-medium text-primary-foreground"
          aria-label={`${activeCount} active filters`}
        >
          {activeCount}
        </span>
      )}
    </div>
  );
}
