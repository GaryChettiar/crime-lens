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

  // === Crimes ===
  {
    path: '/crimes',
    title: 'Crimes',
    showFilterBar: true,
    requiredPermission: 'crimes.view',
  },
  {
    path: '/crimes/:id',
    title: 'Crime Details',
    showFilterBar: false,
    requiredPermission: 'crimes.view',
  },

  // === Forecast ===
  {
    path: '/forecast',
    title: 'Forecast',
    showFilterBar: false,
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
  {
    path: '/entities/officers',
    title: 'Police Officers',
    showFilterBar: false,
    requiredPermission: 'police-officers.view',
  },
  {
    path: '/entities/criminals',
    title: 'Criminals',
    showFilterBar: false,
    requiredPermission: 'criminals.view',
  },
  {
    path: '/entities/criminals/:criminalId',
    title: 'Criminal Profile',
    showFilterBar: false,
    requiredPermission: 'criminals.view',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Get route config by pathname. Handles exact match and dynamic segments.
 */
export function getRouteConfig(pathname: string): RouteConfig | undefined {
  // Handle dynamic paths
  if (pathname.startsWith('/entities/criminals/')) {
    return ROUTES.find((r) => r.path === '/entities/criminals/:criminalId');
  }
  if (/^\/crimes\/[^/]+/.test(pathname)) {
    return ROUTES.find((r) => r.path === '/crimes/:id');
  }
  return ROUTES.find((r) => r.path === pathname);
}

/**
 * Check whether the global filter bar should be visible.
 */
export function shouldShowFilterBar(pathname: string): boolean {
  const route = getRouteConfig(pathname);
  return route?.showFilterBar ?? false;
}

export interface NavGroup {
  label: string;
  path: string;
  activePaths: string[];
  items?: { label: string; path: string; icon?: string }[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    path: '/dashboard',
    activePaths: ['/dashboard', '/analytics'],
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
      { label: 'Analytics', path: '/analytics', icon: 'analytics' },
    ],
  },
  {
    label: 'Crimes',
    path: '/crimes',
    activePaths: ['/crimes'],
  },
  {
    label: 'Entities',
    path: '/entities/officers',
    activePaths: ['/entities/officers', '/entities/criminals'],
    items: [
      { label: 'Officers', path: '/entities/officers', icon: 'officers' },
      { label: 'Criminals', path: '/entities/criminals', icon: 'criminals' },
    ],
  },
  {
    label: 'Network',
    path: '/network',
    activePaths: ['/network'],
  },
  {
    label: 'Forecast',
    path: '/forecast',
    activePaths: ['/forecast', '/risk', '/alerts'],
    items: [
      { label: 'Crime Forecast', path: '/forecast', icon: 'forecast' },
      { label: 'Risk Assessment', path: '/risk', icon: 'risk' },
      { label: 'Alerts', path: '/alerts', icon: 'alerts' },
    ],
  },
  {
    label: 'FIR',
    path: '/efir',
    activePaths: ['/efir'],
  },
];
