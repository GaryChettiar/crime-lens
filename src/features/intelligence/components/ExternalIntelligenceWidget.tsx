/**
 * ExternalIntelligenceWidget — Dashboard integration component.
 *
 * Displays the latest 5 intelligence articles in a premium glassmorphism
 * card, with severity indicators, live feed pulse, and CSV export action.
 * Placed on the Dashboard between KPI cards and the geospatial workspace.
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/atoms/Badge';
import { Typography } from '@/components/atoms/Typography';
import { Separator } from '@/components/ui/separator';
import { Satellite, Download, RefreshCw, AlertTriangle } from 'lucide-react';
import { useIntelligence } from '../hooks/useIntelligence';
import { useTriggerScrapeMutation, getExportUrl } from '@/services/newsApi';
import { NewsMentionCard } from './NewsMentionCard';

export function ExternalIntelligenceWidget() {
  const { classifiedArticles, isLoading, isAvailable, totalArticles } =
    useIntelligence({ limit: 5 });

  const [triggerScrape, { isLoading: isScraping }] = useTriggerScrapeMutation();

  const criticalCount = useMemo(
    () => classifiedArticles.filter((a) => a.severity === 'critical').length,
    [classifiedArticles],
  );

  // Loading skeleton
  if (isLoading) {
    return (
      <Card className="border border-border bg-card/60 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-muted animate-pulse" />
            <div className="h-4 w-32 rounded bg-muted animate-pulse" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="h-2 w-2 rounded-full bg-muted animate-pulse mt-1.5" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-full rounded bg-muted animate-pulse" />
                <div className="h-2.5 w-2/3 rounded bg-muted animate-pulse" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Backend unavailable state
  if (!isAvailable && !isLoading) {
    return (
      <Card className="border border-border/60 bg-card/40 backdrop-blur-sm">
        <CardContent className="py-6 flex flex-col items-center justify-center text-center space-y-2">
          <AlertTriangle className="h-6 w-6 text-warning/60" />
          <Typography variant="body-sm" color="muted" className="text-xs">
            Intelligence feed offline — ensure the news backend is running on port 5000
          </Typography>
          <Button
            variant="outline"
            size="sm"
            onClick={() => triggerScrape()}
            disabled={isScraping}
            className="text-[10px] h-7 mt-1"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isScraping ? 'animate-spin' : ''}`} />
            Retry Connection
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="intel-card border border-border shadow-md intel-animate-in">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-bold">
            <div className="p-1.5 bg-primary/10 rounded-md">
              <Satellite className="h-4 w-4 text-primary" />
            </div>
            <span>Latest Intelligence</span>
            <div className="intel-live-indicator ml-1">
              <div className="intel-live-dot" />
              <span className="text-[9px] font-bold text-success uppercase tracking-wider">
                Live
              </span>
            </div>
          </CardTitle>

          <div className="flex items-center gap-2">
            {criticalCount > 0 && (
              <Badge
                variant="risk-critical"
                size="sm"
                className="text-[9px] font-bold animate-pulse"
              >
                {criticalCount} Critical
              </Badge>
            )}
            <Badge variant="outline" size="sm" className="text-[9px] font-data">
              {totalArticles} Sources
            </Badge>
          </div>
        </div>
      </CardHeader>

      <Separator className="bg-border/40" />

      <CardContent className="p-0">
        <div className="intel-stagger">
          {classifiedArticles.map((article) => (
            <NewsMentionCard key={article.id} article={article} />
          ))}
        </div>

        {classifiedArticles.length === 0 && (
          <div className="py-8 text-center text-muted-foreground text-xs">
            No intelligence articles available
          </div>
        )}
      </CardContent>

      <Separator className="bg-border/40" />

      {/* Actions footer */}
      <div className="px-4 py-2.5 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => triggerScrape()}
          disabled={isScraping}
          className="text-[10px] h-7 text-muted-foreground hover:text-foreground px-2"
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${isScraping ? 'animate-spin' : ''}`} />
          {isScraping ? 'Scanning...' : 'Refresh Feed'}
        </Button>

        <a href={getExportUrl()} download>
          <Button
            variant="outline"
            size="sm"
            className="text-[10px] h-7 px-2.5 font-semibold"
          >
            <Download className="h-3 w-3 mr-1" />
            Export Intelligence Feed
          </Button>
        </a>
      </div>
    </Card>
  );
}
