/* =============================================================================
   CrimeLens — Shared Component State Types
   =============================================================================
   Every component that displays data must support these four states:
   1. Loading — data is being fetched
   2. Error — fetch failed or data is invalid
   3. Empty — fetch succeeded but returned no results
   4. Success — data is available (default render path)
   ============================================================================= */

/**
 * Standard loadable state for any data-driven component.
 */
export interface LoadableState {
  isLoading: boolean;
  error: Error | SerializedError | null;
  isEmpty: boolean;
}

/**
 * Serialized error shape from RTK Query / Redux Toolkit.
 */
export interface SerializedError {
  name?: string;
  message?: string;
  stack?: string;
  code?: string;
}

/**
 * Base props that every component should accept.
 */
export interface ComponentBaseProps {
  /** Additional CSS classes */
  className?: string;
  /** Unique identifier for the DOM element */
  id?: string;
  /** Test identifier for automated testing */
  testId?: string;
}

/**
 * Props for components that render in one of four data states.
 */
export interface DataComponentProps<T> extends ComponentBaseProps {
  /** The data to render when available */
  data?: T;
  /** Whether data is currently loading */
  isLoading?: boolean;
  /** Error that occurred during data fetch */
  error?: Error | SerializedError | null;
  /** Callback when user requests a retry after error */
  onRetry?: () => void;
  /** Custom empty state message */
  emptyMessage?: string;
  /** Custom error message override */
  errorMessage?: string;
}

/**
 * Risk level type used across the application.
 */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Common status type for badges and indicators.
 */
export type Status =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'muted';

/**
 * Theme type for the application.
 */
export type Theme = 'dark' | 'light' | 'system';
