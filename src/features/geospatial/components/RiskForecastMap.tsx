import { Polygon, Tooltip } from 'react-leaflet';
import type { RiskForecastZone } from '../types/geospatial';

export interface RiskForecastMapProps {
  forecasts: RiskForecastZone[];
}

/**
 * RiskForecastMap Overlay
 * Displays forecasted AI crime risk polygons with high warning visual styles.
 */
export function RiskForecastMap({ forecasts }: RiskForecastMapProps) {
  return (
    <>
      {forecasts.map((zone) => {
        // Red overlay color with standard 65% opacity
        const color = '#EF4444';

        return (
          <Polygon
            key={zone.id}
            positions={zone.coordinates}
            pathOptions={{
              fillColor: color,
              fillOpacity: 0.25,
              color: color,
              weight: 2,
              dashArray: '5, 5',
              className: 'animate-pulse', // Pulse animation style class
            }}
          >
            <Tooltip sticky>
              <div className="p-2 space-y-1 font-sans text-card-foreground">
                <div className="flex items-center gap-1.5 border-b pb-1">
                  <span className="h-2 w-2 rounded-full bg-danger animate-ping" />
                  <span className="text-xs font-bold text-foreground">AI Risk Forecast</span>
                </div>
                <div className="text-[11px] font-semibold text-foreground uppercase tracking-wide pt-0.5">
                  District: {zone.district}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Predicted Anomaly: <span className="font-semibold text-danger capitalize">{zone.predictedCategory}</span>
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Confidence Score: <span className="font-semibold text-foreground">{zone.confidence}%</span>
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Risk Intensity Index: <span className="font-semibold text-foreground">{zone.riskScore}/100</span>
                </div>
              </div>
            </Tooltip>
          </Polygon>
        );
      })}
    </>
  );
}
export default RiskForecastMap;
