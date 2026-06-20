/**
 * useIntelligence — Central hook for the External Intelligence Layer.
 *
 * Fetches news from the Flask backend, classifies every article,
 * and exposes pre-computed derivatives: alerts, district summaries,
 * and filtered views. All downstream components consume this hook.
 */

import { useMemo } from 'react';
import { useGetNewsQuery } from '@/services/newsApi';
import {
  classifyArticle,
  generateIntelligenceAlerts,
  generateDistrictSummaries,
} from '../utils/intelligenceUtils';
import type { ClassifiedArticle, IntelligenceAlert, DistrictIntelSummary } from '../types';

interface UseIntelligenceOptions {
  /** Filter results to a specific district (canonical name) */
  district?: string;
  /** Max number of articles to return */
  limit?: number;
  /** Polling interval in ms (default: 5 minutes) */
  pollingInterval?: number;
}

interface UseIntelligenceResult {
  /** All classified articles (optionally filtered) */
  classifiedArticles: ClassifiedArticle[];
  /** Intelligence alerts for the Alerts page */
  intelligenceAlerts: IntelligenceAlert[];
  /** Per-district intelligence summaries */
  districtSummaries: DistrictIntelSummary[];
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: unknown;
  /** Whether the backend is reachable */
  isAvailable: boolean;
  /** Total article count before filtering */
  totalArticles: number;
}

export function useIntelligence(
  options: UseIntelligenceOptions = {},
): UseIntelligenceResult {
  const {
    district,
    limit,
    pollingInterval = 300_000, // 5 minutes
  } = options;

  const { data: rawArticles = [], isLoading, error } = useGetNewsQuery(
    undefined,
    { pollingInterval },
  );

  // Classify all articles
  const allClassified = useMemo(
    () => rawArticles.map(classifyArticle),
    [rawArticles],
  );

  // Apply optional district filter
  const classifiedArticles = useMemo(() => {
    let result = allClassified;

    if (district && district !== 'all') {
      result = result.filter((a) =>
        a.districts.some(
          (d) => d.toLowerCase() === district.toLowerCase(),
        ),
      );
    }

    if (limit) {
      result = result.slice(0, limit);
    }

    return result;
  }, [allClassified, district, limit]);

  // Generate alerts (always from full dataset, respect district filter)
  const intelligenceAlerts = useMemo(
    () => generateIntelligenceAlerts(
      district && district !== 'all'
        ? allClassified.filter((a) =>
            a.districts.some(
              (d) => d.toLowerCase() === district.toLowerCase(),
            ),
          )
        : allClassified,
    ),
    [allClassified, district],
  );

  // Generate district summaries (always from full dataset)
  const districtSummaries = useMemo(
    () => generateDistrictSummaries(allClassified),
    [allClassified],
  );

  return {
    classifiedArticles,
    intelligenceAlerts,
    districtSummaries,
    isLoading,
    error,
    isAvailable: !error && rawArticles.length > 0,
    totalArticles: rawArticles.length,
  };
}
