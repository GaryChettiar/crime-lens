import * as React from 'react';
import { useMap, GeoJSON } from 'react-leaflet';
import { type DistrictMetric } from '../types/geospatial';
import { useGetDistrictsGeoJsonQuery } from '@/services/districtsApi';
import { convertToGeoJson } from '@/utils/geoJsonHelper';

export interface KarnatakaChoroplethMapProps {
  metrics: DistrictMetric[];
  selectedDistrict: string;
  onDistrictSelect: (district: string) => void;
  isDark?: boolean;
}

// Government-grade color ramp based on riskIndex (high-contrast, data-dense)
const getChoroplethColor = (riskIndex: number, isDark: boolean = true) => {
  if (riskIndex >= 75) return '#B91C1C'; // Red (700)
  if (riskIndex >= 50) return '#C2410C'; // Orange (700)
  if (riskIndex >= 30) return '#B45309'; // Yellow (700)
  if (riskIndex >= 15) return isDark ? '#1E3A8A' : '#3B82F6'; // Blue (900 vs 500)
  return isDark ? '#1E293B' : '#F1F5F9'; // Slate (800 vs 100)
};

/**
 * KarnatakaChoroplethMap Layer component
 * Draws real Karnataka district boundaries colored by crime risk levels.
 */
export function KarnatakaChoroplethMap({
  metrics,
  selectedDistrict,
  onDistrictSelect,
  isDark = true,
}: KarnatakaChoroplethMapProps) {
  const map = useMap();

  // 1. Fetch live district data
  const { data: records, isLoading, isError } = useGetDistrictsGeoJsonQuery();

  // 2. Parse database rows into standard GeoJSON
  const geoJsonData = React.useMemo(() => {
    return records ? convertToGeoJson(records) : null;
  }, [records]);

  const getStyle = (feature: any) => {
    const dName = feature?.properties?.name || feature?.properties?.NAME_2;
    const metric = metrics.find(
      (m) => m.district.toLowerCase() === dName?.toLowerCase()
    );
    const risk = metric ? metric.riskIndex : 0;
    const isSelected = selectedDistrict.toLowerCase() === dName?.toLowerCase();

    return {
      fillColor: getChoroplethColor(risk, isDark),
      fillOpacity: isSelected ? 0.75 : 0.45,
      color: isSelected ? '#3B82F6' : (isDark ? '#475569' : '#CBD5E1'), // Highlight selected boundary in blue or lighter gray
      weight: isSelected ? 3 : 1,
      dashArray: isSelected ? '' : '3',
    };
  };

  const onEachFeature = (feature: any, layer: any) => {
    const dName = feature?.properties?.name || feature?.properties?.NAME_2;
    const metric = metrics.find(
      (m) => m.district.toLowerCase() === dName?.toLowerCase()
    );

    // Bind tooltip showing metrics
    if (metric) {
      layer.bindTooltip(
        `
        <div class="p-1.5 font-sans space-y-0.5 text-foreground bg-card text-[11px]">
          <div class="font-bold border-b border-border/60 pb-0.5 capitalize">${dName} District</div>
          <div>Active Crimes (30d): <b>${metric.crimeCount}</b></div>
          <div>Clearance Rate: <b>${metric.resolutionRate}%</b></div>
          <div>Risk index: <b style="color: ${getChoroplethColor(metric.riskIndex, isDark)}">${metric.riskIndex}/100</b></div>
        </div>
      `,
        { sticky: true, opacity: 0.95 }
      );
    }

    // Attach interactions
    layer.on({
      mouseover: (e: any) => {
        const lyr = e.target;
        lyr.setStyle({
          fillOpacity: 0.7,
          weight: selectedDistrict.toLowerCase() === dName?.toLowerCase() ? 3 : 2,
          color: selectedDistrict.toLowerCase() === dName?.toLowerCase() ? '#3B82F6' : (isDark ? '#94A3B8' : '#64748B'),
        });
      },
      mouseout: (e: any) => {
        const lyr = e.target;
        lyr.setStyle(getStyle(feature));
      },
      click: (e: any) => {
        // Zoom/fit map to clicked district's actual polygon boundary bounds
        const bounds = e.target.getBounds();
        map.fitBounds(bounds, { padding: [20, 20] });
        onDistrictSelect(dName);
      },
    });
  };

  if (isLoading || isError || !geoJsonData) {
    return null;
  }

  return (
    <GeoJSON
      key={records?.length || 0}
      data={geoJsonData as any}
      style={getStyle}
      onEachFeature={onEachFeature}
    />
  );
}

export default KarnatakaChoroplethMap;
