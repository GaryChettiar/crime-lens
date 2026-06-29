import { baseApi } from './baseApi';

/**
 * Alerts API — Real-time command alerts and dispatch endpoints.
 * Simulates server-side logic in-browser via queryFn.
 */
export const alertsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAlerts: builder.query<Alert[], AlertFilters | void>({
      queryFn: (filters) => {
        let data = [...mockAlerts];
        if (filters?.district) {
          data = data.filter(item => item.district.toLowerCase() === filters.district!.toLowerCase());
        }
        if (filters?.severity) {
          data = data.filter(item => item.severity === filters.severity);
        }
        if (filters?.status) {
          data = data.filter(item => item.status === filters.status);
        }
        return { data };
      },
      providesTags: ['Alert'],
    }),

    getAlertTimeline: builder.query<AlertTimelineStage[], string>({
      queryFn: (alertId) => {
        const timeline = mockAlertTimelines[alertId] || defaultTimeline(alertId);
        return { data: timeline };
      },
      providesTags: (_result, _error, alertId) => [{ type: 'Alert', id: `timeline-${alertId}` }],
    }),

    getAlertResponses: builder.query<AlertResponseAction[], string>({
      queryFn: (alertId) => {
        const responses = mockAlertResponses[alertId] || defaultResponses(alertId);
        return { data: responses };
      },
      providesTags: (_result, _error, alertId) => [{ type: 'Alert', id: `responses-${alertId}` }],
    }),

    getAlertAnalytics: builder.query<AlertAnalytics, { district?: string | null } | void>({
      queryFn: (filters) => {
        const district = filters?.district;
        
        // Dynamic analytics matching the active district filter
        let factor = 1.0;
        if (district) {
          factor = district.toLowerCase() === 'bangalore' ? 1.6 : 0.4;
        }

        const analytics: AlertAnalytics = {
          alertsByType: [
            { type: 'Crime Spike', count: Math.round(18 * factor) },
            { type: 'Threshold Breach', count: Math.round(12 * factor) },
            { type: 'Pattern Detected', count: Math.round(8 * factor) },
            { type: 'System Incident', count: Math.round(4 * factor) }
          ],
          alertsByDistrict: district
            ? [{ district, count: Math.round(24 * factor) }]
            : [
                { district: 'Bangalore', count: 22 },
                { district: 'Mysore', count: 12 },
                { district: 'Gulbarga', count: 8 },
                { district: 'Belgaum', count: 5 },
                { district: 'Dakshina Kannada', count: 4 }
              ],
          responseTimeTrends: [
            { period: '00:00 - 04:00', avgTime: 12 },
            { period: '04:00 - 08:00', avgTime: 10 },
            { period: '08:00 - 12:00', avgTime: 14 },
            { period: '12:00 - 16:00', avgTime: 18 },
            { period: '16:00 - 20:00', avgTime: 15 },
            { period: '20:00 - 00:00', avgTime: 13 }
          ],
          severityDistribution: [
            { name: 'Critical', value: Math.round(6 * factor), color: '#EF4444' },
            { name: 'High', value: Math.round(14 * factor), color: '#F59E0B' },
            { name: 'Medium', value: Math.round(18 * factor), color: '#3B82F6' },
            { name: 'Low', value: Math.round(10 * factor), color: '#10B981' }
          ]
        };

        return { data: analytics };
      },
      providesTags: ['Alert'],
    }),
  }),
});

export const {
  useGetAlertsQuery,
  useGetAlertTimelineQuery,
  useGetAlertResponsesQuery,
  useGetAlertAnalyticsQuery,
} = alertsApi;

// ---------------------------------------------------------------------------
// Mock Datasets
// ---------------------------------------------------------------------------

export interface Alert {
  id: string;
  title: string;
  district: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'resolved';
  coordinates: [number, number];
  description: string;
  relatedCases: string[];
  relatedEvents: string[];
  relatedSyndicates: string[];
}

export interface AlertFilters {
  severity?: string;
  status?: string | null;
  district?: string | null;
}

export interface AlertTimelineStage {
  stage: string;
  status: 'completed' | 'current' | 'pending';
  timestamp: string;
  details: string;
}

