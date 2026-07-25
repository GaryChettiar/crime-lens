"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { DashboardLayout } from "@/components/templates/DashboardLayout";
import { Typography } from "@/components/atoms/Typography";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/atoms/Badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/store/hooks";
import { useAnalyticsFilters } from "@/hooks/useAnalyticsFilters";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Brain,
  BarChart3,
  Map,
  Search,
  Download,
  Flame,
  Zap,
  Eye,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Target,
} from "lucide-react";
import {
  useGetCrimeCountWithPreviousYearQuery,
  useGetCrimeGrowthQuery,
  useGetDistrictCrimeStatsQuery,
  useLazyGetCategoryVolumeRankingQuery,
} from "@/services/dashboardApi";
// ─── Karnataka Mock Data ───────────────────────────────────────────────────

const KARNATAKA_DISTRICTS = [
  {
    name: "Bengaluru Urban",
    riskScore: 88,
    growth: 14.2,
    hotspots: 7,
    trend: "increasing" as const,
    crimeCount: 342,
  },
  {
    name: "Belagavi",
    riskScore: 74,
    growth: 11.8,
    hotspots: 4,
    trend: "increasing" as const,
    crimeCount: 198,
  },
  {
    name: "Kalaburagi",
    riskScore: 70,
    growth: 9.3,
    hotspots: 3,
    trend: "increasing" as const,
    crimeCount: 167,
  },
  {
    name: "Mysuru",
    riskScore: 66,
    growth: 7.1,
    hotspots: 3,
    trend: "stable" as const,
    crimeCount: 154,
  },
  {
    name: "Ballari",
    riskScore: 62,
    growth: 5.4,
    hotspots: 2,
    trend: "stable" as const,
    crimeCount: 131,
  },
  {
    name: "Shivamogga",
    riskScore: 58,
    growth: 4.1,
    hotspots: 2,
    trend: "stable" as const,
    crimeCount: 118,
  },
  {
    name: "Hubballi-Dharwad",
    riskScore: 55,
    growth: 3.8,
    hotspots: 2,
    trend: "stable" as const,
    crimeCount: 109,
  },
  {
    name: "Davanagere",
    riskScore: 48,
    growth: 1.2,
    hotspots: 1,
    trend: "stable" as const,
    crimeCount: 95,
  },
  {
    name: "Bengaluru Rural",
    riskScore: 42,
    growth: -2.1,
    hotspots: 1,
    trend: "decreasing" as const,
    crimeCount: 83,
  },
  {
    name: "Tumakuru",
    riskScore: 35,
    growth: -4.3,
    hotspots: 0,
    trend: "decreasing" as const,
    crimeCount: 71,
  },
];

const CATEGORY_BAR_COLORS = [
  "#F43F5E",
  "#6366F1",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#10B981",
];

const AI_INSIGHTS = [
  {
    id: 1,
    severity: "critical" as const,
    title: "Cyber Fraud Spike Detected",
    detail:
      "Cyber fraud cases in Bengaluru Urban increased 31.7% over the past 14 days. Pattern matches organized phishing syndicate activity with cross-district phone coordination.",
    tag: "Emerging Hotspot",
    district: "Bengaluru Urban",
  },
  {
    id: 2,
    severity: "high" as const,
    title: "Belagavi Property Crime Escalation",
    detail:
      "Belagavi shows abnormal 11.8% MoM growth in property crimes. ANPR data correlates with vehicle movement from Kalaburagi corridor suggesting inter-district network.",
    tag: "Crime Spike",
    district: "Belagavi",
  },
  {
    id: 3,
    severity: "high" as const,
    title: "Mysuru Hotspot Emergence",
    detail:
      "Mysuru has three emerging hotspots in Nazarbad, Kuvempunagar, and Vijayanagar. Incidents show temporal clustering between 22:00–02:00.",
    tag: "Pattern Detection",
    district: "Mysuru",
  },
  {
    id: 4,
    severity: "medium" as const,
    title: "Kalaburagi Risk Escalation",
    detail:
      "Risk index for Kalaburagi rose from 58 to 70 over 30 days. Narcotics seizures up 9.3% and correlate with known cross-border smuggling corridors from Bidar.",
    tag: "District Risk",
    district: "Kalaburagi",
  },
];

