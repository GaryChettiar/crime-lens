import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type { ComponentBaseProps } from '@/types/component-states';

/**
 * Badge Atom
 *
 * Status indicator badges for risk levels, severities, and categorical labels.
 * Designed for high-density data tables and dashboard cards.
 *
 * @example
 * <Badge variant="success">Resolved</Badge>
 * <Badge variant="risk-critical">Critical Risk</Badge>
 * <Badge variant="outline" size="sm">Filter: Active</Badge>
 */

const badgeVariants = cva(
  'inline-flex items-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground',
        outline: 'border border-border text-foreground',
        success:
          'border-transparent bg-success text-success-foreground',
        warning:
          'border-transparent bg-warning text-warning-foreground',
        danger:
          'border-transparent bg-danger text-danger-foreground',
        info: 'border-transparent bg-info text-info-foreground',
        muted:
          'border-transparent bg-muted text-muted-foreground',
        // Risk level variants
        'risk-low':
          'border-transparent bg-risk-low text-risk-low-foreground',
        'risk-medium':
          'border-transparent bg-risk-medium text-risk-medium-foreground',
        'risk-high':
          'border-transparent bg-risk-high text-risk-high-foreground',
        'risk-critical':
          'border-transparent bg-risk-critical text-risk-critical-foreground',
      },
      size: {
        sm: 'text-[10px] px-1.5 py-0.5 rounded-sm',
        md: 'text-xs px-2.5 py-0.5 rounded-md',
        lg: 'text-sm px-3 py-1 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
);

export interface BadgeProps
  extends ComponentBaseProps,
    VariantProps<typeof badgeVariants> {
  children: React.ReactNode;
  /** Optional dot indicator before text */
  dot?: boolean;
}

export function Badge({
  variant,
  size,
  dot = false,
  className,
  children,
  id,
  testId,
}: BadgeProps) {
  return (
    <span
      id={id}
      data-testid={testId}
      className={cn(badgeVariants({ variant, size }), className)}
    >
      {dot && (
        <span
          className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current"
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
