import { useMap, GeoJSON } from 'react-leaflet';
import { type DistrictMetric } from '../types/geospatial';
import geoJsonData from '../data/karnataka-districts.geojson';

export interface KarnatakaChoroplethMapProps {
  metrics: DistrictMetric[];
  selectedDistrict: string;
  onDistrictSelect: (district: string) => void;
}

// Government-grade color ramp based on riskIndex (high-contrast, data-dense)
const getChoroplethColor = (riskIndex: number) => {
  if (riskIndex >= 75) return '#B91C1C'; // Red (700)
  if (riskIndex >= 50) return '#C2410C'; // Orange (700)
  if (riskIndex >= 30) return '#B45309'; // Yellow (700)
  if (riskIndex >= 15) return '#1E3A8A'; // Blue (900)
  return '#1E293B'; // Slate (800) - default dark background
};

/**
 * KarnatakaChoroplethMap Layer component
 * Draws real Karnataka district boundaries colored by crime risk levels.
 */
export function KarnatakaChoroplethMap({
  metrics,
  selectedDistrict,
  onDistrictSelect,
}: KarnatakaChoroplethMapProps) {
  const map = useMap();

  const getStyle = (feature: any) => {
    const dName = feature?.properties?.NAME_2;
    const metric = metrics.find(
      (m) => m.district.toLowerCase() === dName?.toLowerCase()
    );
    const risk = metric ? metric.riskIndex : 0;
    const isSelected = selectedDistrict.toLowerCase() === dName?.toLowerCase();

    return {
      fillColor: getChoroplethColor(risk),
      fillOpacity: isSelected ? 0.75 : 0.45,
      color: isSelected ? '#3B82F6' : '#475569', // Highlight selected boundary in blue
      weight: isSelected ? 3 : 1,
      dashArray: isSelected ? '' : '3',
    };
  };

  const onEachFeature = (feature: any, layer: any) => {
    const dName = feature?.properties?.NAME_2;
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
          <div>Risk index: <b style="color: ${getChoroplethColor(metric.riskIndex)}">${metric.riskIndex}/100</b></div>
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
          color: selectedDistrict.toLowerCase() === dName?.toLowerCase() ? '#3B82F6' : '#94A3B8',
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

  return (
    <GeoJSON
      data={geoJsonData as any}
      style={getStyle}
      onEachFeature={onEachFeature}
    />
  );
}
export default KarnatakaChoroplethMap;
