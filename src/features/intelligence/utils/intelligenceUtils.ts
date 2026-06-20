/**
 * External Intelligence Utilities
 *
 * Client-side heuristic functions for classifying news articles into
 * threat levels, extracting Karnataka district mentions, computing
 * intelligence risk scores, and matching syndicate keywords.
 */

import type {
  NewsArticle,
  IntelSeverity,
  ClassifiedArticle,
  IntelligenceAlert,
  IntelClassification,
  DistrictIntelSummary,
} from '../types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Keywords that trigger a CRITICAL intelligence classification */
export const CRITICAL_KEYWORDS = [
  'murder',
  'trafficking',
  'organized crime',
  'terrorism',
  'narcotics',
  'cyber fraud',
  'kidnapping',
  'arms seizure',
  'bomb',
  'explosion',
  'serial',
  'massacre',
  'gang war',
  'extortion racket',
] as const;

/** Keywords that trigger a WARNING classification */
export const WARNING_KEYWORDS = [
  'robbery',
  'assault',
  'smuggling',
  'drugs',
  'raid',
  'arrest',
  'weapon',
  'armed',
  'stabbing',
  'molestation',
  'rape',
  'abduction',
  'dacoity',
  'arson',
  'burglary',
  'extortion',
  'scam',
  'fraud',
] as const;

/**
 * Karnataka districts — canonical names and common aliases.
 * Keys are the canonical district name, values are an array of
 * search-ready lowercase aliases.
 */
export const KARNATAKA_DISTRICTS: Record<string, string[]> = {
  'Bengaluru Urban':   ['bengaluru urban', 'bengaluru', 'bangalore', 'blr'],
  'Bengaluru Rural':   ['bengaluru rural', 'bangalore rural'],
  'Mysuru':            ['mysuru', 'mysore'],
  'Belagavi':          ['belagavi', 'belgaum'],
  'Dakshina Kannada':  ['dakshina kannada', 'mangaluru', 'mangalore', 'dk'],
  'Hubballi-Dharwad':  ['hubballi-dharwad', 'hubballi', 'hubli', 'dharwad'],
  'Kalaburagi':        ['kalaburagi', 'gulbarga'],
  'Ballari':           ['ballari', 'bellary'],
  'Tumakuru':          ['tumakuru', 'tumkur'],
  'Shivamogga':        ['shivamogga', 'shimoga'],
  'Raichur':           ['raichur'],
  'Davangere':         ['davangere', 'davanagere'],
  'Hassan':            ['hassan'],
  'Mandya':            ['mandya'],
  'Uttara Kannada':    ['uttara kannada', 'karwar'],
  'Udupi':             ['udupi'],
  'Chikkamagaluru':    ['chikkamagaluru', 'chikmagalur'],
  'Vijayapura':        ['vijayapura', 'bijapur'],
  'Bagalkote':         ['bagalkote', 'bagalkot'],
  'Haveri':            ['haveri'],
  'Kodagu':            ['kodagu', 'coorg'],
  'Koppal':            ['koppal'],
  'Gadag':             ['gadag'],
  'Ramanagara':        ['ramanagara', 'ramnagar'],
  'Chitradurga':       ['chitradurga'],
  'Bidar':             ['bidar'],
  'Yadgir':            ['yadgir'],
  'Dharwad':           ['dharwad'],
  'Chamarajanagar':    ['chamarajanagar'],
  'Chikkaballapura':   ['chikkaballapura', 'chikballapur'],
};

/** Severity weights for intelligence score calculation */
const SEVERITY_WEIGHTS: Record<IntelSeverity, number> = {
  critical: 3,
  warning: 2,
  info: 1,
};

// ---------------------------------------------------------------------------
// Classification Functions
// ---------------------------------------------------------------------------

/**
 * Classify the severity of a news article based on keyword heuristics.
 * Scans headline + summary for critical/warning keywords.
 */
export function classifySeverity(article: NewsArticle): IntelSeverity {
  const text = `${article.title} ${article.summary}`.toLowerCase();

  for (const kw of CRITICAL_KEYWORDS) {
    if (text.includes(kw)) return 'critical';
  }

  for (const kw of WARNING_KEYWORDS) {
    if (text.includes(kw)) return 'warning';
  }

  return 'info';
}

/**
 * Extract Karnataka district names mentioned in the article.
 * Returns canonical district names.
 */
export function extractDistricts(article: NewsArticle): string[] {
  const text = `${article.title} ${article.summary}`.toLowerCase();
  const matched: string[] = [];

  for (const [canonical, aliases] of Object.entries(KARNATAKA_DISTRICTS)) {
    for (const alias of aliases) {
      if (text.includes(alias)) {
        matched.push(canonical);
        break; // Don't match the same district twice
      }
    }
  }

  return matched;
}

/**
 * Extract threat keywords found in the article text.
 */
