export type AiChatNormalizedType = 'casual' | 'business' | 'error';

export interface NormalizedDateRange {
  from?: string;
  to?: string;
}

export interface NormalizedCrimeRecord {
  id: string;
  crimeNumber: string;
  title: string;
  status: string;
  occurredAt: string;
}

export interface NormalizedAiChatNavigation {
  route?: string;
  filters?: Record<string, unknown>;
}

export interface NormalizedAiChatResponse {
  type: AiChatNormalizedType;
  summary?: string;
  reply?: string;
  district?: string;
  districtId?: string;
  dateRange?: NormalizedDateRange;
  crimeCount?: number;
  crimes: NormalizedCrimeRecord[];
  pagination?: Record<string, unknown> | null;
  navigation?: NormalizedAiChatNavigation;
  raw?: Record<string, unknown>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getSafeString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function getSafeNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function normalizeDateRange(value: unknown): NormalizedDateRange | undefined {
  if (!isRecord(value)) return undefined;
  const from = getSafeString(value.from);
  const to = getSafeString(value.to);
  if (!from && !to) return undefined;
  return { from, to };
}

function normalizeCrimes(value: unknown): NormalizedCrimeRecord[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!isRecord(item)) return null;

      const rawId = getSafeString(item.ROWID) ?? getSafeString(item.id) ?? '';
      const crimeNumber = getSafeString(item.crime_number) ?? getSafeString(item.crimeNumber) ?? '—';
      const title = getSafeString(item.title) ?? 'Unspecified crime';
      const status = getSafeString(item.status) ?? 'Unknown';
      const occurredAt = getSafeString(item.crime_occured_date_time) ?? getSafeString(item.occurredAt) ?? '—';

      if (!rawId && !crimeNumber && !title) return null;

      return {
        id: rawId || `${crimeNumber}-${title}-${occurredAt}`,
        crimeNumber,
        title,
        status,
        occurredAt,
      };
    })
    .filter((item): item is NormalizedCrimeRecord => Boolean(item));
}

function toApiPayload(apiResponse: unknown): Record<string, unknown> | null {
  if (!isRecord(apiResponse)) return null;

  const candidate =
    isRecord(apiResponse.data) && 'data' in apiResponse.data
      ? apiResponse.data.data
      : apiResponse.data ?? apiResponse;

  return isRecord(candidate) ? candidate : null;
}

export function normalizeAiChatResponse(apiResponse: unknown): NormalizedAiChatResponse {
  const payload = toApiPayload(apiResponse);
  if (!payload) {
    throw new Error('CrimeLens AI returned an unexpected response.');
  }

  const success = payload.success === true || payload.success === undefined;
  if (!success) {
    const backendMessage = getSafeString(payload.message) ?? 'Something went wrong while processing your request.';
    throw new Error(backendMessage);
  }

  const data = isRecord(payload.data) ? payload.data : payload;
  const resultBlock = isRecord(data.result) ? data.result : {};
  const responseBlock = isRecord(data.response) ? data.response : {};
  const toolResult = isRecord(data.toolResult) ? data.toolResult : {};
  const classification = isRecord(data.classification) ? data.classification : {};
  const navigationPayload = isRecord(resultBlock.navigation)
    ? resultBlock.navigation
    : (isRecord(toolResult.navigation) ? toolResult.navigation : (isRecord(responseBlock.navigation) ? responseBlock.navigation : undefined));
  const type = getSafeString(data.type) ?? getSafeString(responseBlock.type) ?? 'business';

  if (type === 'casual') {
    return {
      type: 'casual',
      reply: getSafeString(responseBlock.reply) ?? getSafeString(data.message) ?? 'Hey! I am CrimeLens AI. How can I help?',
      crimes: [],
      raw: payload,
    };
  }

  if (type === 'error' || !type) {
    throw new Error('CrimeLens AI returned an unexpected response.');
  }

  const businessSummary = getSafeString(data.summary)
    ?? getSafeString(resultBlock.summary)
    ?? getSafeString(responseBlock.summary)
    ?? 'Here are the latest CrimeLens results.';
  const district = getSafeString(responseBlock.district) ?? getSafeString(toolResult.district) ?? getSafeString(classification.districtName) ?? 'Selected district';
  const districtId = getSafeString(toolResult.districtId) ?? getSafeString(classification.districtId);
  const dateRange = normalizeDateRange(responseBlock.dateRange) ?? normalizeDateRange(toolResult.dateRange) ?? undefined;

  const rawCrimes = Array.isArray(responseBlock.crimes)
    ? responseBlock.crimes
    : Array.isArray(toolResult.crimes)
      ? toolResult.crimes
      : [];

  const crimeCount = getSafeNumber(responseBlock.crimeCount) ?? getSafeNumber(toolResult.totalRecords) ?? rawCrimes.length;
  const crimes = normalizeCrimes(rawCrimes);

  const pagination = isRecord(toolResult.pagination) ? toolResult.pagination : null;

  return {
    type: 'business',
    summary: businessSummary,
    district,
    districtId,
    dateRange,
    crimeCount,
    crimes,
    pagination,
    navigation: navigationPayload && typeof navigationPayload.route === 'string'
      ? {
          route: navigationPayload.route,
          filters: isRecord(navigationPayload.filters) ? navigationPayload.filters : {},
        }
      : undefined,
    raw: payload,
  };
}

export function getAiChatErrorMessage(error: unknown): string {
  const maybeRecord = isRecord(error) ? error : null;
  const status = typeof maybeRecord?.status === 'string' ? maybeRecord.status : undefined;
  const dataRecord = isRecord(maybeRecord?.data) ? maybeRecord.data : null;
  const message =
    getSafeString(maybeRecord?.message)
    ?? getSafeString(maybeRecord?.error)
    ?? getSafeString(dataRecord?.message)
    ?? getSafeString(dataRecord?.error);

  if (status === 'FETCH_ERROR' || status === 'PARSING_ERROR' || maybeRecord?.name === 'TypeError') {
    return "Couldn't reach CrimeLens AI. Please check your connection and try again.";
  }

  if (message) {
    if (/district not found/i.test(message)) {
      return "I couldn't find that district. Please check the district name and try again.";
    }
    if (/something went wrong|unexpected response|invalid ai response/i.test(message)) {
      return 'CrimeLens AI returned an unexpected response. Please try again.';
    }
    return message;
  }

  return 'Something went wrong while processing your request.';
}
