import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/templates/DashboardLayout';
import { Typography } from '@/components/atoms/Typography';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ShieldAlert, Info, MapPin } from 'lucide-react';
import { useIntelligence, RiskDriversCard, computeIntelligenceScore } from '@/features/intelligence';

// District mock metrics (historical & forecasts)
const DISTRICT_BASE_METRICS: Record<string, { historical: number; forecast: number; crowd: number }> = {
  'Bengaluru Urban': { historical: 78, forecast: 85, crowd: 65 },
  'Mysuru': { historical: 54, forecast: 48, crowd: 40 },
  'Belagavi': { historical: 48, forecast: 62, crowd: 35 },
  'Dakshina Kannada': { historical: 62, forecast: 55, crowd: 50 },
  'Hubballi-Dharwad': { historical: 58, forecast: 52, crowd: 30 },
  'Kalaburagi': { historical: 50, forecast: 42, crowd: 45 },
  'Ballari': { historical: 45, forecast: 48, crowd: 25 },
  'Tumakuru': { historical: 38, forecast: 35, crowd: 20 },
  'Shivamogga': { historical: 42, forecast: 50, crowd: 30 },
};

export function RiskPage() {
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const { classifiedArticles, isAvailable } = useIntelligence();

  // Compute full table dataset by blending base metrics with dynamic OSINT scores
  const tableData = useMemo(() => {
    return Object.entries(DISTRICT_BASE_METRICS).map(([district, metrics]) => {
      // Calculate real intelligence score from RSS articles
      const intelScore = computeIntelligenceScore(classifiedArticles, district);

      // Composite calculation (35% Historical + 25% Forecast + 20% Intel + 20% Crowd)
      const compositeScore = Math.round(
        metrics.historical * 0.35 +
        metrics.forecast * 0.25 +
        intelScore * 0.20 +
        metrics.crowd * 0.20
      );

      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (compositeScore >= 75) riskLevel = 'critical';
      else if (compositeScore >= 50) riskLevel = 'high';
      else if (compositeScore >= 30) riskLevel = 'medium';

      return {
        district,
        historical: metrics.historical,
        forecast: metrics.forecast,
        crowd: metrics.crowd,
        intel: intelScore,
        composite: compositeScore,
        riskLevel,
      };
    }).sort((a, b) => b.composite - a.composite);
  }, [classifiedArticles]);

  const selectedMetrics = useMemo(() => {
    if (selectedDistrict === 'all') {
      return {
        historical: 55,
        forecast: 53,
        crowd: 38,
      };
    }
    const base = DISTRICT_BASE_METRICS[selectedDistrict];
    return base || { historical: 40, forecast: 40, crowd: 30 };
  }, [selectedDistrict]);

  const getRiskLevelBadge = (level: 'low' | 'medium' | 'high' | 'critical') => {
    switch (level) {
      case 'critical':
        return <Badge variant="risk-critical" size="sm">Critical</Badge>;
      case 'high':
        return <Badge variant="risk-high" size="sm">High</Badge>;
      case 'medium':
        return <Badge variant="risk-medium" size="sm">Medium</Badge>;
      case 'low':
      default:
        return <Badge variant="risk-low" size="sm">Low</Badge>;
    }
  };

  return (
    <DashboardLayout title="Risk Assessment">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header Title Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-border gap-4">
          <div>
            <Typography variant="heading-xl" as="h1" className="font-bold text-foreground">
              Strategic Risk & Safety Index
            </Typography>
            <Typography variant="body-sm" color="muted" className="mt-1 flex items-center gap-1.5">
              <Badge variant="outline" className="text-warning border-warning/20 bg-warning/5 font-semibold">Active OSINT Enrichment</Badge>
              Sector-by-sector composite risk metrics synthesizing historical caseloads, forecast models, and real-time open source news reports.
            </Typography>
          </div>
          {selectedDistrict !== 'all' && (
            <Button
              onClick={() => setSelectedDistrict('all')}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              Reset to All Districts
            </Button>
          )}
        </div>

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* LEFT: Sector Safety Matrix (2/3 width) */}
          <Card className="lg:col-span-2 bg-card/45 border-border/80 backdrop-blur-sm shadow-md overflow-hidden">
            <CardHeader className="p-4 border-b border-border bg-card/20 flex flex-row items-center justify-between shrink-0">
              <div>
                <CardTitle className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-danger animate-pulse" />
                  Sector Safety Matrix
                </CardTitle>
                <CardDescription className="text-[11px] mt-0.5">Click on a sector row to view localized driver details.</CardDescription>
              </div>
              {!isAvailable && (
                <Badge variant="outline" className="text-warning/60 border-warning/20 bg-warning/5 text-[9px] uppercase tracking-wider font-bold">
                  OSINT Offline
                </Badge>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-950/40">
                    <TableRow className="border-b border-border/50 hover:bg-transparent">
                      <TableHead className="text-[10px] uppercase font-bold tracking-wider py-3 pl-4">District Sector</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold tracking-wider text-center py-3">Historical</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold tracking-wider text-center py-3">Forecast</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold tracking-wider text-center py-3 text-warning font-semibold">OSINT Intel</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold tracking-wider text-center py-3">Composite</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold tracking-wider text-right py-3 pr-4">Threat Level</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableData.map((row) => {
                      const isSelected = selectedDistrict === row.district;
                      return (
                        <TableRow
                          key={row.district}
                          onClick={() => setSelectedDistrict(row.district)}
                          className={`border-b border-border/40 transition-colors cursor-pointer hover:bg-muted/15 ${
                            isSelected ? 'bg-primary/5 hover:bg-primary/10 border-l-2 border-l-primary' : ''
                          }`}
                        >
                          <TableCell className="font-semibold text-xs py-3 pl-4 flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            {row.district}
                          </TableCell>
                          <TableCell className="text-center font-data text-xs py-3 text-muted-foreground">{row.historical}</TableCell>
                          <TableCell className="text-center font-data text-xs py-3 text-muted-foreground">{row.forecast}</TableCell>
                          <TableCell className="text-center font-data text-xs py-3 font-semibold text-warning">{row.intel}</TableCell>
                          <TableCell className="text-center font-data text-xs py-3 font-black text-foreground">{row.composite}</TableCell>
                          <TableCell className="text-right py-3 pr-4">{getRiskLevelBadge(row.riskLevel)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* RIGHT: Selected Risk Drivers (1/3 width) */}
          <div className="lg:col-span-1 space-y-4">
            <RiskDriversCard
              selectedDistrict={selectedDistrict}
              historicalScore={selectedMetrics.historical}
              forecastScore={selectedMetrics.forecast}
              crowdScore={selectedMetrics.crowd}
            />

            <Card className="bg-card/45 border-border/80 backdrop-blur-sm p-4 text-xs space-y-2">
              <Typography variant="body-sm" className="font-bold text-foreground flex items-center gap-1">
                <Info className="h-3.5 w-3.5 text-primary" />
                Strategic Weighting Guide
              </Typography>
              <Typography variant="caption" color="muted" className="leading-relaxed">
                CrimeLens calculates threats by blending local records with live indicators. 
                <strong className="text-foreground"> OSINT News Intelligence (20%)</strong> functions as an early-warning signal, raising district alert states ahead of official police reporting pipelines.
              </Typography>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
export default RiskPage;
