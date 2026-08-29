import { ROUTES } from '@/config/routes';

export interface AiNavigationFilters {
  district?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  crimeType?: string | string[] | null;
  categoryId?: string | string[] | null;
  criminalId?: string | null;
  rootType?: string | null;
  rootId?: string | null;
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

  const isResetValue = (value: unknown) => value == null || (typeof value === 'string' && ['all', 'all districts', 'all district', 'all crime types', 'all categories', 'all category', ''].includes(value.trim().toLowerCase()));
  const toSingleString = (value: unknown): string | null => {
    if (value == null) return null;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed || null;
    }
    if (Array.isArray(value) && value.length > 0) {
      const first = value.find((item) => typeof item === 'string' && item.trim());
      return typeof first === 'string' ? first.trim() : null;
    }
    return String(value);
  };

  const hasDistrict = Object.prototype.hasOwnProperty.call(filters, 'district');
  if (hasDistrict) {
    const district = toSingleString(filters.district);
    mapped.district = isResetValue(district) ? null : district;
  }

  const hasCrimeType = Object.prototype.hasOwnProperty.call(filters, 'crimeType');
  if (hasCrimeType) {
    const crimeTypeValues = Array.isArray(filters.crimeType)
      ? filters.crimeType.filter((value): value is string => typeof value === 'string' && !!value.trim() && !isResetValue(value))
      : typeof filters.crimeType === 'string' && !isResetValue(filters.crimeType)
        ? [filters.crimeType.trim()]
        : [];

    mapped.crimeTypes = crimeTypeValues.map(String);
  }

  const hasCategory = Object.prototype.hasOwnProperty.call(filters, 'categoryId');
  if (hasCategory) {
    const categoryValue = toSingleString(filters.categoryId);
    mapped.crimeCategory = isResetValue(categoryValue) ? null : categoryValue;
  }

  const hasStartDate = Object.prototype.hasOwnProperty.call(filters, 'startDate');
  const hasEndDate = Object.prototype.hasOwnProperty.call(filters, 'endDate');
  const startDate = toSingleString(filters.startDate);
  const endDate = toSingleString(filters.endDate);
  if (hasStartDate || hasEndDate) {
    mapped.dateRange = {
      start: hasStartDate ? (isResetValue(filters.startDate) ? null : startDate) : null,
      end: hasEndDate ? (isResetValue(filters.endDate) ? null : endDate) : null,
    };
  }

  const hasCriminalId = Object.prototype.hasOwnProperty.call(filters, 'criminalId');
  if (hasCriminalId) {
    const criminalId = toSingleString(filters.criminalId);
    mapped.criminalId = isResetValue(criminalId) ? null : criminalId;
  }

  const hasRootType = Object.prototype.hasOwnProperty.call(filters, 'rootType');
  if (hasRootType) {
    const rootType = toSingleString(filters.rootType);
    mapped.rootType = isResetValue(rootType) ? null : rootType;
  }

  const hasRootId = Object.prototype.hasOwnProperty.call(filters, 'rootId');
  if (hasRootId) {
    const rootId = toSingleString(filters.rootId);
    mapped.rootId = isResetValue(rootId) ? null : rootId;
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
