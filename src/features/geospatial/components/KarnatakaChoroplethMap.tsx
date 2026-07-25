import * as React from "react";
import { useMap, GeoJSON } from "react-leaflet";
import { type DistrictMetric } from "../types/geospatial";
import { useGetDistrictsGeoJsonQuery } from "@/services/districtsApi";
import { convertToGeoJson } from "@/utils/geoJsonHelper";
import { useAnalyticsFilters } from "@/hooks/useAnalyticsFilters";

export interface KarnatakaChoroplethMapProps {
  metrics: DistrictMetric[];
  selectedDistrict: string;
  onDistrictSelect: (district: string) => void;
  isDark?: boolean;
  interactive?: boolean;
}

const getChoroplethColor = (riskIndex: number, isDark: boolean = true) => {
  if (riskIndex >= 75) return "#B91C1C";
  if (riskIndex >= 50) return "#C2410C";
  if (riskIndex >= 30) return "#B45309";
  if (riskIndex >= 15) return isDark ? "#1E3A8A" : "#3B82F6";
  return isDark ? "#1E293B" : "#F1F5F9";
};

// Flat neutral fill used for non-selected districts once focus mode is on —
// deliberately NOT on the risk ramp so it reads as "inactive/backdrop", not data.
const FOCUS_MODE_MUTED_FILL = (isDark: boolean) =>
  isDark ? "#0F172A" : "#F1F5F9";

const SELECTED_OUTLINE = "#22D3EE";

const DISTRICT_NAME_ALIASES: Record<string, string> = {
  "bengaluru urban": "bangalore urban",
  "bengaluru rural": "bangalore rural",
  mysuru: "mysore",
  belagavi: "belgaum",
  "hubballi-dharwad": "dharwad",
  kalaburagi: "gulbarga",
  ballari: "bellary",
  tumakuru: "tumkur",
  shivamogga: "shimoga",
  vijayapura: "bijapur",
};
const REVERSE_ALIASES: Record<string, string> = Object.fromEntries(
  Object.entries(DISTRICT_NAME_ALIASES).map(([k, v]) => [v, k]),
);

function districtNamesMatch(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  const an = a.trim().toLowerCase();
  const bn = b.trim().toLowerCase();
  if (an === bn) return true;
  if (DISTRICT_NAME_ALIASES[an] === bn) return true;
  if (REVERSE_ALIASES[an] === bn) return true;
  return false;
}

