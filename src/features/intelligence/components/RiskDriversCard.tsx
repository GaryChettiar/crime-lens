/**
 * RiskDriversCard — Sidebar card for the Risk page.
 *
 * Shows the composite risk calculation for a selected zone or district,
 * displaying how historical incidents, predictive forecasts, event crowd factors,
 * and real-time external intelligence (OSINT news) contribute to the threat level.
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Typography } from '@/components/atoms/Typography';
import { Badge } from '@/components/atoms/Badge';
import { Info, Shield, Calendar, Users, Radio, ArrowRight } from 'lucide-react';
import { useIntelligence } from '../hooks/useIntelligence';
import { computeIntelligenceScore } from '../utils/intelligenceUtils';
import { NewsMentionCard } from './NewsMentionCard';

interface RiskDriversCardProps {
  selectedDistrict: string;
  historicalScore?: number;
  forecastScore?: number;
  crowdScore?: number;
}

export function RiskDriversCard({
  selectedDistrict,
  historicalScore = 42,
  forecastScore = 58,
  crowdScore = 30,
}: RiskDriversCardProps) {
  const { classifiedArticles } = useIntelligence();

  // Compute intelligence score for the selected district
  const intelScore = useMemo(() => {
    if (selectedDistrict === 'all') {
      // average intel score across all active districts, or overall
      const districts = Array.from(new Set(classifiedArticles.flatMap((a) => a.districts)));
      if (districts.length === 0) return 0;
      const scores = districts.map((d) => computeIntelligenceScore(classifiedArticles, d));
      return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }
    return computeIntelligenceScore(classifiedArticles, selectedDistrict);
  }, [classifiedArticles, selectedDistrict]);

  // Compute composite risk score:
  // Historical Incidents: 35%
  // Predictive Forecasts: 25%
  // External Intelligence: 20%
  // Event/Crowd Factors: 20%
  const compositeScore = useMemo(() => {
    const historicalContribution = historicalScore * 0.35;
    const forecastContribution = forecastScore * 0.25;
    const intelContribution = intelScore * 0.20;
    const crowdContribution = crowdScore * 0.20;

    return Math.round(
      historicalContribution +
      forecastContribution +
      intelContribution +
      crowdContribution
    );
  }, [historicalScore, forecastScore, intelScore, crowdScore]);

  const getRiskLevel = (score: number) => {
    if (score >= 75) return { label: 'CRITICAL', variant: 'risk-critical' as const };
    if (score >= 50) return { label: 'HIGH', variant: 'risk-high' as const };
    if (score >= 30) return { label: 'MEDIUM', variant: 'risk-medium' as const };
    return { label: 'LOW', variant: 'risk-low' as const };
  };

  const riskLevel = getRiskLevel(compositeScore);

  // Filter articles for this district
  const districtArticles = useMemo(() => {
    if (selectedDistrict === 'all') return classifiedArticles.slice(0, 3);
    return classifiedArticles.filter((a) =>
      a.districts.some((d) => d.toLowerCase() === selectedDistrict.toLowerCase())
    ).slice(0, 3);
  }, [classifiedArticles, selectedDistrict]);

  return (
    <Card className="intel-card border border-border shadow-md intel-animate-in">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-bold">
            <Info className="h-4 w-4 text-primary animate-pulse" />
            <span>Risk Driver Breakdown</span>
          </CardTitle>
          <Badge variant={riskLevel.variant} size="sm" className="font-bold">
            {riskLevel.label}
          </Badge>
        </div>
        <Typography variant="caption" color="muted" className="mt-0.5 block">
          Composite score synthesized for: <strong className="text-foreground">{selectedDistrict === 'all' ? 'Karnataka (All)' : selectedDistrict}</strong>
        </Typography>
      </CardHeader>

      <Separator className="bg-border/40 my-2" />

      <CardContent className="p-4 pt-1 space-y-4">
        {/* Composite Risk Gauge */}
        <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-background/40 border border-border/40 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-success via-warning to-danger" />
          <Typography variant="caption" color="muted" className="font-bold uppercase tracking-wider text-[9px]">
            Composite Threat Index
          </Typography>
          <span className="text-3xl font-black font-data text-foreground my-1">
            {compositeScore}
            <span className="text-xs text-muted-foreground font-normal">/100</span>
          </span>
          <Typography variant="caption" color="muted" className="text-[10px]">
            Calculated across historical, predictive, crowd, and OSINT vectors.
          </Typography>
        </div>

        {/* Drivers Progress */}
        <div className="space-y-3">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Risk Factor Allocations
          </div>

          {/* Historical Incidents */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                Historical Incidents (35%)
              </span>
              <span className="font-data font-bold text-foreground">{historicalScore}</span>
            </div>
            <div className="w-full bg-muted/40 h-1.5 rounded-full overflow-hidden">
              <div className="bg-primary h-full" style={{ width: `${historicalScore}%` }} />
            </div>
          </div>

          {/* Predictive Forecasts */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                Predictive Forecasts (25%)
              </span>
              <span className="font-data font-bold text-foreground">{forecastScore}</span>
            </div>
            <div className="w-full bg-muted/40 h-1.5 rounded-full overflow-hidden">
              <div className="bg-info h-full" style={{ width: `${forecastScore}%` }} />
            </div>
          </div>

          {/* External Intelligence (OSINT) */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-foreground">
                <Radio className="h-3.5 w-3.5 text-warning animate-pulse" />
                External OSINT Intel (20%)
              </span>
              <span className="font-data font-black text-warning">{intelScore}</span>
            </div>
            <div className="w-full bg-muted/40 h-1.5 rounded-full overflow-hidden">
              <div className="bg-warning h-full" style={{ width: `${intelScore}%` }} />
            </div>
          </div>

          {/* Crowd / Event Factors */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                Crowd & Event Factors (20%)
              </span>
              <span className="font-data font-bold text-foreground">{crowdScore}</span>
            </div>
            <div className="w-full bg-muted/40 h-1.5 rounded-full overflow-hidden">
              <div className="bg-success h-full" style={{ width: `${crowdScore}%` }} />
            </div>
          </div>
        </div>

        {/* Contributing OSINT Articles */}
        {districtArticles.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-border/30">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>Related News Intel</span>
              <span className="text-[9px] font-medium text-primary flex items-center gap-0.5">
                OSINT Feed <ArrowRight className="h-2.5 w-2.5" />
              </span>
            </div>
            <div className="space-y-2">
              {districtArticles.map((art) => (
                <NewsMentionCard key={art.id} article={art} compact className="border border-border/35 p-1.5 rounded bg-background/20" />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
