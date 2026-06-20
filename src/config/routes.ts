/* =============================================================================
   CrimeLens — Route Configuration
   =============================================================================
   Metadata-driven route definitions.
   ============================================================================= */

export type LayoutType = 'operations' | 'admin' | 'public' | 'none';

export interface RouteConfig {
  /** Unique route path */
  path: string;
  /** Page title shown in layout */
  title: string;
  /** Whether to show the global filter bar */
  showFilterBar: boolean;
  /** Required permission to access this route (optional) */
  requiredPermission?: string;
}

// ---------------------------------------------------------------------------
// Route Definitions
// ---------------------------------------------------------------------------

export const ROUTES: RouteConfig[] = [
  // === Operations ===
  {
    path: '/dashboard',
    title: 'Dashboard',
    showFilterBar: true,
    requiredPermission: 'dashboard.view',
  },
  {
    path: '/analytics',
    title: 'Analytics',
    showFilterBar: true,
    requiredPermission: 'analytics.view',
  },
  {
    path: '/heatmap',
    title: 'Heatmap',
    showFilterBar: true,
    requiredPermission: 'heatmap.view',
  },
  {
    path: '/network',
    title: 'Network Analysis',
    showFilterBar: true,
    requiredPermission: 'network.view',
  },
  {
    path: '/risk',
    title: 'Risk Assessment',
    showFilterBar: true,
  },
  {
    path: '/alerts',
    title: 'Alerts',
    showFilterBar: true,
  },
  {
    path: '/efir',
    title: 'E-FIR',
    showFilterBar: false,
    requiredPermission: 'efir.view',
  },

  // === Data Operations (Internal routes) ===
  {
    path: '/data/crime-records',
    title: 'Crime Records',
    showFilterBar: false,
    requiredPermission: 'crime_records.view',
  },
  {
    path: '/data/upload',
    title: 'Upload Dataset',
    showFilterBar: false,
    requiredPermission: 'crime_records.create',
  },

  // === Administration ===
  {
    path: '/administration/profile',
    title: 'Profile',
    showFilterBar: false,
  },
  {
    path: '/administration/users',
    title: 'User Management',
    showFilterBar: false,
    requiredPermission: 'users.view',
  },
  {
    path: '/administration/roles',
    title: 'Roles & Permissions',
    showFilterBar: false,
    requiredPermission: 'roles.view',
  },
  {
    path: '/administration/districts',
    title: 'District Management',
    showFilterBar: false,
    requiredPermission: 'districts.view',
  },
  {
    path: '/administration/station-types',
    title: 'Station Type Management',
    showFilterBar: false,
    requiredPermission: 'station-types.view',
  },
  {
    path: '/administration/police-stations',
    title: 'Police Station Management',
    showFilterBar: false,
    requiredPermission: 'police-stations.view',
  },
  {
    path: '/administration/police-ranks',
    title: 'Police Rank Management',
    showFilterBar: false,
    requiredPermission: 'police-ranks.view',
  },
  {
    path: '/administration/police-officers',
    title: 'Police Officer Management',
    showFilterBar: false,
    requiredPermission: 'police-officers.view',
  },
  {
    path: '/administration/criminals',
    title: 'Criminal Registry',
    showFilterBar: false,
    requiredPermission: 'criminals.view',
  },
  {
    path: '/administration/crimes',
    title: 'Crime Incidents',
    showFilterBar: false,
    requiredPermission: 'crimes.view',
  },
  {
    path: '/administration/firs',
    title: 'FIR Registry',
    showFilterBar: false,
    requiredPermission: 'firs.view',
  },
  {
    path: '/administration/settings',
    title: 'Settings',
    showFilterBar: false,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Get route config by pathname. Handles exact match.
 */
export function getRouteConfig(pathname: string): RouteConfig | undefined {
  return ROUTES.find((r) => r.path === pathname);
}

/**
 * Check whether the global filter bar should be visible.
 */
export function shouldShowFilterBar(pathname: string): boolean {
  const route = getRouteConfig(pathname);
  return route?.showFilterBar ?? false;
}

/**
 * Primary nav items for the top navigation bar.
 */
export const PRIMARY_NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Analytics', path: '/analytics' },
  { label: 'Heatmap', path: '/heatmap' },
  { label: 'Network', path: '/network' },
  { label: 'Risk', path: '/risk' },
  { label: 'Alerts', path: '/alerts' },
  { label: 'E-FIR', path: '/efir' },
];