const ANOMALIES = [
  {
    district: "Bengaluru Urban",
    type: "Unexpected Cyber Crime Cluster",
    severity: "critical" as const,
    confidence: 94,
    delta: "+31.7%",
  },
  {
    district: "Belagavi",
    type: "Robbery Spike – Highway NH-48",
    severity: "high" as const,
    confidence: 87,
    delta: "+18.2%",
  },
  {
    district: "Mysuru",
    type: "Unusual Nighttime Assault Surge",
    severity: "high" as const,
    confidence: 83,
    delta: "+14.6%",
  },
  {
    district: "Kalaburagi",
    type: "Narcotics Corridor Activity",
    severity: "medium" as const,
    confidence: 76,
    delta: "+9.3%",
  },
  {
    district: "Ballari",
    type: "Fraud Surge – Digital Payments",
    severity: "medium" as const,
    confidence: 71,
    delta: "+8.1%",
  },
];

// Correlation heatmap: Time of Day × Crime Category (0–10 intensity)
const CORRELATION_TYPES = [
  "Theft",
  "Cyber",
  "Assault",
  "Fraud",
  "Narcotics",
  "Traffic",
];
const CORRELATION_TIMES = [
  "00–04",
  "04–08",
  "08–12",
  "12–16",
  "16–20",
  "20–24",
];
const CORRELATION_MATRIX: number[][] = [
  [8, 1, 6, 1, 7, 2],
  [3, 2, 2, 1, 3, 1],
  [2, 7, 3, 8, 2, 4],
  [4, 8, 4, 7, 3, 7],
  [6, 9, 6, 8, 4, 9],
  [9, 4, 8, 3, 8, 6],
];

