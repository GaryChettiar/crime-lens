import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Icon Atom
 *
 * Consistent icon wrapper using Lucide React icons.
 * Ensures uniform sizing, accessibility, and color inheritance.
 *
 * @example
 * <Icon icon={Shield} size="md" />
 * <Icon icon={AlertTriangle} size="sm" className="text-danger" />
 * <Icon icon={Search} label="Search" /> // accessible labeled icon
 */

const SIZE_MAP = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
} as const;

type IconSize = keyof typeof SIZE_MAP;

interface IconProps extends ComponentPropsWithoutRef<'svg'> {
  /** Lucide icon component */
  icon: LucideIcon;
  /** Size variant */
  size?: IconSize;
  /** Accessible label — if provided, icon is announced to screen readers */
  label?: string;
  /** Additional CSS classes */
  className?: string;
}

export const Icon = forwardRef<SVGSVGElement, IconProps>(
  ({ icon: LucideIcon, size = 'md', label, className, ...props }, ref) => {
    return (
      <LucideIcon
        ref={ref}
        className={cn(SIZE_MAP[size], 'shrink-0', className)}
        aria-hidden={!label}
        aria-label={label}
        role={label ? 'img' : undefined}
        {...props}
      />
    );
  },
);

Icon.displayName = 'Icon';
