"use client"

import * as React from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { DashboardLayout } from '@/components/templates/DashboardLayout';
import { Typography } from '@/components/atoms/Typography';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/store/hooks';
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, Brain,
  BarChart3, Map, Search, Download,
  Flame, Zap, Eye, ShieldAlert, ArrowUpRight, ArrowDownRight,
  Activity, Target,
} from 'lucide-react';

// ─── Karnataka Mock Data ───────────────────────────────────────────────────

const KARNATAKA_DISTRICTS = [
  { name: 'Bengaluru Urban',  riskScore: 88, growth: 14.2, hotspots: 7, trend: 'increasing' as const, crimeCount: 342 },
  { name: 'Belagavi',         riskScore: 74, growth: 11.8, hotspots: 4, trend: 'increasing' as const, crimeCount: 198 },
  { name: 'Kalaburagi',       riskScore: 70, growth: 9.3,  hotspots: 3, trend: 'increasing' as const, crimeCount: 167 },
  { name: 'Mysuru',           riskScore: 66, growth: 7.1,  hotspots: 3, trend: 'stable'    as const, crimeCount: 154 },
  { name: 'Ballari',          riskScore: 62, growth: 5.4,  hotspots: 2, trend: 'stable'    as const, crimeCount: 131 },
  { name: 'Shivamogga',       riskScore: 58, growth: 4.1,  hotspots: 2, trend: 'stable'    as const, crimeCount: 118 },
  { name: 'Hubballi-Dharwad', riskScore: 55, growth: 3.8,  hotspots: 2, trend: 'stable'    as const, crimeCount: 109 },
  { name: 'Davanagere',       riskScore: 48, growth: 1.2,  hotspots: 1, trend: 'stable'    as const, crimeCount: 95 },
  { name: 'Bengaluru Rural',  riskScore: 42, growth: -2.1, hotspots: 1, trend: 'decreasing' as const, crimeCount: 83 },
  { name: 'Tumakuru',         riskScore: 35, growth: -4.3, hotspots: 0, trend: 'decreasing' as const, crimeCount: 71 },
];

// 30-day daily trend data
const TREND_30D = Array.from({ length: 30 }, (_, i) => {
  const base = 28 + Math.sin(i / 4) * 6;
  return {
    day: `Jun ${i + 1}`,
    current: Math.round(base + Math.random() * 8),
    previous: Math.round(base * 0.88 + Math.random() * 6),
  };
});

// 90-day weekly trend data
const TREND_90D = Array.from({ length: 13 }, (_, i) => ({
  day: `W${i + 1}`,
  current: Math.round(190 + Math.sin(i / 3) * 30 + Math.random() * 20),
  previous: Math.round(170 + Math.sin(i / 3) * 25 + Math.random() * 15),
}));

const CRIME_CATEGORIES = [
  { category: 'Theft',             count: 487, growth: 18.4, color: '#F43F5E', icon: '🔓' },
  { category: 'Cyber Crime',       count: 312, growth: 31.7, color: '#6366F1', icon: '💻' },
  { category: 'Assault',           count: 278, growth: 6.2,  color: '#F59E0B', icon: '⚠️' },
  { category: 'Fraud',             count: 241, growth: 22.1, color: '#8B5CF6', icon: '📋' },
  { category: 'Drug Offenses',     count: 198, growth: 8.9,  color: '#EC4899', icon: '💊' },
  { category: 'Traffic Violations',count: 163, growth: -3.4, color: '#10B981', icon: '🚦' },
];

const AI_INSIGHTS = [
  {
    id: 1, severity: 'critical' as const,
    title: 'Cyber Fraud Spike Detected',
    detail: 'Cyber fraud cases in Bengaluru Urban increased 31.7% over the past 14 days. Pattern matches organized phishing syndicate activity with cross-district phone coordination.',
    tag: 'Emerging Hotspot',
    district: 'Bengaluru Urban',
  },
  {
    id: 2, severity: 'high' as const,
    title: 'Belagavi Property Crime Escalation',
    detail: 'Belagavi shows abnormal 11.8% MoM growth in property crimes. ANPR data correlates with vehicle movement from Kalaburagi corridor suggesting inter-district network.',
    tag: 'Crime Spike',
    district: 'Belagavi',
  },
  {
    id: 3, severity: 'high' as const,
    title: 'Mysuru Hotspot Emergence',
    detail: 'Mysuru has three emerging hotspots in Nazarbad, Kuvempunagar, and Vijayanagar. Incidents show temporal clustering between 22:00–02:00.',
    tag: 'Pattern Detection',
    district: 'Mysuru',
  },
  {
    id: 4, severity: 'medium' as const,
    title: 'Kalaburagi Risk Escalation',
    detail: 'Risk index for Kalaburagi rose from 58 to 70 over 30 days. Narcotics seizures up 9.3% and correlate with known cross-border smuggling corridors from Bidar.',
    tag: 'District Risk',
    district: 'Kalaburagi',
  },
];

