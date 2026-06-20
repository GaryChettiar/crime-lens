import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

export interface CrimeHeatmapProps {
  points: [number, number, number][]; // [lat, lng, intensity]
  radius?: number;
  maxZoom?: number;
  minOpacity?: number;
}

/**
 * CrimeHeatmap Organism Overlay
 * Renders a density overlay map using Leaflet.heat
 */
export function CrimeHeatmap({
  points,
  radius = 25,
  maxZoom = 18,
  minOpacity = 0.4,
}: CrimeHeatmapProps) {
  const map = useMap();
  const heatLayerRef = useRef<any>(null);

  useEffect(() => {
    if (!map) return;

    // Clean up previous layer
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    // Create Leaflet Heat Layer
    try {
      // @ts-ignore
      const layer = L.heatLayer(points, {
        radius,
        maxZoom,
        minOpacity,
        gradient: {
          0.4: 'rgba(0, 0, 255, 0)',
          0.5: 'blue',
          0.6: 'cyan',
          0.7: 'lime',
          0.8: 'yellow',
          1.0: 'red',
        },
      });

      layer.addTo(map);
      heatLayerRef.current = layer;
    } catch (error) {
      console.error('Failed to initialize Leaflet heat layer:', error);
    }

    return () => {
      if (heatLayerRef.current && map) {
        map.removeLayer(heatLayerRef.current);
      }
    };
  }, [map, points, radius, maxZoom, minOpacity]);

  return null;
}
export default CrimeHeatmap;
