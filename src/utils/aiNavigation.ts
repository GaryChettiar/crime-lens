import { ROUTES } from '@/config/routes';

export interface AiNavigationFilters {
  district?: string;
  startDate?: string;
  endDate?: string;
  crimeType?: string | string[];
  categoryId?: string | string[];
  criminalId?: string;
  rootType?: string;
  rootId?: string;
  [key: string]: unknown;
}

export interface AiNavigationDefinition {
  route?: string;
  filters?: AiNavigationFilters;
}

function normalizeRoute(route: string): string {
  return route.trim();
}

export function isKnownAiRoute(route: string): boolean {
  const normalized = normalizeRoute(route);
  if (!normalized || !normalized.startsWith('/')) return false;

  return ROUTES.some((routeConfig) => routeConfig.path === normalized)
    || ROUTES.some((routeConfig) => {
      const pattern = routeConfig.path.replace(/:[^/]+/g, '[^/]+');
      return new RegExp(`^${pattern}$`).test(normalized);
    });
}

export function resolveAiRoutePath(route: string, filters: AiNavigationFilters = {}): string | null {
  const normalized = normalizeRoute(route);
  if (!normalized) return null;

  let resolved = normalized;
  if (resolved.includes(':criminalId') && filters.criminalId) {
    resolved = resolved.replace(':criminalId', String(filters.criminalId));
  }
  if (resolved.includes(':id') && filters.criminalId) {
    resolved = resolved.replace(':id', String(filters.criminalId));
  }

  if (resolved.includes(':') && !isKnownAiRoute(resolved)) {
    return null;
  }

  return isKnownAiRoute(resolved) ? resolved : null;
}

export function mapAiNavigationFiltersToUi(filters: AiNavigationFilters = {}) {
  const mapped: {
    district?: string | null;
    crimeTypes?: string[];
    crimeCategory?: string | null;
    dateRange?: { start: string | null; end: string | null };
    criminalId?: string | null;
    rootType?: string | null;
    rootId?: string | null;
  } = {};

  if (typeof filters.district === 'string' && filters.district.trim()) {
    mapped.district = filters.district.trim();
  }

  const crimeTypeValues = Array.isArray(filters.crimeType)
    ? filters.crimeType
    : typeof filters.crimeType === 'string' && filters.crimeType.trim()
      ? [filters.crimeType]
      : [];

  if (crimeTypeValues.length > 0) {
    mapped.crimeTypes = crimeTypeValues.map(String);
  }

  const categoryValues = Array.isArray(filters.categoryId)
    ? filters.categoryId
    : typeof filters.categoryId === 'string' && filters.categoryId.trim()
      ? [filters.categoryId]
      : [];

  if (categoryValues.length > 0) {
    mapped.crimeCategory = categoryValues[0] ?? null;
  }

  const startDate = typeof filters.startDate === 'string' ? filters.startDate : null;
  const endDate = typeof filters.endDate === 'string' ? filters.endDate : null;
  if (startDate || endDate) {
    mapped.dateRange = {
      start: startDate,
      end: endDate,
    };
  }

  if (typeof filters.criminalId === 'string' && filters.criminalId.trim()) {
    mapped.criminalId = filters.criminalId.trim();
  }

  if (typeof filters.rootType === 'string' && filters.rootType.trim()) {
    mapped.rootType = filters.rootType.trim();
  }

  if (typeof filters.rootId === 'string' && filters.rootId.trim()) {
    mapped.rootId = filters.rootId.trim();
  }

  return mapped;
}

export function applyAiNavigation(
  navigation: AiNavigationDefinition | null | undefined,
  navigate: (path: string) => void,
  applyFilters?: (filters: ReturnType<typeof mapAiNavigationFiltersToUi>) => void,
): string | null {
  if (!navigation || !navigation.route) return null;

  const route = resolveAiRoutePath(navigation.route, navigation.filters ?? {});
  if (!route || !isKnownAiRoute(route)) return null;

  const mappedFilters = mapAiNavigationFiltersToUi(navigation.filters ?? {});
  applyFilters?.(mappedFilters);
  navigate(route);
  return route;
}
