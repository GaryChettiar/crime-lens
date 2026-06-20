import * as React from 'react';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap, Marker, Popup, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { useIntelligence } from '@/features/intelligence';
import { KarnatakaChoroplethMap } from './KarnatakaChoroplethMap';
import { CrimeHeatmap } from './CrimeHeatmap';
import { CrimeClusterMap } from './CrimeClusterMap';
import { RiskForecastMap } from './RiskForecastMap';
import { TemporalCrimePlayback } from './TemporalCrimePlayback';
import {
  useGetDistrictsQuery,
  useGetIncidentsQuery,
  useGetRiskForecastsQuery,
  useGetFestivalEventsQuery,
} from '@/services/geospatialApi';
import { DISTRICT_CENTERS } from '../data/mockGeospatialData';
import policeStationsData from '../data/police_stations.geojson';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Typography } from '@/components/atoms/Typography';
import { ArrowLeft, Layers } from 'lucide-react';
import { Icon } from '@/components/atoms/Icon';
import { Badge } from '@/components/atoms/Badge';
import { Separator } from '@/components/ui/separator';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setDistrict } from '@/store/slices/globalFiltersSlice';
import { cn } from '@/lib/utils';

export interface GeospatialMapContainerProps {
  selectedDistrict: string;
  onDistrictChange?: (district: string) => void;
  // Controls configuration
  showHeatmap: boolean;
  showClusters: boolean;
  showPredictions: boolean;
  showIntelHotspots?: boolean;
  heatmapRadius: number;
  className?: string;
}

// Custom Leaflet DivIcon creator for festival events
const createFestivalIcon = (risk: string) => {
  const color =
    risk === 'critical' ? '#EF4444' :
    risk === 'high' ? '#F59E0B' :
    risk === 'medium' ? '#3B82F6' : '#10B981';
    
  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2.5px solid #ffffff; box-shadow: 0 0 10px ${color}; animation: pulse-animation 1.5s infinite;"></div>`,
    className: 'festival-map-marker',
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
};

// Controller to handle programmatic zoom resetting
function MapController({ selectedDistrict }: { selectedDistrict: string }) {
  const map = useMap();
  
  useEffect(() => {
    if (selectedDistrict === 'all' || !selectedDistrict) {
      map.setView([15.3173, 75.7139], 7);
    } else {
      // Find coordinates for selected district
      const match = Object.entries(DISTRICT_CENTERS).find(
        ([name]) => name.toLowerCase() === selectedDistrict.toLowerCase()
      );
      if (match) {
        map.setView(match[1], 9);
      }
    }
  }, [selectedDistrict, map]);

  return null;
}



/**
 * GeospatialMapContainer Organism
 * Wraps Leaflet, Choropleths, Heatmaps, Clusters, and Timeline Playback controls.
 * Refactored: Timeline is positioned below the map to prevent overlays.
 */
