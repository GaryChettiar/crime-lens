/* =============================================================================
   CrimeLens Design System — TypeScript Design Tokens
   =============================================================================
   Programmatic access to design tokens for use in JS/TS code (e.g., Recharts
   config, React-Leaflet styling, dynamic style calculations).
   ============================================================================= */

// ---------------------------------------------------------------------------
// Spacing
// ---------------------------------------------------------------------------

export const SPACING = {
  0: '0px',
  0.5: '2px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  6: '24px',
  8: '32px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
} as const;

export type SpacingKey = keyof typeof SPACING;

// ---------------------------------------------------------------------------
// Radius
// ---------------------------------------------------------------------------

export const RADIUS = {
  xs: '2px',
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  '2xl': '16px',
} as const;

export type RadiusKey = keyof typeof RADIUS;

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

export const TYPOGRAPHY = {
  'display-xl': {
    fontSize: '3rem',
    lineHeight: '1.1',
    fontWeight: '700',
    letterSpacing: '-0.025em',
  },
  'display-lg': {
    fontSize: '2.25rem',
    lineHeight: '1.15',
    fontWeight: '700',
    letterSpacing: '-0.025em',
  },
  'display-md': {
    fontSize: '1.875rem',
    lineHeight: '1.2',
    fontWeight: '600',
    letterSpacing: '-0.02em',
  },
  'heading-xl': {
    fontSize: '1.5rem',
    lineHeight: '1.25',
    fontWeight: '600',
    letterSpacing: '-0.015em',
  },
  'heading-lg': {
    fontSize: '1.25rem',
    lineHeight: '1.3',
    fontWeight: '600',
    letterSpacing: '-0.01em',
  },
  'heading-md': {
    fontSize: '1.125rem',
    lineHeight: '1.35',
    fontWeight: '600',
    letterSpacing: '-0.01em',
  },
  'heading-sm': {
    fontSize: '1rem',
    lineHeight: '1.4',
    fontWeight: '600',
    letterSpacing: '-0.005em',
  },
  'body-lg': {
    fontSize: '1rem',
    lineHeight: '1.6',
    fontWeight: '400',
    letterSpacing: '0em',
  },
  'body-md': {
    fontSize: '0.875rem',
    lineHeight: '1.6',
    fontWeight: '400',
    letterSpacing: '0em',
  },
  'body-sm': {
    fontSize: '0.75rem',
    lineHeight: '1.5',
    fontWeight: '400',
    letterSpacing: '0.01em',
  },
  caption: {
    fontSize: '0.6875rem',
    lineHeight: '1.45',
    fontWeight: '500',
    letterSpacing: '0.02em',
  },
} as const;

export type TypographyVariant = keyof typeof TYPOGRAPHY;

// ---------------------------------------------------------------------------
// Breakpoints
// ---------------------------------------------------------------------------

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type BreakpointKey = keyof typeof BREAKPOINTS;

// ---------------------------------------------------------------------------
// Z-Index Layering
// ---------------------------------------------------------------------------

export const Z_INDEX = {
  hide: -1,
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  overlay: 40,
  modal: 50,
  popover: 60,
  toast: 70,
  tooltip: 80,
  commandPalette: 90,
} as const;

export type ZIndexKey = keyof typeof Z_INDEX;

// ---------------------------------------------------------------------------
// Animation
// ---------------------------------------------------------------------------

export const ANIMATION = {
  duration: {
    micro: 75,
    fast: 150,
    standard: 250,
    emphasis: 350,
  },
  easing: {
    default: 'cubic-bezier(0.16, 1, 0.3, 1)',
    inOut: 'cubic-bezier(0.45, 0, 0.55, 1)',
    in: 'cubic-bezier(0.55, 0, 1, 0.45)',
    out: 'cubic-bezier(0, 0.55, 0.45, 1)',
  },
} as const;

// ---------------------------------------------------------------------------
// Chart Colors (for Recharts / D3 usage)
// ---------------------------------------------------------------------------

/**
 * Returns the CSS variable value for chart colors.
 * Usage with Recharts: `fill={getChartColor(1)}`
 * These resolve at runtime from the current theme.
 */
export function getChartColor(index: number): string {
  return `hsl(var(--chart-${index}))`;
}

/**
 * Returns all 8 chart colors as an array.
 * Usage: `<Pie data={data} colors={CHART_COLORS} />`
 */
export const CHART_COLORS = Array.from({ length: 8 }, (_, i) =>
  getChartColor(i + 1),
);

/**
 * Risk level color mapping.
 * Usage: `style={{ color: RISK_COLORS[riskLevel] }}`
 */
export const RISK_COLORS = {
  low: 'hsl(var(--risk-low))',
  medium: 'hsl(var(--risk-medium))',
  high: 'hsl(var(--risk-high))',
  critical: 'hsl(var(--risk-critical))',
} as const;

export type RiskLevel = keyof typeof RISK_COLORS;

/**
 * Heatmap sequential palette.
 */
export const HEATMAP_COLORS = Array.from({ length: 5 }, (_, i) =>
  `hsl(var(--heatmap-${i + 1}))`,
);