export interface AlertResponseAction {
  id: string;
  action: string;
  assignee: string;
  status: 'pending' | 'completed' | 'in-progress';
  eta: string;
}

export interface AlertAnalytics {
  alertsByType: { type: string; count: number }[];
  alertsByDistrict: { district: string; count: number }[];
  responseTimeTrends: { period: string; avgTime: number }[];
  severityDistribution: { name: string; value: number; color: string }[];
}

const mockAlerts: Alert[] = [
  {
    id: 'alt-1',
    title: 'Armed Robbery Spike',
    district: 'Bangalore',
    timestamp: '2026-06-13 09:42:15',
    severity: 'critical',
    status: 'active',
    coordinates: [12.9716, 77.5946],
    description: 'A cluster of 4 armed commercial robberies reported within a 500-meter radius in Indiranagar within the last 2 hours. Suspects operating on a high-speed black motorcycle.',
    relatedCases: ['KA-2026-00412', 'KA-2026-00415', 'KA-2026-00416'],
    relatedEvents: ['None'],
    relatedSyndicates: ['Kalyan Nagar Biker Syndicate']
  },
  {
    id: 'alt-2',
    title: 'Cyber Fraud Campaign',
    district: 'Bangalore',
    timestamp: '2026-06-13 09:15:30',
    severity: 'high',
    status: 'active',
    coordinates: [12.9279, 77.6271],
    description: 'Phishing campaign targeting senior citizens using fake Karnataka Power Corporation Limited (KPCL) bill notifications. Over 45 complaints logged at HSR Layout Cyber Cell in 24 hours.',
    relatedCases: ['KA-2026-00389', 'KA-2026-00394'],
    relatedEvents: ['None'],
    relatedSyndicates: ['Jamtara Cyber Module D-4']
  },
  {
    id: 'alt-3',
    title: 'Vehicle Theft Cluster',
    district: 'Mysore',
    timestamp: '2026-06-13 08:30:10',
    severity: 'medium',
    status: 'active',
    coordinates: [12.2958, 76.6394],
    description: 'Increase in SUV thefts reported from hotel parking slots in Gokulam and Vijayanagar. Modus operandi involves keyless entry signal jamming devices.',
    relatedCases: ['KA-2026-00215', 'KA-2026-00220'],
    relatedEvents: ['Mysuru Dasara Preparation Rally'],
    relatedSyndicates: ['Interstate Cargo Lift Crew']
  },
  {
    id: 'alt-4',
    title: 'Crowd Surge Warning',
    district: 'Gulbarga',
    timestamp: '2026-06-13 07:45:00',
    severity: 'high',
    status: 'active',
    coordinates: [17.3297, 76.8343],
    description: 'AI crowd density model indicates severe bottlenecking at the Kalaburagi Fort entry gates ahead of the State Election Assembly Rally. Risk score stands at 82%.',
    relatedCases: ['None'],
    relatedEvents: ['State Election Assembly Rally'],
    relatedSyndicates: ['None']
  },
  {
    id: 'alt-5',
    title: 'Missing Person Match',
    district: 'Belgaum',
    timestamp: '2026-06-12 18:22:45',
    severity: 'low',
    status: 'resolved',
    coordinates: [15.8497, 74.4977],
    description: 'ANPR alert triggered matching the license plate of a vehicle associated with a missing juvenile report from Dharwad. Vehicle intercepted near Belagavi toll plaza.',
    relatedCases: ['KA-2026-00104'],
    relatedEvents: ['None'],
    relatedSyndicates: ['None']
  },
  {
    id: 'alt-6',
    title: 'Narcotics Distribution Ring',
    district: 'Dakshina Kannada',
    timestamp: '2026-06-13 06:10:00',
    severity: 'high',
    status: 'active',
    coordinates: [12.8703, 75.2479],
    description: 'Intercepted encrypted messaging logs indicate a cargo shipment distribution of illicit substances bound for campus hubs in Mangaluru Urban.',
    relatedCases: ['KA-2026-00508', 'KA-2026-00511'],
    relatedEvents: ['None'],
    relatedSyndicates: ['Coastline Transit Alliance']
  }
];

