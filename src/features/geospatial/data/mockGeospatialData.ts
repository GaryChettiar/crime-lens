import type { CrimeIncident, DistrictMetric, RiskForecastZone } from '../types/geospatial';

// Center coordinates [lat, lng] for all 30 districts from GeoJSON
export const DISTRICT_CENTERS: Record<string, [number, number]> = {
  'Bagalkot': [16.1887, 75.6367],
  'Bangalore': [12.9236, 77.5965],
  'BangaloreRural': [13.1922, 77.6006],
  'Belgaum': [16.1178, 74.7522],
  'Bellary': [15.1097, 76.491],
  'Bidar': [17.9431, 77.2292],
  'Bijapur': [16.7989, 75.9922],
  'Chamrajnagar': [11.9388, 76.9833],
  'Chikballapura': [13.5573, 77.8271],
  'Chikmagalur': [13.4411, 75.6282],
  'Chitradurga': [14.1954, 76.5183],
  'DakshinaKannada': [12.8229, 75.2194],
  'Davanagere': [14.3458, 75.909],
  'Dharwad': [15.3459, 75.1363],
  'Gadag': [15.4591, 75.6603],
  'Gulbarga': [17.2538, 76.9125],
  'Hassan': [12.9593, 76.0944],
  'Haveri': [14.7519, 75.3917],
  'Kodagu': [12.3838, 75.7766],
  'Kolar': [13.1083, 78.1938],
  'Koppal': [15.6137, 76.2035],
  'Mandya': [12.5766, 76.803],
  'Mysore': [12.2313, 76.4854],
  'Raichur': [16.0807, 76.8934],
  'Ramanagara': [12.6984, 77.298],
  'Shimoga': [14.0438, 75.1764],
  'Tumkur': [13.4816, 76.955],
  'Udupi': [13.4079, 74.8757],
  'UttaraKannada': [14.7257, 74.5801],
  'Yadgir': [16.6397, 76.9134],
};

const CRIME_TYPES = ['theft', 'burglary', 'assault', 'narcotics', 'cyber', 'homicide'] as const;
const SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;
const STATUSES = ['open', 'investigating', 'resolved', 'closed'] as const;

// Base metrics for choropleth mapping
export const DISTRICT_METRICS: DistrictMetric[] = Object.keys(DISTRICT_CENTERS).map((district, idx) => {
  // Give Bangalore and surrounding areas higher base cases for realism
  const isHighCrime = ['Bangalore', 'Belgaum', 'Mysore', 'Gulbarga', 'DakshinaKannada'].includes(district);
  const crimeCount = isHighCrime
    ? Math.floor(120 + Math.random() * 80)
    : Math.floor(15 + Math.random() * 45);

  const resolutionRate = parseFloat((65 + Math.random() * 25).toFixed(1));
  const riskIndex = Math.min(100, Math.floor((crimeCount / 200) * 100 + Math.random() * 10));
  const trend = idx % 3 === 0 ? 'increasing' : idx % 3 === 1 ? 'stable' : 'decreasing';
  const growthRate = parseFloat(((Math.random() - 0.4) * 15).toFixed(1));
  const policeStationsCount = isHighCrime ? 12 + (idx % 6) : 3 + (idx % 5);

  return {
    district,
    crimeCount,
    resolutionRate,
    riskIndex,
    trend,
    growthRate,
    policeStationsCount,
  };
});