export function KarnatakaChoroplethMap({
  metrics,
  selectedDistrict,
  onDistrictSelect,
  isDark = true,
  interactive = true,
}: KarnatakaChoroplethMapProps) {
  const map = useMap();
  const geoJsonRef = React.useRef<any>(null);
  const { districtId: activeDistrictId } = useAnalyticsFilters();

  const { data: records, isLoading, isError } = useGetDistrictsGeoJsonQuery();

  const geoJsonData = React.useMemo(() => {
    return records ? convertToGeoJson(records) : null;
  }, [records]);

  // The location scope stores the active district as its database ID (see
  // CrimesListPage). GeoJSON uses that same ID in feature.properties.id, so
  // match it first; the name is only a fallback for map-driven selections.
  const hasSelection =
    Boolean(activeDistrictId) ||
    (Boolean(selectedDistrict) && selectedDistrict !== "all");

  const isActiveDistrict = (feature: any) => {
    const dName = feature?.properties?.name || feature?.properties?.NAME_2;
    const featureDistrictId = feature?.properties?.id;

    if (activeDistrictId) {
      return String(featureDistrictId) === String(activeDistrictId);
    }

    return districtNamesMatch(selectedDistrict, dName);
  };

  const getStyle = (feature: any) => {
    const dName = feature?.properties?.name || feature?.properties?.NAME_2;
    const metric = metrics.find((m) => districtNamesMatch(m.district, dName));
    const isSelected = isActiveDistrict(feature);

    if (isSelected) {
      return {
        fillColor: isDark ? "#164E63" : "#CFFAFE", // single highlight color
        fillOpacity: 0.9,
        color: SELECTED_OUTLINE,
        weight: 6,
        dashArray: "",
        className: "district-selected-glow",
      };
    }

    if (hasSelection) {
      return {
        fillColor: FOCUS_MODE_MUTED_FILL(isDark),
        fillOpacity: 0.45,
        color: isDark ? "#334155" : "#CBD5E1",
        weight: 1,
        dashArray: "",
      };
    }

    // Normal browse mode: full choropleth
    const risk = metric ? metric.riskIndex : 0;
    return {
      fillColor: getChoroplethColor(risk, isDark),
      fillOpacity: 0.45,
      color: isDark ? "#475569" : "#CBD5E1",
      weight: 1,
      dashArray: "3",
    };
  };

  const getDistrictTooltip = (
    districtName: string,
    metric?: DistrictMetric,
  ) => `
    <div class="p-1.5 font-sans space-y-0.5 text-foreground bg-card text-[11px]">
      <div class="font-bold border-b border-border/60 pb-0.5 capitalize">${districtName} District</div>
      ${
        metric
          ? `
        <div>Active Crimes (30d): <b>${metric.crimeCount}</b></div>
        <div>Clearance Rate: <b>${metric.resolutionRate}%</b></div>
        <div>Risk index: <b style="color: ${getChoroplethColor(metric.riskIndex, isDark)}">${metric.riskIndex}/100</b></div>
      `
          : ""
      }
    </div>
  `;

  const onEachFeature = (feature: any, layer: any) => {
    const dName = feature?.properties?.name || feature?.properties?.NAME_2;
    const metric = metrics.find((m) => districtNamesMatch(m.district, dName));
    const isSelected = isActiveDistrict(feature);

    // Tooltips: in focus mode, only the selected district gets one.
    // In browse mode (no selection), every district with metric data gets one.
    const shouldBindTooltip = hasSelection ? isSelected : Boolean(metric);

    if (shouldBindTooltip) {
      layer.bindTooltip(getDistrictTooltip(dName, metric), {
        sticky: true,
        opacity: 0.95,
      });
    } else {
      layer.unbindTooltip();
    }

    if (!interactive) {
      const el = layer.getElement?.();
      if (el) el.style.cursor = "default";
      return;
    }

    // In focus mode, non-selected districts are visually inert — no hover
    // feedback either, since they've already been stripped of data meaning.
    if (hasSelection && !isSelected) {
      layer.off("mouseover");
      layer.off("mouseout");
      layer.on({
        click: (e: any) => {
          const bounds = e.target.getBounds();
          map.fitBounds(bounds, { padding: [20, 20] });
          onDistrictSelect(dName);
        },
      });
      return;
    }

    layer.on({
      mouseover: (e: any) => {
        const lyr = e.target;
        lyr.setStyle({
          fillOpacity: 0.92,
          weight: 6,
          color: SELECTED_OUTLINE,
        });
      },
      mouseout: (e: any) => {
        const lyr = e.target;
        lyr.setStyle(getStyle(feature));
      },
      click: (e: any) => {
        const bounds = e.target.getBounds();
        map.fitBounds(bounds, { padding: [20, 20] });
        onDistrictSelect(dName);
      },
    });
  };

  React.useEffect(() => {
    const geoLayer = geoJsonRef.current;
    if (!geoLayer) return;

    let matched: any = null;
    geoLayer.eachLayer((lyr: any) => {
      lyr.setStyle(getStyle(lyr.feature));
      const dName =
        lyr.feature?.properties?.name || lyr.feature?.properties?.NAME_2;
      const metric = metrics.find((m) => districtNamesMatch(m.district, dName));
      const isSelected = hasSelection && isActiveDistrict(lyr.feature);

      // Re-sync tooltip binding when selection changes (a district that had
      // a tooltip in browse mode needs it stripped once focus mode kicks in).
      const shouldBindTooltip = hasSelection ? isSelected : Boolean(metric);
      if (shouldBindTooltip) {
        lyr.unbindTooltip();
        lyr.bindTooltip(getDistrictTooltip(dName, metric), {
          sticky: true,
          opacity: 0.95,
        });
      } else {
        lyr.unbindTooltip();
      }

      if (isSelected) matched = lyr;
    });

    if (matched) {
      matched.bringToFront();
      map.fitBounds(matched.getBounds(), { padding: [20, 20] });
    } else if (hasSelection) {
      console.warn(
        `[KarnatakaChoroplethMap] No polygon matched selectedDistrict="${selectedDistrict}".`,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDistrict, activeDistrictId, geoJsonData, map]);

  if (isLoading || isError || !geoJsonData) {
    return null;
  }

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .district-selected-glow {
              filter: drop-shadow(0 0 5px rgba(34, 211, 238, 0.95))
                      drop-shadow(0 0 16px rgba(34, 211, 238, 0.6));
              animation: district-glow-pulse 1.8s ease-in-out infinite;
            }
            @keyframes district-glow-pulse {
              0%, 100% {
                filter: drop-shadow(0 0 5px rgba(34, 211, 238, 0.95))
                        drop-shadow(0 0 16px rgba(34, 211, 238, 0.6));
              }
              50% {
                filter: drop-shadow(0 0 9px rgba(34, 211, 238, 1))
                        drop-shadow(0 0 26px rgba(34, 211, 238, 0.85));
              }
            }
          `,
        }}
      />
      <GeoJSON
        ref={geoJsonRef}
        key={records?.length || 0}
        data={geoJsonData as any}
        style={getStyle}
        onEachFeature={onEachFeature}
      />
    </>
  );
}

export default KarnatakaChoroplethMap;