const ANOMALIES = [
  { district: 'Bengaluru Urban', type: 'Unexpected Cyber Crime Cluster', severity: 'critical' as const, confidence: 94, delta: '+31.7%' },
  { district: 'Belagavi',        type: 'Robbery Spike – Highway NH-48',  severity: 'high'     as const, confidence: 87, delta: '+18.2%' },
  { district: 'Mysuru',          type: 'Unusual Nighttime Assault Surge', severity: 'high'     as const, confidence: 83, delta: '+14.6%' },
  { district: 'Kalaburagi',      type: 'Narcotics Corridor Activity',    severity: 'medium'   as const, confidence: 76, delta: '+9.3%'  },
  { district: 'Ballari',         type: 'Fraud Surge – Digital Payments', severity: 'medium'   as const, confidence: 71, delta: '+8.1%'  },
];

// Correlation heatmap: Time of Day × Crime Category (0–10 intensity)
const CORRELATION_TYPES = ['Theft', 'Cyber', 'Assault', 'Fraud', 'Narcotics', 'Traffic'];
const CORRELATION_TIMES = ['00–04', '04–08', '08–12', '12–16', '16–20', '20–24'];
const CORRELATION_MATRIX: number[][] = [
  [8, 1, 6, 1, 7, 2],
  [3, 2, 2, 1, 3, 1],
  [2, 7, 3, 8, 2, 4],
  [4, 8, 4, 7, 3, 7],
  [6, 9, 6, 8, 4, 9],
  [9, 4, 8, 3, 8, 6],
];