const mockAlertTimelines: Record<string, AlertTimelineStage[]> = {
  'alt-1': [
    { stage: 'Detected', status: 'completed', timestamp: '09:42:15', details: 'Automated crime density monitor flagged 4 robbery records in 2 hours.' },
    { stage: 'Validated', status: 'completed', timestamp: '09:45:30', details: 'Command duty officer reviewed CCTV footage and validated suspect descriptions.' },
    { stage: 'Assigned', status: 'completed', timestamp: '09:48:00', details: 'Assigned to Sector-4 Patrol Interceptor units and local Crime Branch.' },
    { stage: 'Investigating', status: 'current', timestamp: '09:50:00', details: 'Active chase in progress near 100 Feet Road. High-speed containment beats established.' },
    { stage: 'Resolved', status: 'pending', timestamp: '--:--:--', details: 'Awaiting apprehension and case closure.' }
  ],
  'alt-2': [
    { stage: 'Detected', status: 'completed', timestamp: '09:15:30', details: 'HSR Layout cyber terminal reported a sudden influx of phishing complaints.' },
    { stage: 'Validated', status: 'completed', timestamp: '09:25:00', details: 'Validated rogue IP address hosting the spoofed billing portals.' },
    { stage: 'Assigned', status: 'completed', timestamp: '09:30:00', details: 'Assigned to Cyber Crime Cell, CID Wing.' },
    { stage: 'Investigating', status: 'current', timestamp: '09:35:00', details: 'Collaborating with domain registrar to take down spoof sites. Trace logs ongoing.' },
    { stage: 'Resolved', status: 'pending', timestamp: '--:--:--', details: 'Awaiting DNS de-registration and ISP block confirmation.' }
  ]
};

const mockAlertResponses: Record<string, AlertResponseAction[]> = {
  'alt-1': [
    { id: 'act-1', action: 'Establish outer perimeter roadblocks', assignee: 'Sector-4 Patrol Team B', status: 'in-progress', eta: '5 mins' },
    { id: 'act-2', action: 'Scan CCTV feeds on Outer Ring Road', assignee: 'CCTV Command Room', status: 'completed', eta: 'Done' },
    { id: 'act-3', action: 'Alert emergency medical units', assignee: 'Indiranagar Duty Desk', status: 'completed', eta: 'Done' },
    { id: 'act-4', action: 'Dispatch tactical arrest unit', assignee: 'City Crime Branch (CCB)', status: 'pending', eta: '15 mins' }
  ],
  'alt-2': [
    { id: 'act-1', action: 'Domain takedown request filing', assignee: 'Inspector Cyber Cell', status: 'completed', eta: 'Done' },
    { id: 'act-2', action: 'Publish advisory on public police handle', assignee: 'Public Relations Officer', status: 'completed', eta: 'Done' },
    { id: 'act-3', action: 'Log gateway transaction IDs', assignee: 'UPI Fraud Desk', status: 'in-progress', eta: '10 mins' },
    { id: 'act-4', action: 'Trace caller phone tower coordinates', assignee: 'Telecom Intercept Desk', status: 'pending', eta: '30 mins' }
  ]
};

const defaultTimeline = (alertId: string): AlertTimelineStage[] => [
  { stage: 'Detected', status: 'completed', timestamp: '08:00:00', details: `Alert ${alertId} identified on sensor streams.` },
  { stage: 'Validated', status: 'completed', timestamp: '08:05:00', details: 'Metrics validated by monitoring agent.' },
  { stage: 'Assigned', status: 'completed', timestamp: '08:10:00', details: 'Assigned to local sub-division command.' },
  { stage: 'Investigating', status: 'current', timestamp: '08:15:00', details: 'Field officers dispatched to gather report metrics.' },
  { stage: 'Resolved', status: 'pending', timestamp: '--:--:--', details: 'Pending resolution verification.' }
];

const defaultResponses = (alertId: string): AlertResponseAction[] => [
  { id: `act-${alertId}-1`, action: 'Verify incident scene parameters', assignee: 'On-duty Patrol Officer', status: 'in-progress', eta: '10 mins' },
  { id: `act-${alertId}-2`, action: 'Review historical log frequencies', assignee: 'District Analyst Unit', status: 'completed', eta: 'Done' },
  { id: `act-${alertId}-3`, action: 'File initial assessment report', assignee: 'Command Center Desk', status: 'pending', eta: '45 mins' }
];