export function GeospatialMapContainer({
  selectedDistrict,
  onDistrictChange,
  showHeatmap,
  showClusters,
  showPredictions,
  showIntelHotspots = false,
  heatmapRadius,
  className,
}: GeospatialMapContainerProps) {
  const dispatch = useAppDispatch();
  const globalFilters = useAppSelector((state) => state.globalFilters);

  const { districtSummaries } = useIntelligence();
  const { data: districtsMetrics = [] } = useGetDistrictsQuery();
  const { data: incidents = [] } = useGetIncidentsQuery();
  const { data: forecasts = [] } = useGetRiskForecastsQuery();
  const { data: festivalEvents = [] } = useGetFestivalEventsQuery();

  // Playback timeline states
  const [currentDayOffset, setCurrentDayOffset] = useState(30);
  const [timeWindow, setTimeWindow] = useState<number | 'cumulative'>('cumulative');

  // Sync prop changes with Redux if necessary
  const activeDistrict = globalFilters.district || (selectedDistrict !== 'all' ? selectedDistrict : null) || 'all';

  // Local state for toggles
  const [showStations, setShowStations] = useState(true);

  const handleDistrictSelect = (dist: string) => {
    dispatch(setDistrict(dist === 'all' ? null : dist));
    if (onDistrictChange) {
      onDistrictChange(dist);
    }
  };

  const handleBackToState = () => {
    handleDistrictSelect('all');
  };

  // Convert dates for Temporal Timeline Playback
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = new Date().toISOString().split('T')[0];

  // Filter incidents by temporal timeline slider and global filters
  const filteredIncidentsByTimeline = incidents.filter((inc) => {
    const incDate = new Date(inc.timestamp.split(' ')[0]);
    const timelineStart = new Date(startDate);
    const timelineMax = new Date(startDate);
    timelineMax.setDate(timelineMax.getDate() + currentDayOffset);

    let timelineMin = new Date(timelineStart);
    if (timeWindow !== 'cumulative') {
      timelineMin = new Date(timelineMax);
      timelineMin.setDate(timelineMin.getDate() - timeWindow);
    }

    // Temporal window check
    if (incDate < timelineMin || incDate > timelineMax) return false;

    // Redux Global filters
    // 1. District
    if (globalFilters.district && inc.district.toLowerCase() !== globalFilters.district.toLowerCase()) {
      return false;
    }
    // 2. Crime Types
    if (globalFilters.crimeTypes.length > 0 && !globalFilters.crimeTypes.includes(inc.type)) {
      return false;
    }
    // 3. Severities
    if (globalFilters.severities.length > 0 && !globalFilters.severities.includes(inc.severity)) {
      return false;
    }
    // 4. Global Date range filters
    if (globalFilters.dateRange.start) {
      const dStart = new Date(globalFilters.dateRange.start);
      if (incDate < dStart) return false;
    }
    if (globalFilters.dateRange.end) {
      const dEnd = new Date(globalFilters.dateRange.end);
      if (incDate > dEnd) return false;
    }

    return true;
  });

  // Filter festival events overlapping the active playback date ranges
  const activeEvents = festivalEvents.filter((evt) => {
    const evtStart = new Date(evt.startDate);
    const evtEnd = new Date(evt.endDate);
    
    const timelineMax = new Date(startDate);
    timelineMax.setDate(timelineMax.getDate() + currentDayOffset);

    let timelineMin = new Date(startDate);
    if (timeWindow !== 'cumulative') {
      timelineMin = new Date(timelineMax);
      timelineMin.setDate(timelineMin.getDate() - timeWindow);
    }

    // Check overlaps
    const overlaps = evtStart <= timelineMax && evtEnd >= timelineMin;
    const matchesDistrict = !globalFilters.district || evt.district.toLowerCase() === globalFilters.district.toLowerCase();

    return overlaps && matchesDistrict;
  });

  // Format heatmap points format: [lat, lng, intensity]
  const heatmapPoints: [number, number, number][] = filteredIncidentsByTimeline.map((inc) => [
    inc.coordinates[0],
    inc.coordinates[1],
    inc.severity === 'critical' ? 1.0 : inc.severity === 'high' ? 0.75 : inc.severity === 'medium' ? 0.5 : 0.25,
  ]);

  // Compute summary values for the floating district summary card
  const activeSummary = React.useMemo(() => {
    if (activeDistrict === 'all') {
      const totalCrimes = districtsMetrics.reduce((sum, d) => sum + d.crimeCount, 0);
      const avgRisk = districtsMetrics.length > 0
        ? Math.round(districtsMetrics.reduce((sum, d) => sum + d.riskIndex, 0) / districtsMetrics.length)
        : 45;
      return {
        crimeCount: totalCrimes || 800,
        riskScore: avgRisk,
        trend: 'stable',
      };
    } else {
      const match = districtsMetrics.find(d => d.district.toLowerCase() === activeDistrict.toLowerCase());
      return {
        crimeCount: match?.crimeCount ?? 0,
        riskScore: match?.riskIndex ?? 0,
        trend: match?.trend ?? 'stable',
      };
    }
  }, [activeDistrict, districtsMetrics]);

  return (
    <div className={cn("flex flex-col w-full gap-4", className)}>
      {/* ROW 1: Playback Timeline  Slider */}
      <TemporalCrimePlayback
        startDate={startDateStr}
        endDate={endDateStr}
        currentDayOffset={currentDayOffset}
        onDayOffsetChange={setCurrentDayOffset}
        timeWindow={timeWindow}
        onTimeWindowChange={setTimeWindow}
        className="w-full shrink-0 border border-border"
      />
      {/* ROW 2: Map Viewport Container */}

      <div className="relative w-full h-[450px] md:h-[65vh] border border-border rounded-lg overflow-hidden bg-slate-950">
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes pulse-animation {
            0% { transform: scale(0.9); opacity: 0.9; }
            50% { transform: scale(1.15); opacity: 1; box-shadow: 0 0 12px currentColor; }
            100% { transform: scale(0.9); opacity: 0.9; }
          }
        `}} />
        
        <MapContainer
          center={[15.3173, 75.7139]}
          zoom={7}
          minZoom={6}
          maxBounds={[[9.5, 71.0], [23.5, 85.0]]}
          maxBoundsViscosity={1.0}
          className="w-full h-full z-0 outline-none"
          zoomControl={false}
          attributionControl={false}
        >
          <MapController selectedDistrict={activeDistrict} />

          {/* Premium CartoDB Dark Matter tile set */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />

          {/* Choropleth Reference Base Boundaries Layer */}
          <KarnatakaChoroplethMap
            metrics={districtsMetrics}
            selectedDistrict={activeDistrict}
            onDistrictSelect={handleDistrictSelect}
          />

          {/* Density Heatmap Overlay Layer */}
          {showHeatmap && (
            <CrimeHeatmap
              points={heatmapPoints}
              radius={heatmapRadius}
              minOpacity={0.4}
            />
          )}

          {/* Marker Clusters Overlay Layer */}
          {showClusters && (
            <CrimeClusterMap
              incidents={filteredIncidentsByTimeline}
              onIncidentClick={(inc) => {
                console.log('Incident selected:', inc);
              }}
            />
          )}

          {/* AI Risk Forecast Warning Overlays */}
          {showPredictions && (
            <RiskForecastMap forecasts={forecasts} />
          )}

          {/* OSINT External Intelligence Hotspots overlay */}
          {showIntelHotspots &&
            districtSummaries
              .filter((d) => {
                const map: Record<string, string> = {
                  'Bengaluru Urban': 'Bangalore Urban',
                  'Bengaluru Rural': 'Bangalore Rural',
                  'Mysuru': 'Mysore',
                  'Belagavi': 'Belgaum',
                  'Hubballi-Dharwad': 'Dharwad',
                  'Kalaburagi': 'Gulbarga',
                  'Ballari': 'Bellary',
                  'Tumakuru': 'Tumkur',
                  'Shivamogga': 'Shimoga',
                  'Vijayapura': 'Bijapur',
                  'Chamarajanagar': 'Chamarajanagar',
                };
                const key = map[d.district] || d.district;
                return DISTRICT_CENTERS[key] !== undefined;
              })
              .map((summary) => {
                const mapNameMap: Record<string, string> = {
                  'Bengaluru Urban': 'Bangalore Urban',
                  'Bengaluru Rural': 'Bangalore Rural',
                  'Mysuru': 'Mysore',
                  'Belagavi': 'Belgaum',
                  'Hubballi-Dharwad': 'Dharwad',
                  'Kalaburagi': 'Gulbarga',
                  'Ballari': 'Bellary',
                  'Tumakuru': 'Tumkur',
                  'Shivamogga': 'Shimoga',
                  'Vijayapura': 'Bijapur',
                  'Chamarajanagar': 'Chamarajanagar',
                };
                const key = mapNameMap[summary.district] || summary.district;
                const center = DISTRICT_CENTERS[key];
                const radius = Math.max(12, summary.riskContribution * 2.2);
                const color = summary.riskContribution > 12 ? '#EF4444' : '#F59E0B'; // Red for critical, Orange for warning
                
                return (
                  <CircleMarker
                    key={`intel-hotspot-${summary.district}`}
                    center={center}
                    radius={radius}
                    pathOptions={{
                      fillColor: color,
                      color: color,
                      weight: 1.5,
                      fillOpacity: 0.35,
                      dashArray: '3, 4',
                    }}
                  >
                    <Popup>
                      <div className="p-1 text-slate-200 min-w-[150px] font-sans">
                        <div className="font-bold text-xs text-foreground flex items-center gap-1.5 mb-1.5 text-slate-100">
                          <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: color }} />
                          {summary.district} OSINT Threat
                        </div>
                        <div className="space-y-1 text-[10px] text-slate-300">
                          <div>Threat Category: <span className="font-semibold text-foreground text-slate-100">{summary.highestThreat}</span></div>
                          <div>Active Sources: <span className="font-semibold text-foreground font-data text-slate-100">{summary.articleCount} reports</span></div>
                          <div>OSINT Index Contribution: <span className="font-bold font-data text-slate-100" style={{ color: color }}>+{summary.riskContribution}%</span></div>
                          <div className="border-t border-slate-700/50 pt-1 mt-1 text-[9px] text-muted-foreground italic">
                            Refer sidebar details to view citations.
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}

          {/* Festival Events Indicators */}
          {activeEvents.map((evt) => (
            <Marker
              key={evt.id}
              position={[evt.latitude, evt.longitude]}
              icon={createFestivalIcon(evt.riskLevel)}
            >
              <Popup>
                <div className="p-1 text-slate-200 min-w-[160px] font-sans">
                  <div className="font-bold text-xs text-foreground flex items-center gap-1.5 mb-1 text-slate-100">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                    {evt.name}
                  </div>
                  <div className="space-y-1 text-[10px] text-slate-300">
                    <div>Type: <span className="font-semibold capitalize text-foreground">{evt.type}</span></div>
                    <div>District: <span className="font-semibold text-foreground">{evt.district}</span></div>
                    <div>Expected Crowd: <span className="font-semibold text-foreground font-data">{evt.expectedAttendance.toLocaleString()}</span></div>
                    <div>Predicted Risk Score: <span className={cn("font-bold font-data", evt.riskLevel === 'critical' ? 'text-red-400' : 'text-amber-400')}>{evt.predictedRiskScore}%</span></div>
                    <div className="border-t border-slate-700/50 pt-1 mt-1 text-slate-400">
                      <div>Historical Theft: <span className="text-red-400 font-bold font-data">+{evt.historicalTheftIncrease}%</span></div>
                      <div>Historical Assault: <span className="text-red-400 font-bold font-data">+{evt.historicalAssaultIncrease}%</span></div>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Police Stations Layer */}
          {showStations && (policeStationsData as any).features.map((station: any) => {
            const coords = station.geometry.coordinates;
            // Note: GeoJSON is [lng, lat], Leaflet wants [lat, lng]
            return (
              <CircleMarker
                key={station.properties.KGISCode || station.properties.OBJECTID}
                center={[coords[1], coords[0]]}
                radius={4}
                pathOptions={{
                  fillColor: '#60A5FA', // Blue-400
                  color: '#ffffff',
                  weight: 1.5,
                  fillOpacity: 0.8,
                }}
              >
                <Popup>
                  <div className="p-1 font-sans text-xs">
                    <div className="font-bold border-b pb-1 mb-1">
                      {station.properties.POL_STAName}
                    </div>
                    <div>Code: {station.properties.KGISPSCode}</div>
                    <div>Department ID: {station.properties.DepartmentCode}</div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>

        {/* Top Left Float Controls/Summary Stack */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-auto">
          {activeDistrict !== 'all' && (
            <Button
              onClick={handleBackToState}
              variant="secondary"
              size="sm"
              className="flex items-center gap-2 shadow-md bg-card/95 border border-border text-foreground hover:bg-card w-fit font-bold"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Karnataka Overview</span>
            </Button>
          )}

          {/* Floating District/State Summary Card */}
          <Card className="p-3 bg-card/85 backdrop-blur-md border border-border w-[220px] shadow-lg">
            <Typography variant="caption" color="muted" className="font-bold uppercase tracking-wider block mb-1">
              {activeDistrict === 'all' ? 'State Overview' : 'District Insights'}
            </Typography>
            <Typography variant="body-sm" className="font-bold text-foreground capitalize truncate">
              {activeDistrict === 'all' ? 'Karnataka State' : activeDistrict}
            </Typography>
            <Separator className="my-1.5" />
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Crimes (30d):</span>
                <span className="font-data font-bold text-foreground">
                  {activeSummary.crimeCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Risk Index:</span>
                <Badge
                  variant={
                    activeSummary.riskScore >= 75
                      ? 'risk-critical'
                      : activeSummary.riskScore >= 50
                      ? 'risk-high'
                      : 'secondary'
                  }
                  size="sm"
                  className="py-0 px-1 text-[10px]"
                >
                  {activeSummary.riskScore}/100
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-medium">Trend:</span>
                <Badge
                  variant={
                    activeSummary.trend === 'increasing'
                      ? 'risk-high'
                      : activeSummary.trend === 'decreasing'
                      ? 'success'
                      : 'secondary'
                  }
                  dot
                  size="sm"
                  className="py-0 px-1 text-[10px] capitalize"
                >
                  {activeSummary.trend}
                </Badge>
              </div>
            </div>
          </Card>
        </div>

        {/* Floating Legend / Quick Controls Overlay */}
        <Card className="absolute top-4 right-4 z-10 p-3 bg-card/85 backdrop-blur-md border border-border max-w-[200px] text-xs pointer-events-auto">
          <Typography variant="body-sm" className="font-bold text-foreground border-b pb-1 mb-1.5 flex items-center gap-1">
            <Icon icon={Layers} size="sm" />
            <span>Active Layers</span>
          </Typography>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Choropleth</span>
              <span className="font-semibold text-success">Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Heatmap</span>
              <span className={showHeatmap ? "text-success font-semibold" : "text-muted-foreground font-semibold"}>
                {showHeatmap ? "On" : "Off"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Clusters</span>
              <span className={showClusters ? "text-success font-semibold" : "text-muted-foreground font-semibold"}>
                {showClusters ? "On" : "Off"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Forecasts</span>
              <span className={showPredictions ? "text-danger font-bold animate-pulse" : "text-muted-foreground font-semibold"}>
                {showPredictions ? "Warning" : "Off"}
              </span>
            </div>
            <div 
              className="flex items-center justify-between cursor-pointer hover:bg-muted/20 p-0.5 rounded transition-colors"
              onClick={() => setShowStations(!showStations)}
            >
              <span className="text-muted-foreground select-none">Police Stations</span>
              <span className={showStations ? "text-blue-400 font-semibold select-none" : "text-muted-foreground font-semibold select-none"}>
                {showStations ? "On" : "Off"}
              </span>
            </div>
            {activeEvents.length > 0 && (
              <div className="flex items-center justify-between border-t border-border/40 pt-1 mt-1 text-[10px]">
                <span className="text-muted-foreground font-bold">Public Events:</span>
                <Badge variant="outline" size="sm" className="bg-amber-500/10 text-amber-400 border-amber-500/20 py-0 scale-90">{activeEvents.length} Active</Badge>
              </div>
            )}
          </div>
        </Card>
      </div>

      
    </div>
  );
}
export default GeospatialMapContainer;
