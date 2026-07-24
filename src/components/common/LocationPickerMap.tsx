import * as React from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface LocationPickerMapProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
  className?: string;
}

// Free, no-key raster style (swap for MapTiler/Mapbox in production if you hit rate limits)
const OSM_STYLE: any = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: [
        "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [{ id: "osm-tiles", type: "raster", source: "osm" }],
};

const DEFAULT_CENTER: [number, number] = [77.5946, 12.9716]; // Bengaluru fallback

export function LocationPickerMap({
  latitude,
  longitude,
  onChange,
  className,
}: LocationPickerMapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<maplibregl.Map | null>(null);
  const markerRef = React.useRef<maplibregl.Marker | null>(null);

  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [showResults, setShowResults] = React.useState(false);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Init map once
  React.useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialCenter: [number, number] =
      latitude != null && longitude != null
        ? [longitude, latitude]
        : DEFAULT_CENTER;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: OSM_STYLE,
      center: initialCenter,
      zoom: latitude != null && longitude != null ? 14 : 11,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    const marker = new maplibregl.Marker({ draggable: true, color: "#dc2626" })
      .setLngLat(initialCenter)
      .addTo(map);

    marker.on("dragend", () => {
      const { lat, lng } = marker.getLngLat();
      onChange(lat, lng);
    });

    map.on("click", (e) => {
      marker.setLngLat(e.lngLat);
      onChange(e.lngLat.lat, e.lngLat.lng);
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep marker synced if lat/lng change from outside (e.g. edit mode prefill)
  React.useEffect(() => {
    if (!markerRef.current || latitude == null || longitude == null) return;
    const current = markerRef.current.getLngLat();
    if (
      Math.abs(current.lat - latitude) > 1e-6 ||
      Math.abs(current.lng - longitude) > 1e-6
    ) {
      markerRef.current.setLngLat([longitude, latitude]);
    }
  }, [latitude, longitude]);

  const handleSearchChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 3) {
      setResults([]);
      setShowResults(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const resp = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(value)}`,
        );
        const data: NominatimResult[] = await resp.json();
        setResults(data);
        setShowResults(true);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  };

  const handleSelectResult = (result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    onChange(lat, lng);
    setQuery(result.display_name);
    setShowResults(false);

    if (mapRef.current && markerRef.current) {
      mapRef.current.flyTo({ center: [lng, lat], zoom: 15 });
      markerRef.current.setLngLat([lng, lat]);
    }
  };

  return (
    <div className={className}>
      <div className="relative mb-2">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search for a place or address..."
          className="h-8 pl-8 pr-8 text-xs"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResults([]);
              setShowResults(false);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        {showResults && results.length > 0 && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-card border border-border rounded-lg shadow-xl z-[60] max-h-48 overflow-y-auto">
            {results.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelectResult(r)}
                className="w-full text-left px-3 py-1.5 text-xs text-foreground hover:bg-muted/80 border-b border-border/40 last:border-0"
              >
                {r.display_name}
              </button>
            ))}
          </div>
        )}
        {isSearching && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-card border border-border rounded-lg shadow-xl z-[60] px-3 py-1.5 text-[10px] text-muted-foreground">
            Searching...
          </div>
        )}
      </div>

      <div
        ref={containerRef}
        className="w-full h-56 rounded-lg border border-border overflow-hidden"
      />

      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
        <span>Lat: {latitude?.toFixed(6) ?? "—"}</span>
        <span>Lng: {longitude?.toFixed(6) ?? "—"}</span>
        <span className="italic ml-auto">Click the map or drag the pin to set the location</span>
      </div>
    </div>
  );
}