export function extractThreatKeywords(article: NewsArticle): string[] {
  const text = `${article.title} ${article.summary}`.toLowerCase();
  const found: string[] = [];

  for (const kw of CRITICAL_KEYWORDS) {
    if (text.includes(kw)) found.push(kw);
  }
  for (const kw of WARNING_KEYWORDS) {
    if (text.includes(kw)) found.push(kw);
  }

  return found;
}

/**
 * Fully classify a raw news article into a ClassifiedArticle.
 */
export function classifyArticle(article: NewsArticle): ClassifiedArticle {
  return {
    ...article,
    severity: classifySeverity(article),
    districts: extractDistricts(article),
    threatKeywords: extractThreatKeywords(article),
  };
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

/**
 * Compute an intelligence risk score (0–100) for a specific district
 * based on the number and severity of articles mentioning it.
 */
export function computeIntelligenceScore(
  articles: ClassifiedArticle[],
  district: string,
): number {
  const districtArticles = articles.filter((a) =>
    a.districts.includes(district),
  );

  if (districtArticles.length === 0) return 0;

  const rawScore = districtArticles.reduce(
    (sum, a) => sum + SEVERITY_WEIGHTS[a.severity],
    0,
  );

  // Normalize: max expected ~15 weighted articles → score of 100
  return Math.min(100, Math.round((rawScore / 15) * 100));
}

/**
 * Compute risk contribution percentage for a district.
 * This represents how much external intelligence contributes to overall risk.
 */
export function computeRiskContribution(
  articles: ClassifiedArticle[],
  district: string,
): number {
  const score = computeIntelligenceScore(articles, district);
  // Scale to a 0–20% max contribution range
  return Math.round((score / 100) * 20);
}

// ---------------------------------------------------------------------------
// Alert Generation
// ---------------------------------------------------------------------------

/**
 * Convert classified articles into intelligence alerts for the Alerts page.
 */
export function generateIntelligenceAlerts(
  articles: ClassifiedArticle[],
): IntelligenceAlert[] {
  return articles
    .filter((a) => a.severity === 'critical' || a.severity === 'warning')
    .map((a) => {
      const classification: IntelClassification =
        a.severity === 'critical'
          ? 'Critical Intelligence'
          : 'Warning Intelligence';

      const alertSeverity: 'critical' | 'high' | 'medium' =
        a.severity === 'critical' ? 'critical' : 'high';

      const cleanSummary = a.summary
        ? a.summary.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
        : '';
      const rawMessage = cleanSummary || a.title;
      const message = rawMessage.length > 200 ? `${rawMessage.slice(0, 197)}...` : rawMessage;

      return {
        id: `intel-${a.id}`,
        type: 'external-intelligence' as const,
        title: a.title,
        message,
        severity: alertSeverity,
        timestamp: a.published || a.scraped_at,
        source: formatSourceName(a.source),
        classification,
        read: false,
        link: a.link,
      };
    });
}

// ---------------------------------------------------------------------------
// District Summaries
// ---------------------------------------------------------------------------

/**
 * Generate per-district intelligence summaries.
 */
export function generateDistrictSummaries(
  articles: ClassifiedArticle[],
): DistrictIntelSummary[] {
  const districtMap = new Map<string, ClassifiedArticle[]>();

  for (const article of articles) {
    for (const district of article.districts) {
      const existing = districtMap.get(district) || [];
      existing.push(article);
      districtMap.set(district, existing);
    }
  }

  return Array.from(districtMap.entries())
    .map(([district, distArticles]) => {
      // Find highest threat keyword across all articles for this district
      const allKeywords = distArticles.flatMap((a) => a.threatKeywords);
      const highestThreat = allKeywords.length > 0
        ? allKeywords[0].replace(/\b\w/g, (l) => l.toUpperCase())
        : 'General Crime';

      return {
        district,
        articleCount: distArticles.length,
        highestThreat,
        riskContribution: computeRiskContribution(articles, district),
        articles: distArticles,
      };
    })
    .sort((a, b) => b.articleCount - a.articleCount);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Format internal source names into display-friendly labels.
 */
export function formatSourceName(source: string): string {
  const map: Record<string, string> = {
    the_hindu_karnataka: 'The Hindu',
    google_news_karnataka_crime: 'Google News',
    google_news_bengaluru_crime: 'Google News',
  };
  return map[source] || source;
}

/**
 * Format a timestamp string into a relative time display.
 */
export function formatRelativeTime(timestamp: string): string {
  if (!timestamp) return 'Unknown';

  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return timestamp;

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return timestamp;
  }
}

/**
 * Match syndicate-related keywords in an article for network graph linking.
 */
export function matchSyndicateKeywords(article: NewsArticle): string[] {
  const text = `${article.title} ${article.summary}`.toLowerCase();
  const syndicateTerms = [
    'gang', 'syndicate', 'racket', 'network', 'cartel', 'ring',
    'nexus', 'mafia', 'don', 'kingpin', 'handler', 'operative',
  ];

  return syndicateTerms.filter((term) => text.includes(term));
}