// Generate 800 incidents spread over the past 30 days
export const generateMockIncidents = (): CrimeIncident[] => {
  const incidents: CrimeIncident[] = [];
  const districts = Object.keys(DISTRICT_CENTERS);

  // Generate for past 30 days (1 to 30)
  for (let i = 0; i < 800; i++) {
    const district = districts[Math.floor(Math.random() * districts.length)];
    const center = DISTRICT_CENTERS[district];
    const isBangalore = district === 'Bangalore';

    // Random day (1 to 30)
    const dayOffset = Math.floor(Math.random() * 30);
    const date = new Date();
    date.setDate(date.getDate() - dayOffset);
    const dateStr = date.toISOString().split('T')[0];
    const timeStr = `${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`;

    // Add a coordinate jitter within district bounds
    const maxJitter = isBangalore ? 0.08 : 0.25;
    const lat = center[0] + (Math.random() - 0.5) * maxJitter;
    const lng = center[1] + (Math.random() - 0.5) * maxJitter;

    const type = CRIME_TYPES[Math.floor(Math.random() * CRIME_TYPES.length)];
    const severity = SEVERITIES[Math.floor(Math.random() * SEVERITIES.length)];
    const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];

    incidents.push({
      id: `inc-${i}`,
      caseNumber: `KA-${2026}-${String(10000 + i).slice(1)}`,
      type,
      description: `Reported incident of ${type} at Sector ${Math.floor(Math.random() * 8) + 1} zone in ${district} jurisdiction. Operational units dispatched.`,
      location: `${district} / Area Node ${Math.floor(Math.random() * 10) + 1}`,
      district,
      coordinates: [lat, lng],
      timestamp: `${dateStr} ${timeStr}`,
      severity,
      status,
    });
  }

  // Sort chronologically
  return incidents.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
};

// Generate Risk Forecast Warning zones (polygons)
export const generateRiskForecastZones = (): RiskForecastZone[] => {
  const districts = ['Bangalore', 'Mysore', 'Belgaum', 'Gulbarga', 'DakshinaKannada'];
  return districts.map((district, idx) => {
    const center = DISTRICT_CENTERS[district];
    const lat = center[0];
    const lng = center[1];

    // Generate a small bounding polygon around the district center
    const size = 0.08 + idx * 0.01;
    const coordinates: [number, number][] = [
      [lat - size, lng - size],
      [lat + size, lng - size],
      [lat + size, lng + size],
      [lat - size, lng + size],
      [lat - size, lng - size], // close polygon
    ];

    return {
      id: `fore-${idx}`,
      district,
      coordinates,
      riskScore: Math.floor(75 + Math.random() * 20),
      predictedCategory: CRIME_TYPES[idx % CRIME_TYPES.length],
      confidence: Math.floor(80 + Math.random() * 15),
    };
  });
};

// Mock Police Stations data mapped by District (State -> District drilldown architecture)
export interface MockPoliceStation {
  id: string;
  name: string;
  coordinates: [number, number];
  staffCount: number;
  vehiclesCount: number;
  headOfficer: string;
  contactNumber: string;
}

export const MOCK_POLICE_STATIONS: Record<string, MockPoliceStation[]> = Object.keys(DISTRICT_CENTERS).reduce((acc, dist) => {
  const center = DISTRICT_CENTERS[dist];
  const stations: MockPoliceStation[] = [
    {
      id: `ps-${dist}-1`,
      name: `${dist} Central Police Station`,
      coordinates: [center[0] + 0.02, center[1] - 0.02],
      staffCount: 45,
      vehiclesCount: 8,
      headOfficer: `Insp. A. Kumar (${dist})`,
      contactNumber: `+91 80 2294-${Math.floor(1000 + Math.random() * 8000)}`,
    },
    {
      id: `ps-${dist}-2`,
      name: `${dist} North Sub-Division`,
      coordinates: [center[0] - 0.03, center[1] + 0.03],
      staffCount: 32,
      vehiclesCount: 5,
      headOfficer: `Sub-Insp. S. Patil (${dist})`,
      contactNumber: `+91 80 2294-${Math.floor(1000 + Math.random() * 8000)}`,
    },
    {
      id: `ps-${dist}-3`,
      name: `${dist} East Division Patrol Hub`,
      coordinates: [center[0] + 0.04, center[1] + 0.01],
      staffCount: 28,
      vehiclesCount: 4,
      headOfficer: `Sub-Insp. M. Gowda (${dist})`,
      contactNumber: `+91 80 2294-${Math.floor(1000 + Math.random() * 8000)}`,
    },
  ];
  acc[dist] = stations;
  return acc;
}, {} as Record<string, MockPoliceStation[]>);
