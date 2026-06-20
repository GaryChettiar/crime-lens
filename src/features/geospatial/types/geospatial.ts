export interface GeoCoordinate {
  lat: number;
  lng: number;
}

export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentType = 'theft' | 'burglary' | 'assault' | 'narcotics' | 'cyber' | 'homicide';
export type IncidentStatus = 'open' | 'investigating' | 'resolved' | 'closed';

export interface CrimeIncident {
  id: string;
  caseNumber: string;
  type: IncidentType;
  description: string;
  location: string; // E.g., "Mysore / Sector 3"
  district: string;  // Matches GeoJSON exactly
  coordinates: [number, number]; // [lat, lng]
  timestamp: string; // YYYY-MM-DD HH:MM
  severity: Severity;
  status: IncidentStatus;
}

export interface DistrictMetric {
  district: string;
  crimeCount: number;
  resolutionRate: number; // percentage (e.g. 78.5)
  riskIndex: number; // 0 to 100
  trend: 'increasing' | 'stable' | 'decreasing';
  growthRate: number; // MoM growth percentage
  policeStationsCount: number;
}

export interface RiskForecastZone {
  id: string;
  district: string;
  coordinates: [number, number][]; // Polygon coordinates
  riskScore: number; // 0 to 100
  predictedCategory: IncidentType;
  confidence: number; // percentage
}
