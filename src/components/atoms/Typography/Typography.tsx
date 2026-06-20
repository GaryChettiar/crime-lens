import { forwardRef, type ElementType, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { TypographyVariant } from '@/styles/tokens';

/**
 * Typography Atom
 *
 * Polymorphic text component that renders semantic HTML elements with
 * design system typography variants. Ensures consistent type treatment
 * across the application.
 *
 * @example
 * <Typography variant="heading-xl" as="h1">Dashboard</Typography>
 * <Typography variant="body-md">Crime report summary</Typography>
 * <Typography variant="caption" color="muted">Last updated: 5m ago</Typography>
 */

// Maps typography variants to default HTML elements
const DEFAULT_ELEMENT_MAP: Record<TypographyVariant, ElementType> = {
  'display-xl': 'h1',
  'display-lg': 'h1',
  'display-md': 'h2',
  'heading-xl': 'h2',
  'heading-lg': 'h3',
  'heading-md': 'h4',
  'heading-sm': 'h5',
  'body-lg': 'p',
  'body-md': 'p',
  'body-sm': 'p',
  caption: 'span',
};

type ColorVariant =
  | 'default'
  | 'muted'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

const COLOR_MAP: Record<ColorVariant, string> = {
  default: 'text-foreground',
  muted: 'text-muted-foreground',
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  info: 'text-info',
};

interface TypographyProps {
  /** Typography scale variant */
  variant?: TypographyVariant;
  /** HTML element to render */
  as?: ElementType;
  /** Semantic color variant */
  color?: ColorVariant;
  /** Use tabular numbers for data display */
  tabular?: boolean;
  /** Truncate with ellipsis */
  truncate?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Content */
  children: ReactNode;
  /** Accessibility: element id */
  id?: string;
}

export const Typography = forwardRef<HTMLElement, TypographyProps>(
  (
    {
      variant = 'body-md',
      as,
      color = 'default',
      tabular = false,
      truncate = false,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const Component = as ?? DEFAULT_ELEMENT_MAP[variant];

    return (
      <Component
        ref={ref}
        className={cn(
          // Typography variant class (from typography.css)
          `text-${variant}`,
          // Color
          COLOR_MAP[color],
          // Tabular numbers for data
          tabular && 'font-data',
          // Truncation
          truncate && 'truncate',
          className,
        )}
        {...props}
      >
        {children}
      </Component>
    );
  },
);

Typography.displayName = 'Typography';
