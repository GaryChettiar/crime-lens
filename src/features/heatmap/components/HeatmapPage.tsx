import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { DashboardLayout } from '@/components/templates/DashboardLayout';
import { Typography } from '@/components/atoms/Typography';
import { GeospatialMapContainer } from '@/features/geospatial';
import { HotspotControlPanel, type MapLayerConfig } from '@/components/organisms/HotspotControlPanel';
import { useGetFestivalEventsQuery } from '@/services/riskApi';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/atoms/Badge';
import { Separator } from '@/components/ui/separator';
import { setDistrict } from '@/store/slices/globalFiltersSlice';
import { Flame, Users, Calendar, Shield, AlertTriangle } from 'lucide-react';
import { IntelligenceHotspotsPanel } from '@/features/intelligence';

export function HeatmapPage() {
  const dispatch = useAppDispatch();
  const globalFilters = useAppSelector((state) => state.globalFilters);

  const { data: festivalEvents = [], isLoading: isLoadingEvents } = useGetFestivalEventsQuery();

  const [mapConfig, setMapConfig] = useState<MapLayerConfig>({
    showHeatmap: true,
    showClusters: true,
    showPredictions: false,
    radius: 150,
    minIntensity: 30,
    timeRange: '30d',
  });
  const [showIntelHotspots, setShowIntelHotspots] = useState(true);

  const selectedDistrict = globalFilters.district || 'all';

  const handleDistrictChange = (dist: string) => {
    dispatch(setDistrict(dist === 'all' ? null : dist));
  };

  // Filter events based on active global district filter
  const filteredEvents = festivalEvents.filter((evt) => {
    if (globalFilters.district && evt.district.toLowerCase() !== globalFilters.district.toLowerCase()) {
      return false;
    }
    return true;
  });

  // Calculate police resource requirement based on crowd size and risk level
  const getResourceRequirement = (attendance: number, risk: string) => {
    if (attendance >= 300000 || risk === 'critical') {
      return { count: "650 Officers + Rapid Action force", level: "Maximum Deployment" };
    }
    if (attendance >= 150000 || risk === 'high') {
      return { count: "300 Officers + Anti-Sabotage Teams", level: "High Alert Deployment" };
    }
    if (attendance >= 50000) {
      return { count: "120 Patrol Personnel", level: "Standard Presence" };
    }
    return { count: "45 Local Officers", level: "Routine Patrol" };
  };

  return (
    <DashboardLayout title="Heatmap Mapping">
      <div className="space-y-6 mx-auto">
        <div className="pb-4 border-b border-border flex justify-between items-end">
          <div>
            <Typography variant="heading-xl" as="h1" className="font-bold text-foreground">
              Geographic Density & Hotspots
            </Typography>
            <Typography variant="body-sm" color="muted" className="mt-1">
              Real-time geospatial plotting of historical incidents, public festivals, and forecast ranges.
            </Typography>
          </div>
          {globalFilters.district && (
            <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary capitalize font-bold font-sans">
              Filtered: {globalFilters.district}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Map Section */}
          <div className="lg:col-span-8 xl:col-span-9">
            <GeospatialMapContainer
              selectedDistrict={selectedDistrict}
              onDistrictChange={handleDistrictChange}
              showHeatmap={mapConfig.showHeatmap}
              showClusters={mapConfig.showClusters}
              showPredictions={mapConfig.showPredictions}
              showIntelHotspots={showIntelHotspots}
              heatmapRadius={mapConfig.radius / 5}
            />
          </div>

          {/* Sidebar Section */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-5">
            <HotspotControlPanel
              config={mapConfig}
              onConfigChange={setMapConfig}
              title="Hotspot Filters"
            />

            <IntelligenceHotspotsPanel
              showIntelOverlay={showIntelHotspots}
              onIntelOverlayChange={setShowIntelHotspots}
            />

            {/* Event Intelligence Panel */}
            <Card className="bg-card border border-border shadow-md">
              <div className="p-3.5 border-b border-border/60 flex items-center justify-between">
                <span className="font-bold text-xs uppercase text-foreground tracking-wider flex items-center gap-1.5">
                  <Flame className="h-4 w-4 text-amber-500 animate-pulse" />
                  Event Intelligence Panel
                </span>
                <Badge variant="outline" size="sm" className="bg-slate-900/50 py-0 text-[10px]">
                  {filteredEvents.length} Active
                </Badge>
              </div>
              <CardContent className="p-3.5 space-y-4 max-h-[350px] overflow-y-auto">
                {isLoadingEvents ? (
                  <div className="flex flex-col items-center justify-center py-6 text-muted-foreground text-xs space-y-2">
                    <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    <span>Loading events database...</span>
                  </div>
                ) : filteredEvents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-xs leading-normal">
                    No public festivals or mass events recorded in {globalFilters.district || 'this district'}.
                  </div>
                ) : (
                  filteredEvents.map((evt) => {
                    const resource = getResourceRequirement(evt.expectedAttendance, evt.riskLevel);
                    return (
                      <div key={evt.id} className="border border-border/40 bg-muted/10 hover:bg-muted/20 p-2.5 rounded-lg space-y-2 transition-all">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="font-bold text-xs text-foreground block leading-tight">{evt.name}</span>
                            <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider block mt-0.5">{evt.type} Event</span>
                          </div>
                          <Badge
                            variant={
                              evt.riskLevel === 'critical' ? 'risk-critical' :
                              evt.riskLevel === 'high' ? 'risk-high' : 'secondary'
                            }
                            size="sm"
                            className="scale-90"
                          >
                            {evt.riskLevel}
                          </Badge>
                        </div>

                        <Separator className="bg-border/30" />

                        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[10px]">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Users className="h-3 w-3 shrink-0" />
                            <span>Crowd: <strong className="text-foreground font-data">{evt.expectedAttendance.toLocaleString()}</strong></span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground truncate">
                            <Calendar className="h-3 w-3 shrink-0" />
                            <span>District: <strong className="text-foreground capitalize">{evt.district}</strong></span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground col-span-2">
                            <Shield className="h-3 w-3 text-primary shrink-0" />
                            <span className="truncate">Police Force: <strong className="text-foreground">{resource.count}</strong></span>
                          </div>
                        </div>

                        {/* Event Crime Correlation details */}
                        <div className="bg-slate-950/70 p-2 rounded border border-border/30 text-[9px] space-y-1.5">
                          <div className="flex justify-between items-center text-muted-foreground border-b border-border/20 pb-1 font-semibold">
                            <span className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3 text-amber-500" />
                              Historical Correlation Spikes
                            </span>
                            <span className="text-danger font-bold">Risk Score: {evt.predictedRiskScore}%</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground font-medium">
                            <span>Theft Surge: <strong className="text-danger font-data">+{evt.historicalTheftIncrease}%</strong></span>
                            <span>Assault Surge: <strong className="text-danger font-data">+{evt.historicalAssaultIncrease}%</strong></span>
                          </div>
                          <div className="text-muted-foreground text-[8px] leading-relaxed pt-0.5">
                            *Modus Operandi aligns with transient crowds. Increase patrols in transit corridors.
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default HeatmapPage;
