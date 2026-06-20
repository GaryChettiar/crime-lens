import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import { type CrimeIncident } from '../types/geospatial';

export interface CrimeClusterMapProps {
  incidents: CrimeIncident[];
  onIncidentClick?: (incident: CrimeIncident) => void;
}

// Helper to get color code based on severity
const getSeverityColor = (sev: string) => {
  switch (sev) {
    case 'critical':
      return '#EF4444'; // Red
    case 'high':
      return '#F97316'; // Orange
    case 'medium':
      return '#EAB308'; // Yellow
    case 'low':
      return '#3B82F6'; // Blue
    default:
      return '#9CA3AF'; // Gray
  }
};

/**
 * CrimeClusterMap Organism Overlay
 * Renders markers grouped dynamically into clusters using Leaflet.markercluster
 */
export function CrimeClusterMap({ incidents, onIncidentClick }: CrimeClusterMapProps) {
  const map = useMap();
  const clusterGroupRef = useRef<any>(null);

  useEffect(() => {
    if (!map) return;

    // Clean up previous cluster group
    if (clusterGroupRef.current) {
      map.removeLayer(clusterGroupRef.current);
      clusterGroupRef.current = null;
    }

    try {
      // @ts-ignore
      const clusterGroup = L.markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 50,
        // Custom styling for clusters
        iconCreateFunction: (cluster: any) => {
          const childCount = cluster.getChildCount();
          let cClass = ' bg-primary/20 text-primary border border-primary/40 ';
          if (childCount > 100) {
            cClass = ' bg-danger/20 text-danger border border-danger/40 ';
          } else if (childCount > 30) {
            cClass = ' bg-warning/20 text-warning border border-warning/40 ';
          }

          return L.divIcon({
            html: `<div class="flex items-center justify-center rounded-full font-data font-bold h-10 w-10 text-xs backdrop-blur-xs shadow-md border-2 transition-transform hover:scale-105">${childCount}</div>`,
            className: `custom-marker-cluster ${cClass}`,
            iconSize: L.point(40, 40),
          });
        },
      });

      // Add individual incident markers to group
      incidents.forEach((inc) => {
        const color = getSeverityColor(inc.severity);
        
        // Custom SVG Pin markup
        const svgIcon = `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" fill="${color}" stroke="#000" stroke-width="1.5"/>
            <circle cx="12" cy="9" r="3" fill="#FFF"/>
          </svg>
        `;

        const icon = L.divIcon({
          html: `<div class="cursor-pointer transition-transform hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" role="button" aria-label="Incident ${inc.caseNumber}: ${inc.type}">${svgIcon}</div>`,
          className: 'custom-incident-marker',
          iconSize: L.point(24, 24),
          iconAnchor: L.point(12, 24),
        });

        const marker = L.marker(inc.coordinates, { icon });

        // Bind interactive popup
        marker.bindPopup(`
          <div class="p-2 space-y-1.5 font-sans min-w-[200px] text-card-foreground bg-card">
            <div class="flex items-center justify-between border-b pb-1 gap-2">
              <span class="text-xs font-bold font-data text-foreground">${inc.caseNumber}</span>
              <span class="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded" style="background-color: ${color}22; color: ${color}; border: 1px solid ${color}33;">
                ${inc.severity}
              </span>
            </div>
            <div class="text-[11px] font-semibold text-foreground capitalize">
              Type: ${inc.type}
            </div>
            <div class="text-[10px] text-muted-foreground truncate">
              📍 ${inc.location}
            </div>
            <div class="text-[10px] font-data text-muted-foreground">
              📅 ${inc.timestamp}
            </div>
            <button 
              id="details-btn-${inc.id}" 
              class="w-full text-center text-[10px] font-bold py-1 px-2 mt-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Inspect Brief
            </button>
          </div>
        `, { closeButton: false });

        marker.on('popupopen', () => {
          const btn = document.getElementById(`details-btn-${inc.id}`);
          if (btn) {
            btn.onclick = () => {
              if (onIncidentClick) onIncidentClick(inc);
            };
          }
        });

        clusterGroup.addLayer(marker);
      });

      map.addLayer(clusterGroup);
      clusterGroupRef.current = clusterGroup;
    } catch (error) {
      console.error('Failed to initialize MarkerCluster:', error);
    }

    return () => {
      if (clusterGroupRef.current && map) {
        map.removeLayer(clusterGroupRef.current);
      }
    };
  }, [map, incidents, onIncidentClick]);

  return null;
}
export default CrimeClusterMap;
