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
    requiredPermission: 'view_dashboard',
  },
  {
    path: '/analytics',
    title: 'Analytics',
    showFilterBar: true,
    requiredPermission: 'view_analytics',
  },
  {
    path: '/heatmap',
    title: 'Heatmap',
    showFilterBar: true,
    requiredPermission: 'view_heatmap',
  },
  {
    path: '/network',
    title: 'Network Analysis',
    showFilterBar: true,
    requiredPermission: 'view_network_analysis',
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
    requiredPermission: 'view_fir',
  },

  // === Crimes ===
  {
    path: '/entities/crimes',
    title: 'Crimes',
    showFilterBar: true,
    requiredPermission: 'view_crimes',
  },
  {
    path: '/entities/crimes/:id',
    title: 'Crime Details',
    showFilterBar: false,
    requiredPermission: 'view_crimes',
  },

  // === Forecast ===
  {
    path: '/forecast',
    title: 'Forecast',
    showFilterBar: false,
    requiredPermission: 'view_forecast',
  },

  // === Data Operations (Internal routes) ===
  {
    path: '/data/crime-records',
    title: 'Crime Records',
    showFilterBar: false,
    requiredPermission: 'view_crimes',
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
    requiredPermission: 'view_users',
  },
  {
    path: '/administration/roles',
    title: 'Roles & Permissions',
    showFilterBar: false,
    requiredPermission: 'view_roles',
  },
  {
    path: '/administration/districts',
    title: 'District Management',
    showFilterBar: false,
    requiredPermission: 'view_districts',
  },
  {
    path: '/administration/station-types',
    title: 'Station Type Management',
    showFilterBar: false,
    requiredPermission: 'view_station_types',
  },
  {
    path: '/administration/police-stations',
    title: 'Police Station Management',
    showFilterBar: false,
    requiredPermission: 'view_police_stations',
  },
  {
    path: '/administration/police-ranks',
    title: 'Police Rank Management',
    showFilterBar: false,
    requiredPermission: 'view_police_ranks',
  },
  {
    path: '/administration/police-officers',
    title: 'Police Officer Management',
    showFilterBar: false,
    requiredPermission: 'view_police_officers',
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
    requiredPermission: 'view_crimes',
  },
  {
    path: '/administration/firs',
    title: 'FIR Registry',
    showFilterBar: false,
    requiredPermission: 'view_fir',
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
    requiredPermission: 'view_officers',
  },
  {
    path: '/entities/criminals',
    title: 'Criminals',
    showFilterBar: false,
    requiredPermission: 'view_criminals',
  },
  {
    path: '/entities/criminals/:criminalId',
    title: 'Criminal Profile',
    showFilterBar: false,
    requiredPermission: 'view_criminals',
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
  if (/^\/entities\/crimes\/[^/]+/.test(pathname)) {
    return ROUTES.find((r) => r.path === '/entities/crimes/:id');
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
  requiredPermission?: string;
  items?: { label: string; path: string; icon?: string; requiredPermission?: string }[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    path: '/dashboard',
    activePaths: ['/dashboard', '/analytics'],
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: 'dashboard', requiredPermission: 'view_dashboard' },
      { label: 'Analytics', path: '/analytics', icon: 'analytics', requiredPermission: 'view_analytics' },
    ],
  },
  {
    label: 'Entities',
    path: '/entities/crimes',
    activePaths: ['/entities/crimes', '/entities/officers', '/entities/criminals'],
    requiredPermission: 'view_entities',
    items: [
      { label: 'Crimes', path: '/entities/crimes', icon: 'crimes', requiredPermission: 'view_crimes' },
      { label: 'Officers', path: '/entities/officers', icon: 'officers', requiredPermission: 'view_officers' },
      { label: 'Criminals', path: '/entities/criminals', icon: 'criminals', requiredPermission: 'view_criminals' },
    ],
  },
  {
    label: 'Network',
    path: '/network',
    activePaths: ['/network'],
    requiredPermission: 'view_network_analysis',
  },
  {
    label: 'Forecast',
    path: '/forecast',
    activePaths: ['/forecast', '/risk', '/alerts'],
    requiredPermission: 'view_forecast',
    items: [
      { label: 'Crime Forecast', path: '/forecast', icon: 'forecast', requiredPermission: 'view_forecast' },
      { label: 'Risk Assessment', path: '/risk', icon: 'risk', requiredPermission: 'view_analytics' },
      { label: 'Alerts', path: '/alerts', icon: 'alerts', requiredPermission: 'view_alerts' },
    ],
  },
  {
    label: 'FIR',
    path: '/efir',
    activePaths: ['/efir'],
    requiredPermission: 'view_fir',
  },
  {
    label: 'Administration',
    path: '/administration/profile',
    activePaths: ['/administration/profile', '/administration/users', '/administration/roles'],
    // Show administration group when user can view at least users or roles
    requiredPermission: 'users.view',
    items: [
      { label: 'Users', path: '/administration/users', icon: 'users', requiredPermission: 'view_users' },
      { label: 'Roles', path: '/administration/roles', icon: 'roles', requiredPermission: 'view_roles' },
      { label: 'Settings', path: '/administration/settings', icon: 'settings' },
    ],
  },
];
