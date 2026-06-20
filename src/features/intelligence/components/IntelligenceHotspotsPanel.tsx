/**
 * IntelligenceHotspotsPanel — Heatmap sidebar panel.
 *
 * Groups OSINT news articles by district to show risk contributors, threat types,
 * and article counts. Provides a control toggle for the intelligence overlay.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Typography } from '@/components/atoms/Typography';
import { Badge } from '@/components/atoms/Badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Flame, ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { useIntelligence } from '../hooks/useIntelligence';

interface IntelligenceHotspotsPanelProps {
  showIntelOverlay: boolean;
  onIntelOverlayChange: (show: boolean) => void;
}

export function IntelligenceHotspotsPanel({
  showIntelOverlay,
  onIntelOverlayChange,
}: IntelligenceHotspotsPanelProps) {
  const { districtSummaries, isLoading, isAvailable } = useIntelligence();
  const [expandedDistrict, setExpandedDistrict] = useState<string | null>(null);

  const toggleExpandDistrict = (districtName: string) => {
    setExpandedDistrict(prev => (prev === districtName ? null : districtName));
  };

  if (isLoading) {
    return (
      <Card className="border border-border/60 bg-card/60 animate-pulse">
        <CardHeader className="pb-3">
          <div className="h-4 w-28 bg-muted rounded" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 bg-muted rounded" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!isAvailable) {
    return (
      <Card className="border border-border/40 bg-card/20">
        <CardContent className="py-4 text-center text-xs text-muted-foreground">
          Intelligence Hotspots data offline — ensure the Flask news backend is active
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="intel-card border border-border shadow-md mt-4 intel-animate-in">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <Flame className="h-4 w-4 text-warning" />
            Intelligence Hotspots
          </CardTitle>
          <div className="flex items-center gap-2">
            <label htmlFor="intel-overlay" className="text-[10px] font-bold text-foreground cursor-pointer">
              Overlay Map
            </label>
            <Switch
              id="intel-overlay"
              checked={showIntelOverlay}
              onCheckedChange={onIntelOverlayChange}
            />
          </div>
        </div>
        <Typography variant="caption" color="muted" className="mt-0.5 block">
          District-level risk weights synthesized from Open Source Intelligence (OSINT).
        </Typography>
      </CardHeader>

      <Separator className="bg-border/40 my-2" />

      <CardContent className="p-3 pt-0 max-h-[300px] overflow-y-auto space-y-2">
        {districtSummaries.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground text-xs">
            No district-level intelligence found
          </div>
        ) : (
          districtSummaries.map((summary) => {
            const isExpanded = expandedDistrict === summary.district;
            const progressWidth = `${Math.min(100, Math.max(10, summary.riskContribution * 5))}%`;

            return (
              <div
                key={summary.district}
                className="border border-border/40 rounded-md bg-background/30 p-2 text-xs transition-colors hover:bg-background/60"
              >
                {/* Header Row */}
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => toggleExpandDistrict(summary.district)}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <MapPin className="h-3 w-3 text-primary shrink-0" />
                    <span className="font-bold text-foreground truncate">{summary.district}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary" size="sm" className="text-[9px] font-data">
                      {summary.articleCount} sources
                    </Badge>
                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </div>
                </div>

                {/* Risk Bar / Details */}
                <div className="mt-1.5 space-y-1">
                  <div className="flex justify-between items-center text-[9px] text-muted-foreground">
                    <span>Threat: <strong className="text-foreground/80">{summary.highestThreat}</strong></span>
                    <span>Risk Weight: <strong className="text-warning font-data">+{summary.riskContribution}%</strong></span>
                  </div>
                  <div className="w-full bg-muted/60 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-warning to-danger h-full rounded-full transition-all duration-300"
                      style={{ width: progressWidth }}
                    />
                  </div>
                </div>

                {/* Collapsible Article List */}
                {isExpanded && (
                  <div className="mt-2 pt-2 border-t border-border/30 space-y-1.5 pl-1.5">
                    <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                      OSINT Citations
                    </div>
                    {summary.articles.map((art) => (
                      <div key={art.id} className="text-[10px] space-y-0.5 border-l border-primary/20 pl-2 py-0.5">
                        <a
                          href={art.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-foreground hover:text-primary transition-colors line-clamp-1"
                        >
                          {art.title}
                        </a>
                        <div className="text-[8px] text-muted-foreground">
                          {art.source.replace(/_/g, ' ')} · {new Date(art.published).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
