import * as React from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useGetDistrictsGeoJsonQuery } from '@/services/districtsApi';
import { convertToGeoJson } from '@/utils/geoJsonHelper';
import { useAppSelector } from '@/store/hooks';
import { selectIsDark } from '@/store/slices/brandingSlice';

interface CriminalDistrictMapProps {
  /** District names as returned by backend (e.g. ["Bangalore Urban", "Bellary"]) */
  activeDistricts: string[];
  /** Primary district to highlight differently */
  primaryDistrict?: string;
}

/** Auto-fits the map to the highlighted districts once GeoJSON is rendered */
function MapFitter({ activeDistricts, geoJsonData }: { activeDistricts: string[]; geoJsonData: any }) {
  const map = useMap();

  React.useEffect(() => {
    if (!map || activeDistricts.length === 0 || !geoJsonData) return;

    // Small delay to let GeoJSON render first
    const id = setTimeout(() => {
      const allBounds: [number, number][][] = [];

      geoJsonData.features.forEach((feature: any) => {
        const name: string = feature?.properties?.name || feature?.properties?.NAME_2 || '';
        const isActive = activeDistricts.some(
          (d) => d.trim().toLowerCase() === name.trim().toLowerCase()
        );
        if (!isActive) return;

        const geom = feature.geometry;
        const coords: [number, number][][] =
          geom.type === 'Polygon'
            ? geom.coordinates
            : geom.type === 'MultiPolygon'
            ? geom.coordinates.flat()
            : [];

        coords.forEach((ring) => {
          ring.forEach(([lng, lat]) => {
            allBounds.push([[lat, lng]]);
          });
        });
      });

      if (allBounds.length > 0) {
        const flat: [number, number][] = allBounds.flat();
        const lats = flat.map((p) => p[0]);
        const lngs = flat.map((p) => p[1]);
        map.fitBounds(
          [
            [Math.min(...lats), Math.min(...lngs)],
            [Math.max(...lats), Math.max(...lngs)],
          ],
          { padding: [24, 24] }
        );
      }
    }, 120);

    return () => clearTimeout(id);
  }, [map, activeDistricts, geoJsonData]);

  return null;
}

export function CriminalDistrictMap({ activeDistricts, primaryDistrict }: CriminalDistrictMapProps) {
  const isDark = useAppSelector(selectIsDark);
  // 1. Fetch live district data
  const { data: records, isLoading, isError } = useGetDistrictsGeoJsonQuery();

  // 2. Parse database rows into standard GeoJSON
  const geoJsonData = React.useMemo(() => {
    return records ? convertToGeoJson(records) : null;
  }, [records]);

  const normalised = activeDistricts.map((d) => d.trim().toLowerCase());
  const primaryNorm = primaryDistrict?.trim().toLowerCase() ?? '';

  const getStyle = (feature: any) => {
    const name: string = (feature?.properties?.name || feature?.properties?.NAME_2 || '').trim().toLowerCase();
    const isActive = normalised.includes(name);
    const isPrimary = primaryNorm && name === primaryNorm;

    if (isPrimary) {
      return {
        fillColor: '#3B82F6',   // blue-500 – primary district
        fillOpacity: 0.65,
        color: '#93C5FD',       // blue-300 border
        weight: 2.5,
        dashArray: '',
      };
    }
    if (isActive) {
      return {
        fillColor: '#F59E0B',   // amber-500 – active district
        fillOpacity: 0.45,
        color: '#FCD34D',       // amber-300 border
        weight: 1.5,
        dashArray: '',
      };
    }
    return {
      fillColor: isDark ? '#1E293B' : '#F1F5F9',     // slate-800 vs slate-100 – inactive
      fillOpacity: isDark ? 0.5 : 0.8,
      color: isDark ? '#334155' : '#CBD5E1',         // border color
      weight: 0.75,
      dashArray: '3',
    };
  };

  const onEachFeature = (feature: any, layer: any) => {
    const name: string = (feature?.properties?.name || feature?.properties?.NAME_2 || '').trim();
    const nameNorm = name.toLowerCase();
    const isActive = normalised.includes(nameNorm);
    const isPrimary = primaryNorm && nameNorm === primaryNorm;

    if (isActive) {
      const label = isPrimary
        ? `<b>${name}</b><br/><span style="color:#93C5FD;font-size:10px">Primary District</span>`
        : `<b>${name}</b><br/><span style="color:#FCD34D;font-size:10px">Active Zone</span>`;
      layer.bindTooltip(label, { sticky: true, opacity: 0.95, className: 'leaflet-district-tooltip' });
    }

    layer.on({
      mouseover: (e: any) => {
        if (!isActive) return;
        e.target.setStyle({ fillOpacity: isPrimary ? 0.85 : 0.65, weight: 2.5 });
      },
      mouseout: (e: any) => {
        e.target.setStyle(getStyle(feature));
      },
    });
  };

  if (isLoading) {
    return (
      <div className={"flex items-center justify-center h-full text-xs text-muted-foreground " + (isDark ? "bg-[#0f172a]" : "bg-slate-50")}>
        Loading operational map boundaries...
      </div>
    );
  }

  if (isError || !geoJsonData) {
    return (
      <div className={"flex items-center justify-center h-full text-xs text-danger " + (isDark ? "bg-[#0f172a]" : "bg-slate-50")}>
        Failed to load operational map data.
      </div>
    );
  }

  return (
    <MapContainer
      center={[15.3173, 75.7139]}
      zoom={7}
      minZoom={6}
      maxZoom={11}
      zoomControl={true}
      attributionControl={false}
      className="w-full h-full z-0 outline-none"
      style={{ background: isDark ? '#0f172a' : '#ffffff' }}
    >
      <TileLayer url={isDark ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"} />
      <GeoJSON
        key={activeDistricts.join(',')}
        data={geoJsonData as any}
        style={getStyle}
        onEachFeature={onEachFeature}
      />
      <MapFitter activeDistricts={activeDistricts} geoJsonData={geoJsonData} />
    </MapContainer>
  );
}