const INCIDENTS = [
  {
    id: "KA-2026-C001",
    type: "Cyber Crime",
    district: "Bengaluru Urban",
    riskScore: 91,
    severity: "critical" as const,
    status: "investigating" as const,
    date: "2026-06-07",
  },
  {
    id: "KA-2026-C002",
    type: "Theft",
    district: "Belagavi",
    riskScore: 78,
    severity: "high" as const,
    status: "open" as const,
    date: "2026-06-07",
  },
  {
    id: "KA-2026-C003",
    type: "Assault",
    district: "Mysuru",
    riskScore: 74,
    severity: "high" as const,
    status: "investigating" as const,
    date: "2026-06-06",
  },
  {
    id: "KA-2026-C004",
    type: "Fraud",
    district: "Kalaburagi",
    riskScore: 68,
    severity: "high" as const,
    status: "open" as const,
    date: "2026-06-06",
  },
  {
    id: "KA-2026-C005",
    type: "Narcotics",
    district: "Ballari",
    riskScore: 65,
    severity: "medium" as const,
    status: "investigating" as const,
    date: "2026-06-05",
  },
  {
    id: "KA-2026-C006",
    type: "Theft",
    district: "Shivamogga",
    riskScore: 58,
    severity: "medium" as const,
    status: "open" as const,
    date: "2026-06-05",
  },
  {
    id: "KA-2026-C007",
    type: "Cyber Crime",
    district: "Hubballi-Dharwad",
    riskScore: 55,
    severity: "medium" as const,
    status: "resolved" as const,
    date: "2026-06-04",
  },
  {
    id: "KA-2026-C008",
    type: "Assault",
    district: "Davanagere",
    riskScore: 49,
    severity: "medium" as const,
    status: "closed" as const,
    date: "2026-06-04",
  },
  {
    id: "KA-2026-C009",
    type: "Fraud",
    district: "Bengaluru Rural",
    riskScore: 42,
    severity: "low" as const,
    status: "resolved" as const,
    date: "2026-06-03",
  },
  {
    id: "KA-2026-C010",
    type: "Traffic",
    district: "Tumakuru",
    riskScore: 28,
    severity: "low" as const,
    status: "closed" as const,
    date: "2026-06-03",
  },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  subtext,
  delta,
  deltaDir,
  icon: IconComp,
  accent = false,
}: {
  label: string;
  value: string | number;
  subtext?: string;
  delta?: string;
  deltaDir?: "up" | "down" | "neutral";
  icon: React.ElementType;
  accent?: boolean;
}) {
  const DeltaIcon =
    deltaDir === "up"
      ? ArrowUpRight
      : deltaDir === "down"
        ? ArrowDownRight
        : Minus;
  const deltaColor =
    deltaDir === "up"
      ? "text-danger"
      : deltaDir === "down"
        ? "text-success"
        : "text-muted-foreground";

  return (
    <Card
      className={cn(
        "border-border bg-card",
        accent && "border-danger/40 bg-danger/5",
      )}
    >
      <CardContent className="px-2 flex flex-col ">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            {label}
          </span>

          <div
            className={cn(
              "size-8 rounded-md flex items-center justify-center",
              accent ? "bg-danger/15" : "bg-primary/10",
            )}
          >
            <IconComp
              className={cn(
                "size-3.5",
                accent ? "text-danger" : "text-primary",
              )}
            />
          </div>
        </div>

        {/* Value + Delta */}
        <div className="flex items-end gap-2">
          <span className="text-4xl font-bold font-data leading-none text-foreground">
            {value}
          </span>

          {delta && (
            <div
              className={cn(
                "flex items-center gap-0.5 text-[11px] font-bold pb-1",
                deltaColor,
              )}
            >
              <DeltaIcon className="size-3" />
              <span>{delta}</span>
            </div>
          )}
        </div>

        {/* Subtext */}
        {subtext && (
          <span className="text-[10px] text-muted-foreground">{subtext}</span>
        )}
      </CardContent>
    </Card>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="size-1 rounded-full bg-primary" />
      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">
        {children}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

function RiskBadge({ score }: { score: number }) {
  if (score >= 80)
    return (
      <Badge
        variant="risk-critical"
        size="sm"
        className="text-[9px] px-1.5 py-0"
      >
        Critical
      </Badge>
    );
  if (score >= 60)
    return (
      <Badge variant="risk-high" size="sm" className="text-[9px] px-1.5 py-0">
        High
      </Badge>
    );
  if (score >= 40)
    return (
      <Badge variant="risk-medium" size="sm" className="text-[9px] px-1.5 py-0">
        Medium
      </Badge>
    );
  return (
    <Badge variant="risk-low" size="sm" className="text-[9px] px-1.5 py-0">
      Low
    </Badge>
  );
}

function TrendIcon({
  trend,
}: {
  trend: "increasing" | "stable" | "decreasing";
}) {
  if (trend === "increasing")
    return <TrendingUp className="size-3.5 text-danger" />;
  if (trend === "decreasing")
    return <TrendingDown className="size-3.5 text-success" />;
  return <Minus className="size-3.5 text-muted-foreground" />;
}

const HEAT_PALETTE = (v: number) => {
  if (v >= 8) return "bg-danger/80 text-white";
  if (v >= 6) return "bg-danger/50 text-white";
  if (v >= 4) return "bg-warning/50 text-foreground";
  if (v >= 2) return "bg-primary/30 text-foreground";
  return "bg-muted/30 text-muted-foreground";
};

const CUSTOM_TOOLTIP_STYLE = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "6px",
  fontSize: "11px",
  color: "hsl(var(--foreground))",
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export function AnalyticsPage() {
  const globalFilters = useAppSelector((state) => state.globalFilters);
  const { districtId, stationId } = useAnalyticsFilters();
  const [search, setSearch] = React.useState("");
  // --- dashboardApi wiring -------------------------------------------------

  // Map global filters -> dashboardApi filter shape (single-value fields only;
  // multi-select crimeTypes/severities aren't supported by these endpoints).
  const apiFilters = React.useMemo(
    () => ({
      districtId: districtId || undefined,
      stationId: stationId || undefined,
      categoryId: globalFilters.crimeTypes[0] || undefined,
      fromDate: globalFilters.dateRange.start || undefined,
      toDate: globalFilters.dateRange.end || undefined,
    }),
    [globalFilters, districtId, stationId],
  );

  // Crime growth requires fromDate/toDate — default to a trailing 30-day
  // window when the user hasn't picked an explicit range.
  const growthFilters = React.useMemo(() => {
    const toDate =
      globalFilters.dateRange.end || new Date().toISOString().slice(0, 10);
    const defaultFrom = new Date();
    defaultFrom.setDate(defaultFrom.getDate() - 30);
    const fromDate =
      globalFilters.dateRange.start || defaultFrom.toISOString().slice(0, 10);

    return {
      districtId: districtId || undefined,
      stationId: stationId || undefined,
      categoryId: globalFilters.crimeTypes[0] || undefined,
      fromDate,
      toDate,
    };
  }, [globalFilters, districtId, stationId]);

  const { data: yoyCounts, isLoading: isLoadingTotal } =
    useGetCrimeCountWithPreviousYearQuery(apiFilters);

  const { data: crimeGrowth, isLoading: isLoadingGrowth } =
    useGetCrimeGrowthQuery(growthFilters);

  const [fetchCategoryVolumes, {
    data: categoryVolumes = [],
    isLoading: isLoadingCategoryVolumes,
  }] = useLazyGetCategoryVolumeRankingQuery();

  React.useEffect(() => {
    // Trigger explicitly after the page commits so the category-volume request
    // is always issued, including after a hot reload or cached prior query.
    fetchCategoryVolumes(growthFilters, false);
  }, [fetchCategoryVolumes, growthFilters]);
  // Keep the page resilient while the API response is being normalized or if
  // an older backend deployment returns a non-array payload.
  const categoryVolumeItems = Array.isArray(categoryVolumes)
    ? categoryVolumes
    : [];

  const { data: districtStats = [], isLoading: isLoadingDistrictStats } =
    useGetDistrictCrimeStatsQuery();

  // "High risk" = crimeCount above the statewide average across districts
  // returned by the API (no riskScore field exists on DistrictCrimeStat,
  // so this is a stand-in heuristic — swap in a real threshold if/when
  // the backend exposes one).
  const highRiskDistrictsCount = React.useMemo(() => {
    if (districtStats.length === 0) return 0;
    const avg =
      districtStats.reduce((sum, d) => sum + d.crimeCount, 0) /
      districtStats.length;
    return districtStats.filter((d) => d.crimeCount > avg).length;
  }, [districtStats]);

  const totalDeltaPct = React.useMemo(() => {
    if (!yoyCounts || !yoyCounts.previousYearCount) return 0;
    return (
      ((yoyCounts.currentPeriodCount - yoyCounts.previousYearCount) /
        yoyCounts.previousYearCount) *
      100
    );
  }, [yoyCounts]);
  const filteredIncidents = INCIDENTS.filter((inc) => {
    // 1. Global District Filter
    if (
      globalFilters.district &&
      inc.district.toLowerCase() !== globalFilters.district.toLowerCase()
    ) {
      return false;
    }
    // 2. Global Crime Type
    if (
      globalFilters.crimeTypes.length > 0 &&
      !globalFilters.crimeTypes.includes(inc.type.toLowerCase())
    ) {
      return false;
    }
    // 3. Global Severity
    if (
      globalFilters.severities.length > 0 &&
      !globalFilters.severities.includes(inc.severity)
    ) {
      return false;
    }
    // 4. Global Date ranges
    if (
      globalFilters.dateRange.start &&
      inc.date < globalFilters.dateRange.start
    ) {
      return false;
    }
    if (globalFilters.dateRange.end && inc.date > globalFilters.dateRange.end) {
      return false;
    }

    if (
      search &&
      !inc.id.toLowerCase().includes(search.toLowerCase()) &&
      !inc.type.toLowerCase().includes(search.toLowerCase()) &&
      !inc.district.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  const maxCategoryCount = Math.max(
    1,
    ...categoryVolumeItems.map((category) => category.count),
  );

  return (
    <DashboardLayout title="Crime Intelligence Analytics">
      <div className=" pb-16 px-1">
        {/* ── 1. Page Header ── */}

        {/* ── 2. KPI Intelligence Row ── */}
        <div>
          {/* <SectionLabel>KPI Intelligence Row</SectionLabel> */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-3">
            <KpiCard
              label="Total Crimes Analyzed"
              value={
                isLoadingTotal
                  ? "—"
                  : (yoyCounts?.currentPeriodCount ?? 0).toLocaleString()
              }
              delta={
                isLoadingTotal
                  ? undefined
                  : `${totalDeltaPct >= 0 ? "+" : ""}${totalDeltaPct.toFixed(1)}%`
              }
              deltaDir={
                totalDeltaPct > 0
                  ? "up"
                  : totalDeltaPct < 0
                    ? "down"
                    : "neutral"
              }
              subtext="vs same period last year"
              icon={BarChart3}
            />
            <KpiCard
              label="Crime Growth"
              value={
                isLoadingGrowth || !crimeGrowth
                  ? "—"
                  : `${crimeGrowth.growthPercentage >= 0 ? "+" : ""}${crimeGrowth.growthPercentage.toFixed(1)}%`
              }
              delta="Period-over-period"
              deltaDir={
                !crimeGrowth
                  ? "neutral"
                  : crimeGrowth.growthPercentage > 0
                    ? "up"
                    : "down"
              }
              subtext="statewide"
              icon={TrendingUp}
              accent
            />
            <KpiCard
              label="High Risk Districts"
              value={isLoadingDistrictStats ? "—" : highRiskDistrictsCount}
              delta={
                isLoadingDistrictStats
                  ? undefined
                  : `of ${districtStats.length}`
              }
              deltaDir="neutral"
              subtext="crime count above average"
              icon={ShieldAlert}
            />
          </div>
        </div>

        {/* ── 4. Crime Category Analysis ── */}
        <div className="mt-5">
          <SectionLabel>Crime Category & Correlation Analysis</SectionLabel>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-3">
            {/* Category Volume Ranking */}
            <Card className="border-border bg-card">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <BarChart3 className="size-4 text-warning" />
                  Category Volume Ranking
                </CardTitle>
              </CardHeader>

              <CardContent className="p-4 pt-3 space-y-3">
                {isLoadingCategoryVolumes ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    Loading category volumes…
                  </div>
                ) : categoryVolumeItems.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    No category data for the selected period.
                  </div>
                ) : (
                  categoryVolumeItems.map((cat, index) => (
                    <div key={cat.categoryId} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">
                            {cat.categoryName}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-data font-bold text-foreground">
                            {cat.count.toLocaleString()}
                          </span>

                          <span
                            className={cn(
                              "font-bold text-[10px]",
                              cat.growthPercentage > 0
                                ? "text-danger"
                                : "text-success",
                            )}
                          >
                            {cat.growthPercentage > 0 ? "+" : ""}
                            {cat.growthPercentage}%
                          </span>
                        </div>
                      </div>

                      <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${(cat.count / maxCategoryCount) * 100}%`,
                            backgroundColor:
                              CATEGORY_BAR_COLORS[
                                index % CATEGORY_BAR_COLORS.length
                              ],
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Heatmap */}
            <Card className="border-border bg-card">
              <CardHeader className="border-b border-border">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Eye className="size-4 text-primary" />
                  Crime–Time Correlation Heatmap
                </CardTitle>
              </CardHeader>

              <CardContent className="p-4 pt-3 overflow-x-auto">
                <div className="inline-block min-w-full">
                  <div className="flex gap-1 mb-1 ml-16">
                    {CORRELATION_TYPES.map((t) => (
                      <div
                        key={t}
                        className="w-16 text-[9px] font-bold text-muted-foreground text-center truncate uppercase tracking-wide"
                      >
                        {t}
                      </div>
                    ))}
                  </div>

                  {CORRELATION_TIMES.map((time, ri) => (
                    <div key={time} className="flex gap-1 mb-1 items-center">
                      <div className="w-14 text-[9px] font-bold text-muted-foreground text-right pr-2 uppercase tracking-wide shrink-0">
                        {time}
                      </div>

                      {CORRELATION_MATRIX[ri].map((val, ci) => (
                        <div
                          key={ci}
                          className={cn(
                            "w-16 h-10 rounded flex items-center justify-center text-[11px] font-bold transition-all hover:scale-105 cursor-default",
                            HEAT_PALETTE(val),
                          )}
                        >
                          {val}
                        </div>
                      ))}
                    </div>
                  ))}

                  <div className="flex items-center gap-2 mt-3 ml-16">
                    <span className="text-[9px] text-muted-foreground">
                      Low
                    </span>

                    {[1, 3, 5, 7, 9].map((v) => (
                      <div
                        key={v}
                        className={cn("w-6 h-3 rounded-sm", HEAT_PALETTE(v))}
                      />
                    ))}

                    <span className="text-[9px] text-muted-foreground">
                      High
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