const INCIDENTS = [
  { id: 'KA-2026-C001', type: 'Cyber Crime', district: 'Bengaluru Urban', riskScore: 91, severity: 'critical' as const, status: 'investigating' as const, date: '2026-06-07' },
  { id: 'KA-2026-C002', type: 'Theft',       district: 'Belagavi',        riskScore: 78, severity: 'high'     as const, status: 'open'          as const, date: '2026-06-07' },
  { id: 'KA-2026-C003', type: 'Assault',     district: 'Mysuru',          riskScore: 74, severity: 'high'     as const, status: 'investigating' as const, date: '2026-06-06' },
  { id: 'KA-2026-C004', type: 'Fraud',       district: 'Kalaburagi',      riskScore: 68, severity: 'high'     as const, status: 'open'          as const, date: '2026-06-06' },
  { id: 'KA-2026-C005', type: 'Narcotics',   district: 'Ballari',         riskScore: 65, severity: 'medium'   as const, status: 'investigating' as const, date: '2026-06-05' },
  { id: 'KA-2026-C006', type: 'Theft',       district: 'Shivamogga',      riskScore: 58, severity: 'medium'   as const, status: 'open'          as const, date: '2026-06-05' },
  { id: 'KA-2026-C007', type: 'Cyber Crime', district: 'Hubballi-Dharwad',riskScore: 55, severity: 'medium'   as const, status: 'resolved'      as const, date: '2026-06-04' },
  { id: 'KA-2026-C008', type: 'Assault',     district: 'Davanagere',      riskScore: 49, severity: 'medium'   as const, status: 'closed'        as const, date: '2026-06-04' },
  { id: 'KA-2026-C009', type: 'Fraud',       district: 'Bengaluru Rural', riskScore: 42, severity: 'low'      as const, status: 'resolved'      as const, date: '2026-06-03' },
  { id: 'KA-2026-C010', type: 'Traffic',     district: 'Tumakuru',        riskScore: 28, severity: 'low'      as const, status: 'closed'        as const, date: '2026-06-03' },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function KpiCard({
  label, value, subtext, delta, deltaDir, icon: IconComp, accent = false,
}: {
  label: string; value: string | number; subtext?: string;
  delta?: string; deltaDir?: 'up' | 'down' | 'neutral';
  icon: React.ElementType; accent?: boolean;
}) {
  const DeltaIcon = deltaDir === 'up' ? ArrowUpRight : deltaDir === 'down' ? ArrowDownRight : Minus;
  const deltaColor = deltaDir === 'up' ? 'text-danger' : deltaDir === 'down' ? 'text-success' : 'text-muted-foreground';

  return (
    <Card className={cn('border-border bg-card', accent && 'border-danger/40 bg-danger/5')}>
      <CardContent className="p-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</span>
          <div className={cn('size-7 rounded-md flex items-center justify-center', accent ? 'bg-danger/15' : 'bg-primary/10')}>
            <IconComp className={cn('size-3.5', accent ? 'text-danger' : 'text-primary')} />
          </div>
        </div>
        <div className="text-2xl font-bold font-data text-foreground">{value}</div>
        <div className="flex items-center gap-1.5">
          {delta && (
            <div className={cn('flex items-center gap-0.5 text-[10px] font-bold', deltaColor)}>
              <DeltaIcon className="size-3" />
              <span>{delta}</span>
            </div>
          )}
          {subtext && <span className="text-[10px] text-muted-foreground">{subtext}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="size-1 rounded-full bg-primary" />
      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">{children}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

function RiskBadge({ score }: { score: number }) {
  if (score >= 80) return <Badge variant="risk-critical" size="sm" className="text-[9px] px-1.5 py-0">Critical</Badge>;
  if (score >= 60) return <Badge variant="risk-high"     size="sm" className="text-[9px] px-1.5 py-0">High</Badge>;
  if (score >= 40) return <Badge variant="risk-medium"   size="sm" className="text-[9px] px-1.5 py-0">Medium</Badge>;
  return                  <Badge variant="risk-low"      size="sm" className="text-[9px] px-1.5 py-0">Low</Badge>;
}

function TrendIcon({ trend }: { trend: 'increasing' | 'stable' | 'decreasing' }) {
  if (trend === 'increasing') return <TrendingUp className="size-3.5 text-danger" />;
  if (trend === 'decreasing') return <TrendingDown className="size-3.5 text-success" />;
  return <Minus className="size-3.5 text-muted-foreground" />;
}

const HEAT_PALETTE = (v: number) => {
  if (v >= 8) return 'bg-danger/80 text-white';
  if (v >= 6) return 'bg-danger/50 text-white';
  if (v >= 4) return 'bg-warning/50 text-foreground';
  if (v >= 2) return 'bg-primary/30 text-foreground';
  return 'bg-muted/30 text-muted-foreground';
};

const CUSTOM_TOOLTIP_STYLE = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '6px',
  fontSize: '11px',
  color: 'hsl(var(--foreground))',
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export function AnalyticsPage() {
  const globalFilters = useAppSelector((state) => state.globalFilters);
  const [trendWindow, setTrendWindow] = React.useState<'30d' | '90d'>('30d');
  const [search, setSearch] = React.useState('');

  const trendData = trendWindow === '30d' ? TREND_30D : TREND_90D;

  const filteredIncidents = INCIDENTS.filter((inc) => {
    // 1. Global District Filter
    if (globalFilters.district && inc.district.toLowerCase() !== globalFilters.district.toLowerCase()) {
      return false;
    }
    // 2. Global Crime Type
    if (globalFilters.crimeTypes.length > 0 && !globalFilters.crimeTypes.includes(inc.type.toLowerCase())) {
      return false;
    }
    // 3. Global Severity
    if (globalFilters.severities.length > 0 && !globalFilters.severities.includes(inc.severity)) {
      return false;
    }
    // 4. Global Date ranges
    if (globalFilters.dateRange.start && inc.date < globalFilters.dateRange.start) {
      return false;
    }
    if (globalFilters.dateRange.end && inc.date > globalFilters.dateRange.end) {
      return false;
    }

    if (search && !inc.id.toLowerCase().includes(search.toLowerCase()) && !inc.type.toLowerCase().includes(search.toLowerCase()) && !inc.district.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const maxCategoryCount = Math.max(...CRIME_CATEGORIES.map(c => c.count));

  return (
    <DashboardLayout title="Crime Intelligence Analytics">
      <div className="space-y-8 max-w-7xl mx-auto pb-16 px-1">

        {/* ── 1. Page Header ── */}
        <div className="pb-4 border-b border-border flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="size-2 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Live Intelligence Feed</span>
            </div>
            <Typography variant="heading-xl" as="h1" className="font-bold text-foreground">
              Crime Intelligence Analytics
            </Typography>
            <Typography variant="body-sm" color="muted" className="mt-0.5">
              Deep analysis · Pattern discovery · AI-generated intelligence · Karnataka State Command
            </Typography>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 h-9 self-start md:self-auto">
            <Download className="size-3.5" />
            <span className="text-xs font-semibold">Export Report</span>
          </Button>
        </div>

        {/* ── 2. KPI Intelligence Row ── */}
        <div>
          <SectionLabel>KPI Intelligence Row</SectionLabel>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-3">
            <KpiCard label="Total Crimes Analyzed" value="1,847" delta="12.3%" deltaDir="up" subtext="vs last month" icon={BarChart3} />
            <KpiCard label="Crime Growth" value="+12.3%" delta="MoM" deltaDir="up" subtext="statewide" icon={TrendingUp} accent />
            <KpiCard label="Emerging Hotspots" value="18" delta="+4" deltaDir="up" subtext="new this week" icon={Flame} accent />
            <KpiCard label="Active Anomalies" value="5" delta="3 critical" deltaDir="up" subtext="under review" icon={Zap} accent />
            <KpiCard label="High Risk Districts" value="7" delta="+2" deltaDir="up" subtext="risk score ≥60" icon={ShieldAlert} />
          </div>
        </div>

        {/* ── 3. Crime Trend Analysis ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <SectionLabel>Crime Trend Analysis</SectionLabel>
            <div className="flex items-center gap-1 bg-card border border-border rounded-md p-0.5">
              {(['30d', '90d'] as const).map(w => (
                <button key={w} onClick={() => setTrendWindow(w)}
                  className={cn(
                    'px-3 py-1 text-[10px] font-bold uppercase rounded-sm transition-all',
                    trendWindow === w ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'
                  )}>
                  {w === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
                </button>
              ))}
            </div>
          </div>
          <Card className="border-border bg-card">
            <CardHeader className="p-4 pb-2 border-b border-border flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Activity className="size-4 text-primary" />
                Crime Volume — {trendWindow === '30d' ? 'Daily (Last 30 Days)' : 'Weekly (Last 90 Days)'}
              </CardTitle>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <div className="flex items-center gap-1"><div className="size-2 rounded-full bg-primary" /> Current Period</div>
                <div className="flex items-center gap-1"><div className="size-2 rounded-full bg-slate-500" /> Previous Period</div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-3">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={trendData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                  <defs>
                    <linearGradient id="gradCurrent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradPrev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#64748B" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#64748B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="day" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} />
                  <Area type="monotone" dataKey="previous" stroke="#64748B" strokeWidth={1.5} fill="url(#gradPrev)" strokeDasharray="4 2" dot={false} name="Previous Period" />
                  <Area type="monotone" dataKey="current"  stroke="#3B82F6" strokeWidth={2} fill="url(#gradCurrent)" dot={false} name="Current Period" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* ── 4. Crime Category Analysis ── */}
        <div>
          <SectionLabel>Crime Category Analysis</SectionLabel>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-3">
            {/* Horizontal ranking */}
            <Card className="border-border bg-card">
              <CardHeader className="p-4 pb-2 border-b border-border">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <BarChart3 className="size-4 text-warning" />
                  Category Volume Ranking
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-3 space-y-3">
                {CRIME_CATEGORIES.map((cat) => (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-base leading-none">{cat.icon}</span>
                        <span className="font-semibold text-foreground">{cat.category}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-data font-bold text-foreground">{cat.count.toLocaleString()}</span>
                        <span className={cn('font-bold text-[10px]', cat.growth > 0 ? 'text-danger' : 'text-success')}>
                          {cat.growth > 0 ? '+' : ''}{cat.growth}%
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${(cat.count / maxCategoryCount) * 100}%`, backgroundColor: cat.color }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Bar chart */}
            <Card className="border-border bg-card">
              <CardHeader className="p-4 pb-2 border-b border-border">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <TrendingUp className="size-4 text-primary" />
                  MoM Growth by Category
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-3">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={CRIME_CATEGORIES} margin={{ top: 4, right: 8, bottom: 0, left: -20 }} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} unit="%" />
                    <YAxis type="category" dataKey="category" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} width={80} />
                    <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} formatter={(v: unknown) => [`${Number(v)}%`, 'Growth']} />
                    <Bar dataKey="growth" radius={[0, 3, 3, 0]} name="MoM Growth %">
                      {CRIME_CATEGORIES.map((c) => (
                        <Cell key={c.category} fill={c.growth > 0 ? '#F43F5E' : '#10B981'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── 5. District Risk Analysis ── */}
        <div>
          <SectionLabel>Karnataka District Risk Analysis</SectionLabel>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-3">

            {/* Risk level legend + summary */}
            <Card className="lg:col-span-4 border-border bg-card">
              <CardHeader className="p-4 pb-2 border-b border-border">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Map className="size-4 text-primary" />
                  Risk Level Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-3 space-y-3">
                {[
                  { label: 'Critical (≥80)', count: KARNATAKA_DISTRICTS.filter(d => d.riskScore >= 80).length, color: 'bg-danger', textColor: 'text-danger' },
                  { label: 'High (60–79)',   count: KARNATAKA_DISTRICTS.filter(d => d.riskScore >= 60 && d.riskScore < 80).length, color: 'bg-orange-500', textColor: 'text-orange-400' },
                  { label: 'Medium (40–59)', count: KARNATAKA_DISTRICTS.filter(d => d.riskScore >= 40 && d.riskScore < 60).length, color: 'bg-warning', textColor: 'text-warning' },
                  { label: 'Low (<40)',      count: KARNATAKA_DISTRICTS.filter(d => d.riskScore < 40).length, color: 'bg-success', textColor: 'text-success' },
                ].map((level) => (
                  <div key={level.label} className="flex items-center justify-between p-2.5 rounded-md bg-muted/15 border border-border/40">
                    <div className="flex items-center gap-2.5">
                      <div className={cn('size-2.5 rounded-sm', level.color)} />
                      <span className="text-xs font-medium text-foreground">{level.label}</span>
                    </div>
                    <span className={cn('font-data font-bold text-sm', level.textColor)}>{level.count} districts</span>
                  </div>
                ))}

                <Separator />

                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">State Average Risk Score</span>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-data font-bold text-foreground">
                      {Math.round(KARNATAKA_DISTRICTS.reduce((s, d) => s + d.riskScore, 0) / KARNATAKA_DISTRICTS.length)}
                    </span>
                    <span className="text-xs text-muted-foreground mb-1">/100</span>
                  </div>
                  <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-success via-warning to-danger rounded-full" style={{ width: '62%' }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* District ranking table */}
            <Card className="lg:col-span-8 border-border bg-card">
              <CardHeader className="p-4 pb-2 border-b border-border">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Target className="size-4 text-danger" />
                  Top 10 Districts by Risk Score
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/20">
                      <th className="text-left p-3 font-bold text-muted-foreground uppercase text-[9px] tracking-wider">#</th>
                      <th className="text-left p-3 font-bold text-muted-foreground uppercase text-[9px] tracking-wider">District</th>
                      <th className="text-right p-3 font-bold text-muted-foreground uppercase text-[9px] tracking-wider">Risk Score</th>
                      <th className="text-right p-3 font-bold text-muted-foreground uppercase text-[9px] tracking-wider">Growth</th>
                      <th className="text-right p-3 font-bold text-muted-foreground uppercase text-[9px] tracking-wider">Hotspots</th>
                      <th className="text-center p-3 font-bold text-muted-foreground uppercase text-[9px] tracking-wider">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {KARNATAKA_DISTRICTS.map((d, i) => (
                      <tr key={d.name} className={cn('border-b border-border/50 hover:bg-muted/10 transition-colors', i < 3 && 'bg-danger/3')}>
                        <td className="p-3">
                          <span className={cn('font-data font-bold', i < 3 ? 'text-danger' : 'text-muted-foreground')}>{i + 1}</span>
                        </td>
                        <td className="p-3 font-semibold text-foreground">{d.name}</td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                              <div className="h-full rounded-full bg-primary" style={{ width: `${d.riskScore}%` }} />
                            </div>
                            <span className="font-data font-bold text-foreground w-6 text-right">{d.riskScore}</span>
                          </div>
                        </td>
                        <td className={cn('p-3 text-right font-bold font-data', d.growth > 0 ? 'text-danger' : 'text-success')}>
                          {d.growth > 0 ? '+' : ''}{d.growth}%
                        </td>
                        <td className="p-3 text-right font-data font-bold text-foreground">{d.hotspots}</td>
                        <td className="p-3">
                          <div className="flex justify-center"><TrendIcon trend={d.trend} /></div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── 6. AI Intelligence Insights ── */}
        <div>
          <SectionLabel>AI Intelligence Insights</SectionLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            {AI_INSIGHTS.map((insight) => (
              <div key={insight.id}
                className={cn(
                  'rounded-lg border p-4 space-y-2 relative overflow-hidden',
                  insight.severity === 'critical' ? 'border-danger/40 bg-danger/5' :
                  insight.severity === 'high'     ? 'border-orange-500/40 bg-orange-500/5' :
                  'border-warning/40 bg-warning/5'
                )}>
                {/* Accent stripe */}
                <div className={cn(
                  'absolute left-0 top-0 bottom-0 w-0.5',
                  insight.severity === 'critical' ? 'bg-danger' :
                  insight.severity === 'high' ? 'bg-orange-500' : 'bg-warning'
                )} />
                <div className="flex items-start justify-between gap-2 pl-2">
                  <div className="flex items-center gap-2">
                    <Brain className={cn('size-4 shrink-0',
                      insight.severity === 'critical' ? 'text-danger' :
                      insight.severity === 'high' ? 'text-orange-400' : 'text-warning'
                    )} />
                    <span className="font-bold text-foreground text-sm">{insight.title}</span>
                  </div>
                  <Badge
                    variant={insight.severity === 'critical' ? 'risk-critical' : insight.severity === 'high' ? 'risk-high' : 'secondary'}
                    size="sm" className="text-[9px] px-1.5 py-0 shrink-0"
                  >
                    {insight.tag}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed pl-2">{insight.detail}</p>
                <div className="flex items-center gap-2 pl-2">
                  <Map className="size-3 text-muted-foreground" />
                  <span className="text-[10px] font-semibold text-muted-foreground">{insight.district}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 7. Anomaly Detection ── */}
        <div>
          <SectionLabel>Anomaly Detection</SectionLabel>
          <Card className="border-border bg-card mt-3">
            <CardHeader className="p-4 pb-2 border-b border-border">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Zap className="size-4 text-warning animate-pulse" />
                Detected Anomalies — Karnataka State
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="text-left p-3 font-bold text-muted-foreground uppercase text-[9px] tracking-wider">District</th>
                    <th className="text-left p-3 font-bold text-muted-foreground uppercase text-[9px] tracking-wider">Anomaly Type</th>
                    <th className="text-center p-3 font-bold text-muted-foreground uppercase text-[9px] tracking-wider">Severity</th>
                    <th className="text-right p-3 font-bold text-muted-foreground uppercase text-[9px] tracking-wider">Δ Change</th>
                    <th className="text-right p-3 font-bold text-muted-foreground uppercase text-[9px] tracking-wider">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {ANOMALIES.map((a, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                      <td className="p-3 font-semibold text-foreground">{a.district}</td>
                      <td className="p-3 text-muted-foreground">{a.type}</td>
                      <td className="p-3 text-center">
                        <Badge
                          variant={a.severity === 'critical' ? 'risk-critical' : a.severity === 'high' ? 'risk-high' : 'risk-medium'}
                          size="sm" className="text-[9px] px-1.5 py-0"
                        >{a.severity}</Badge>
                      </td>
                      <td className="p-3 text-right font-bold font-data text-danger">{a.delta}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-14 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${a.confidence}%` }} />
                          </div>
                          <span className="font-data font-bold text-foreground w-8 text-right">{a.confidence}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {/* ── 8. Correlation Analysis ── */}
        <div>
          <SectionLabel>Correlation Analysis — Time of Day × Crime Type</SectionLabel>
          <Card className="border-border bg-card mt-3">
            <CardHeader className="p-4 pb-2 border-b border-border">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Eye className="size-4 text-primary" />
                Crime–Time Correlation Heatmap
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-3 overflow-x-auto">
              <div className="inline-block min-w-full">
                {/* Column headers */}
                <div className="flex gap-1 mb-1 ml-16">
                  {CORRELATION_TYPES.map(t => (
                    <div key={t} className="w-16 text-[9px] font-bold text-muted-foreground text-center truncate uppercase tracking-wide">{t}</div>
                  ))}
                </div>
                {/* Rows */}
                {CORRELATION_TIMES.map((time, ri) => (
                  <div key={time} className="flex gap-1 mb-1 items-center">
                    <div className="w-14 text-[9px] font-bold text-muted-foreground text-right pr-2 uppercase tracking-wide shrink-0">{time}</div>
                    {CORRELATION_MATRIX[ri].map((val, ci) => (
                      <div key={ci}
                        className={cn('w-16 h-10 rounded flex items-center justify-center text-[11px] font-bold transition-all hover:scale-105 cursor-default', HEAT_PALETTE(val))}>
                        {val}
                      </div>
                    ))}
                  </div>
                ))}
                {/* Legend */}
                <div className="flex items-center gap-2 mt-3 ml-16">
                  <span className="text-[9px] text-muted-foreground">Low</span>
                  {[1, 3, 5, 7, 9].map(v => (
                    <div key={v} className={cn('w-6 h-3 rounded-sm', HEAT_PALETTE(v))} />
                  ))}
                  <span className="text-[9px] text-muted-foreground">High</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── 9. Incident Intelligence Table ── */}
        <div>
          <SectionLabel>Incident Intelligence Table</SectionLabel>
          <Card className="border-border bg-card mt-3">
            <CardHeader className="p-4 pb-2 border-b border-border flex flex-row items-center justify-between gap-3">
              <CardTitle className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <AlertTriangle className="size-4 text-warning" />
                Active & Investigating Incidents
              </CardTitle>
              <div className="relative flex items-center min-w-[220px]">
                <Search className="size-3.5 absolute left-2.5 text-muted-foreground" />
                <Input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search case ID, type, district…" className="h-8 pl-8 text-xs" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="text-left p-3 font-bold text-muted-foreground uppercase text-[9px] tracking-wider">Case ID</th>
                    <th className="text-left p-3 font-bold text-muted-foreground uppercase text-[9px] tracking-wider">Crime Type</th>
                    <th className="text-left p-3 font-bold text-muted-foreground uppercase text-[9px] tracking-wider">District</th>
                    <th className="text-right p-3 font-bold text-muted-foreground uppercase text-[9px] tracking-wider">Risk Score</th>
                    <th className="text-center p-3 font-bold text-muted-foreground uppercase text-[9px] tracking-wider">Severity</th>
                    <th className="text-center p-3 font-bold text-muted-foreground uppercase text-[9px] tracking-wider">Status</th>
                    <th className="text-right p-3 font-bold text-muted-foreground uppercase text-[9px] tracking-wider">Date</th>
                    <th className="text-center p-3 font-bold text-muted-foreground uppercase text-[9px] tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIncidents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground text-xs">
                        No incidents match the current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredIncidents.map((inc) => (
                      <tr key={inc.id} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                        <td className="p-3 font-data font-bold text-primary">{inc.id}</td>
                        <td className="p-3 text-foreground">{inc.type}</td>
                        <td className="p-3 text-muted-foreground">{inc.district}</td>
                        <td className="p-3 text-right">
                          <span className={cn('font-data font-bold', inc.riskScore >= 80 ? 'text-danger' : inc.riskScore >= 60 ? 'text-orange-400' : 'text-foreground')}>
                            {inc.riskScore}
                          </span>
                        </td>
                        <td className="p-3 text-center"><RiskBadge score={inc.riskScore} /></td>
                        <td className="p-3 text-center">
                          <Badge
                            variant={inc.status === 'open' ? 'risk-high' : inc.status === 'investigating' ? 'warning' : 'success'}
                            dot size="sm" className="text-[9px] px-1.5 py-0 capitalize"
                          >{inc.status}</Badge>
                        </td>
                        <td className="p-3 text-right font-data text-muted-foreground">{inc.date}</td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[9px] gap-1">
                              <Eye className="size-3" />View
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

      </div>
    </DashboardLayout>
  );
}
