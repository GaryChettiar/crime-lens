import * as React from "react";
import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  useMap,
  Marker,
  Popup,
  CircleMarker,
} from "react-leaflet";
import { useIntelligence } from "@/features/intelligence";
import { KarnatakaChoroplethMap } from "./KarnatakaChoroplethMap";
import { TemporalCrimePlayback } from "./TemporalCrimePlayback";
import { useGetDistrictMetricsQuery } from "@/services/districtsApi";
import { useGetIncidentsQuery } from "@/services/crimeApi";
import { DISTRICT_CENTERS } from "../data/mockGeospatialData";
import { useGetStationsQuery } from "@/services/policeStationsApi";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Typography } from "@/components/atoms/Typography";
import { ArrowLeft, Layers, BarChart2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Icon } from "@/components/atoms/Icon";
import { Badge } from "@/components/atoms/Badge";
import { Separator } from "@/components/ui/separator";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setDistrict } from "@/store/slices/globalFiltersSlice";
import { selectIsDark } from "@/store/slices/brandingSlice";
import { cn } from "@/lib/utils";
import usePermissions from "@/hooks/usePermissions";
import { useAnalyticsFilters } from "@/hooks/useAnalyticsFilters";
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
  // Lifted temporal playback props
  currentDayOffset?: number;
  timeWindow?: number | "cumulative";
}

