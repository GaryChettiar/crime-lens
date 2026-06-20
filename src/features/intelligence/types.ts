/**
 * External Intelligence Layer — Type Definitions
 *
 * Interfaces for raw news articles from the Flask backend,
 * classified intelligence items, alerts, and district summaries.
 */

// ---------------------------------------------------------------------------
// Raw API response from Flask /api/news
// ---------------------------------------------------------------------------

export interface NewsArticle {
  id: number;
  title: string;
  link: string;
  summary: string;
  source: string;
  published: string;
  scraped_at: string;
}

// ---------------------------------------------------------------------------
// Client-side enriched article
// ---------------------------------------------------------------------------

export type IntelSeverity = 'critical' | 'warning' | 'info';

export interface ClassifiedArticle extends NewsArticle {
  /** Computed threat severity based on keyword heuristics */
  severity: IntelSeverity;
  /** Karnataka district names mentioned in headline/summary */
  districts: string[];
  /** Matched threat keywords found in the article */
  threatKeywords: string[];
}

// ---------------------------------------------------------------------------
// Intelligence alert (for the Alerts page integration)
// ---------------------------------------------------------------------------

export type IntelClassification =
  | 'Critical Intelligence'
  | 'Warning Intelligence'
  | 'Informational Intelligence';

export interface IntelligenceAlert {
  id: string;
  type: 'external-intelligence';
  title: string;
  message: string;
  severity: 'critical' | 'high' | 'medium';
  timestamp: string;
  source: string;
  classification: IntelClassification;
  read: boolean;
  link: string;
}

// ---------------------------------------------------------------------------
// District intelligence summary (for heatmap + risk integration)
// ---------------------------------------------------------------------------

export interface DistrictIntelSummary {
  district: string;
  articleCount: number;
  highestThreat: string;
  riskContribution: number;
  articles: ClassifiedArticle[];
}

// ---------------------------------------------------------------------------
// Scrape response
// ---------------------------------------------------------------------------

export interface ScrapeResponse {
  fetched: number;
  new_inserted: number;
}
