import { useState, useCallback, type ChangeEvent, type KeyboardEvent } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/atoms/Icon';
import type { ComponentBaseProps } from '@/types/component-states';

/**
 * SearchBar Molecule
 *
 * Global search input with clear button and keyboard shortcuts.
 * Designed for dashboard header placement.
 *
 * @example
 * <SearchBar
 *   placeholder="Search cases, locations, suspects..."
 *   onSearch={(query) => handleSearch(query)}
 * />
 */

interface SearchBarProps extends ComponentBaseProps {
  /** Placeholder text */
  placeholder?: string;
  /** Callback when search is submitted */
  onSearch?: (query: string) => void;
  /** Callback on each keystroke */
  onChange?: (query: string) => void;
  /** Controlled value */
  value?: string;
  /** Default value for uncontrolled usage */
  defaultValue?: string;
  /** Keyboard shortcut hint */
  shortcutHint?: string;
}

export function SearchBar({
  placeholder = 'Search...',
  onSearch,
  onChange,
  value: controlledValue,
  defaultValue = '',
  shortcutHint = '⌘K',
  className,
  id,
  testId,
}: SearchBarProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const value = controlledValue ?? internalValue;
  const isControlled = controlledValue !== undefined;

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if (!isControlled) setInternalValue(newValue);
      onChange?.(newValue);
    },
    [isControlled, onChange],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        onSearch?.(value);
      }
      if (e.key === 'Escape') {
        if (!isControlled) setInternalValue('');
        onChange?.('');
      }
    },
    [value, onSearch, onChange, isControlled],
  );

  const handleClear = useCallback(() => {
    if (!isControlled) setInternalValue('');
    onChange?.('');
    onSearch?.('');
  }, [isControlled, onChange, onSearch]);

  return (
    <div
      id={id}
      data-testid={testId}
      className={cn(
        'relative flex items-center',
        className,
      )}
    >
      <Icon
        icon={Search}
        size="sm"
        className="absolute left-3 text-muted-foreground pointer-events-none"
      />
      <input
        type="search"
        role="searchbox"
        aria-label="Search"
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={cn(
          'h-9 w-full rounded-md border border-input bg-background pl-9 pr-20 text-body-sm text-foreground',
          'placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'transition-colors',
        )}
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-12 p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
        >
          <Icon icon={X} size="xs" />
        </button>
      )}
      <kbd
        className="absolute right-3 hidden items-center gap-0.5 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-flex"
        aria-hidden="true"
      >
        {shortcutHint}
      </kbd>
    </div>
  );
}