// Controller to handle programmatic zoom resetting
function MapController({ selectedDistrict }: { selectedDistrict: string }) {
  const map = useMap();

  useEffect(() => {
    if (selectedDistrict === "all" || !selectedDistrict) {
      map.setView([15.3173, 75.7139], 7);
    } else {
      // Find coordinates for selected district
      const match = Object.entries(DISTRICT_CENTERS).find(
        ([name]) => name.toLowerCase() === selectedDistrict.toLowerCase(),
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

  // Lifted temporal playback props
  currentDayOffset: propCurrentDayOffset,
  timeWindow: propTimeWindow,
}: GeospatialMapContainerProps) {
  const dispatch = useAppDispatch();
  const globalFilters = useAppSelector((state) => state.globalFilters);
  const isDark = useAppSelector(selectIsDark);

  const { hasPermission, currentUser } = usePermissions();
  const canViewStateMap = hasPermission("view_state_map");
  const { district: analyticsDistrict } = useAnalyticsFilters();
  const { districtSummaries } = useIntelligence();
  const { data: districtsMetrics = [] } = useGetDistrictMetricsQuery();
  const { data: incidents = [] } = useGetIncidentsQuery();
  const { data: policeStations = [] } = useGetStationsQuery();

  // Restricted users are locked to their own district. Resolve the district
  // *name* via their assigned station (currentUser.districtId is a raw id
  // and the map/choropleth/DISTRICT_CENTERS all key off name).
  const assignedDistrictName = React.useMemo(() => {
    if (!currentUser?.stationId) return null;
    const station = policeStations.find((s) => s.id === currentUser.stationId);
    return station?.districtName ?? null;
  }, [currentUser, policeStations]);

  React.useEffect(() => {
    if (!canViewStateMap && assignedDistrictName && !globalFilters.district) {
      dispatch(setDistrict(assignedDistrictName));
    }
  }, [canViewStateMap, assignedDistrictName, globalFilters.district, dispatch]);
  // Playback timeline states
  const [localCurrentDayOffset] = useState(30);
  const [localTimeWindow] = useState<number | "cumulative">("cumulative");

  const currentDayOffset =
    propCurrentDayOffset !== undefined
      ? propCurrentDayOffset
      : localCurrentDayOffset;
  const timeWindow =
    propTimeWindow !== undefined ? propTimeWindow : localTimeWindow;

  // Sync prop changes with Redux if necessary
  const activeDistrict =
    globalFilters.district ||
    analyticsDistrict ||
    (selectedDistrict !== "all" ? selectedDistrict : null) ||
    "all";
  console.log("activeDistrict", analyticsDistrict);
  // Local state for toggles
  const [showStations, setShowStations] = useState(true);

  const handleDistrictSelect = (dist: string) => {
    if (!canViewStateMap) return; // locked — restricted users can't change district
    dispatch(setDistrict(dist === "all" ? null : dist));
    if (onDistrictChange) {
      onDistrictChange(dist);
    }
  };

  const handleBackToState = () => {
    if (!canViewStateMap) return;
    handleDistrictSelect("all");
  };

  // Convert dates for Temporal Timeline Playback
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  const startDateStr = startDate.toISOString().split("T")[0];
  const endDateStr = new Date().toISOString().split("T")[0];

  // Filter incidents by temporal timeline slider and global filters
  const filteredIncidentsByTimeline = incidents.filter((inc) => {
    const incDate = new Date(inc.timestamp.split(" ")[0]);
    const timelineStart = new Date(startDate);
    const timelineMax = new Date(startDate);
    timelineMax.setDate(timelineMax.getDate() + currentDayOffset);

    let timelineMin = new Date(timelineStart);
    if (timeWindow !== "cumulative") {
      timelineMin = new Date(timelineMax);
      timelineMin.setDate(timelineMin.getDate() - timeWindow);
    }

    // Temporal window check
    if (incDate < timelineMin || incDate > timelineMax) return false;

    // Redux Global filters
    // 1. District
    if (
      globalFilters.district &&
      inc.district.toLowerCase() !== globalFilters.district.toLowerCase()
    ) {
      return false;
    }
    // 2. Crime Types
    if (
      globalFilters.crimeTypes.length > 0 &&
      !globalFilters.crimeTypes.includes(inc.type)
    ) {
      return false;
    }
    // 3. Severities
    if (
      globalFilters.severities.length > 0 &&
      !globalFilters.severities.includes(inc.severity)
    ) {
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

  // Compute summary values for the floating district summary card
  const activeSummary = React.useMemo(() => {
    if (activeDistrict === "all") {
      const totalCrimes = districtsMetrics.reduce(
        (sum, d) => sum + d.crimeCount,
        0,
      );
      const avgRisk =
        districtsMetrics.length > 0
          ? Math.round(
              districtsMetrics.reduce((sum, d) => sum + d.riskIndex, 0) /
                districtsMetrics.length,
            )
          : 45;
      return {
        crimeCount: totalCrimes || 800,
        riskScore: avgRisk,
        trend: "stable",
      };
    } else {
      const match = districtsMetrics.find(
        (d) => d.district.toLowerCase() === activeDistrict.toLowerCase(),
      );
      return {
        crimeCount: match?.crimeCount ?? 0,
        riskScore: match?.riskIndex ?? 0,
        trend: match?.trend ?? "stable",
      };
    }
  }, [activeDistrict, districtsMetrics]);

  return (
    <div className={cn("flex flex-col w-full gap-4", className)}>
      {/* ROW 1: Playback Timeline  Slider */}

      {/* ROW 2: Map Viewport Container */}

      <div
        className={cn(
          "relative w-full md:h-[55vh] border border-border rounded-lg overflow-hidden",
          isDark ? "bg-[#090d16]" : "bg-white",
        )}
      >
        <style
          dangerouslySetInnerHTML={{
            __html: `
          @keyframes pulse-animation {
            0% { transform: scale(0.9); opacity: 0.9; }
            50% { transform: scale(1.15); opacity: 1; box-shadow: 0 0 12px currentColor; }
            100% { transform: scale(0.9); opacity: 0.9; }
          }
        `,
          }}
        />

        <MapContainer
          center={[15.3173, 75.7139]}
          zoom={7}
          minZoom={6}
          maxBounds={[
            [9.5, 71.0],
            [23.5, 85.0],
          ]}
          maxBoundsViscosity={1.0}
          className="w-full h-full z-0 outline-none"
          zoomControl={false}
          attributionControl={false}
        >
          <MapController selectedDistrict={activeDistrict} />

          {/* Premium CartoDB tile set matching branding theme */}
          <TileLayer
            url={
              isDark
                ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            }
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />

          {/* Choropleth Reference Base Boundaries Layer */}
          <KarnatakaChoroplethMap
            metrics={districtsMetrics}
            selectedDistrict={activeDistrict}
            onDistrictSelect={handleDistrictSelect}
            isDark={isDark}
            interactive={canViewStateMap}
          />

          {/* OSINT External Intelligence Hotspots overlay */}
          {showIntelHotspots &&
            districtSummaries
              .filter((d) => {
                const map: Record<string, string> = {
                  "Bengaluru Urban": "Bangalore Urban",
                  "Bengaluru Rural": "Bangalore Rural",
                  Mysuru: "Mysore",
                  Belagavi: "Belgaum",
                  "Hubballi-Dharwad": "Dharwad",
                  Kalaburagi: "Gulbarga",
                  Ballari: "Bellary",
                  Tumakuru: "Tumkur",
                  Shivamogga: "Shimoga",
                  Vijayapura: "Bijapur",
                  Chamarajanagar: "Chamarajanagar",
                };
                const key = map[d.district] || d.district;
                return DISTRICT_CENTERS[key] !== undefined;
              })
              .map((summary) => {
                const mapNameMap: Record<string, string> = {
                  "Bengaluru Urban": "Bangalore Urban",
                  "Bengaluru Rural": "Bangalore Rural",
                  Mysuru: "Mysore",
                  Belagavi: "Belgaum",
                  "Hubballi-Dharwad": "Dharwad",
                  Kalaburagi: "Gulbarga",
                  Ballari: "Bellary",
                  Tumakuru: "Tumkur",
                  Shivamogga: "Shimoga",
                  Vijayapura: "Bijapur",
                  Chamarajanagar: "Chamarajanagar",
                };
                const key = mapNameMap[summary.district] || summary.district;
                const center = DISTRICT_CENTERS[key];
                const radius = Math.max(12, summary.riskContribution * 2.2);
                const color =
                  summary.riskContribution > 12 ? "#EF4444" : "#F59E0B"; // Red for critical, Orange for warning

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
                      dashArray: "3, 4",
                    }}
                  >
                    <Popup>
                      <div className="p-1 text-slate-200 min-w-[150px] font-sans">
                        <div className="font-bold text-xs text-foreground flex items-center gap-1.5 mb-1.5 text-slate-100">
                          <span
                            className="w-2.5 h-2.5 rounded-full animate-pulse"
                            style={{ backgroundColor: color }}
                          />
                          {summary.district} OSINT Threat
                        </div>
                        <div className="space-y-1 text-[10px] text-slate-300">
                          <div>
                            Threat Category:{" "}
                            <span className="font-semibold text-foreground text-slate-100">
                              {summary.highestThreat}
                            </span>
                          </div>
                          <div>
                            Active Sources:{" "}
                            <span className="font-semibold text-foreground font-data text-slate-100">
                              {summary.articleCount} reports
                            </span>
                          </div>
                          <div>
                            OSINT Index Contribution:{" "}
                            <span
                              className="font-bold font-data text-slate-100"
                              style={{ color: color }}
                            >
                              +{summary.riskContribution}%
                            </span>
                          </div>
                          <div className="border-t border-slate-700/50 pt-1 mt-1 text-[9px] text-muted-foreground italic">
                            Refer sidebar details to view citations.
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}

          {/* Police Stations Layer */}

          {showStations &&
            policeStations.map((station, idx) => {
              if (
                station.latitude === undefined ||
                station.longitude === undefined
              )
                return null;

              return (
                <CircleMarker
                  key={`station-${station.code || ""}-${station.id || ""}-${idx}`}
                  center={[station.latitude, station.longitude]}
                  radius={4}
                  pathOptions={{
                    fillColor: "#60A5FA", // Blue-400
                    color: "#ffffff",
                    weight: 1.5,
                    fillOpacity: 0.8,
                  }}
                >
                  <Popup>
                    <div className="p-1 font-sans text-xs">
                      <div className="font-bold border-b pb-1 mb-1">
                        {station.name}
                      </div>
                      {station.code && <div>Code: {station.code}</div>}
                      {station.districtName && (
                        <div>District: {station.districtName}</div>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
        </MapContainer>

        {/* Top Left Float Controls/Summary Stack */}
        {/* Top Left Float Controls/Summary Stack */}
        {canViewStateMap && (
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-auto">
            {activeDistrict !== "all" && (
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
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex items-center gap-2 shadow-md bg-card/95 border border-border text-foreground hover:bg-card w-fit font-bold"
                >
                  <BarChart2 className="h-4 w-4" />
                  <span>Overview</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent /* ...unchanged... */>
                {/* ...unchanged... */}
              </PopoverContent>
            </Popover>
          </div>
        )}

        {/* Floating Legend / Quick Controls Overlay */}
        <div className="absolute top-4 right-4 z-10 pointer-events-auto">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="flex items-center gap-2 shadow-md bg-card/95 border border-border text-foreground hover:bg-card w-fit font-bold"
              >
                <Layers className="h-4 w-4" />
                <span>Layers</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 border-none bg-transparent shadow-none ring-0"
              side="bottom"
              align="end"
            >
              <Card className="p-3 bg-card/95 backdrop-blur-md border border-border w-[200px] text-xs mt-2">
                <Typography
                  variant="body-sm"
                  className="font-bold text-foreground border-b pb-1 mb-1.5 flex items-center gap-1"
                >
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
                    <span
                      className={
                        showHeatmap
                          ? "text-success font-semibold"
                          : "text-muted-foreground font-semibold"
                      }
                    >
                      {showHeatmap ? "On" : "Off"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Clusters</span>
                    <span
                      className={
                        showClusters
                          ? "text-success font-semibold"
                          : "text-muted-foreground font-semibold"
                      }
                    >
                      {showClusters ? "On" : "Off"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Forecasts</span>
                    <span
                      className={
                        showPredictions
                          ? "text-danger font-bold animate-pulse"
                          : "text-muted-foreground font-semibold"
                      }
                    >
                      {showPredictions ? "Warning" : "Off"}
                    </span>
                  </div>
                  <div
                    className="flex items-center justify-between cursor-pointer hover:bg-muted/20 p-0.5 rounded transition-colors"
                    onClick={() => setShowStations(!showStations)}
                  >
                    <span className="text-muted-foreground select-none">
                      Police Stations
                    </span>
                    <span
                      className={
                        showStations
                          ? "text-blue-400 font-semibold select-none"
                          : "text-muted-foreground font-semibold select-none"
                      }
                    >
                      {showStations ? "On" : "Off"}
                    </span>
                  </div>
                </div>
              </Card>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
export default GeospatialMapContainer;
