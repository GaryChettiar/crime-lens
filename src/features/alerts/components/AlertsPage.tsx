import { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, useMap, Marker, Popup, GeoJSON } from 'react-leaflet';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setDistrict } from '@/store/slices/globalFiltersSlice';
import { selectIsDark } from '@/store/slices/brandingSlice';
import { DashboardLayout } from '@/components/templates/DashboardLayout';
import { Typography } from '@/components/atoms/Typography';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/atoms/Icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Bell,
  ShieldAlert,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Activity,
  Layers,
  Sparkles,
  Check
} from 'lucide-react';
import {
  useGetAlertsQuery,
  useGetAlertTimelineQuery,
  useGetAlertResponsesQuery,
  useGetAlertAnalyticsQuery,
  type Alert
} from '../index';
import { IntelligenceAlertList } from '@/features/intelligence';
import { useGetDistrictsGeoJsonQuery } from '@/services/districtsApi';
import { convertToGeoJson } from '@/utils/geoJsonHelper';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import L from 'leaflet';
import { cn } from '@/lib/utils';

const getSeverityColor = (severity: string) => {
  if (severity === 'critical') return '#EF4444'; // Red
  if (severity === 'high') return '#F59E0B'; // Orange
  if (severity === 'medium') return '#EAB308'; // Yellow
  return '#3B82F6'; // Blue
};

// Custom Leaflet DivIcon creator for active alert pins
const createAlertIcon = (severity: string, isSelected: boolean) => {
  const color = getSeverityColor(severity);
  const size = isSelected ? 18 : 12;
  const shadowSize = isSelected ? 16 : 8;
  return L.divIcon({
    html: `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 2px solid #ffffff; box-shadow: 0 0 ${shadowSize}px ${color}; animation: pulse-animation 1.5s infinite;"></div>`,
    className: 'alert-map-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

const DISTRICT_COORDINATES: Record<string, [number, number]> = {
  'Bengaluru Urban': [12.9716, 77.5946],
  'Bengaluru Rural': [13.2284, 77.5819],
  'Mysuru': [12.2958, 76.6394],
  'Belagavi': [15.8497, 74.4977],
  'Dakshina Kannada': [12.8703, 75.2479],
  'Hubballi-Dharwad': [15.3647, 75.1240],
  'Kalaburagi': [17.3297, 76.8343],
  'Ballari': [15.1394, 76.9214],
  'Tumakuru': [13.3392, 77.1140],
  'Shivamogga': [13.9299, 75.5681],
};

function MapController({ selectedAlert }: { selectedAlert: any | null }) {
  const map = useMap();
  useEffect(() => {
    if (selectedAlert) {
      if (selectedAlert.coordinates) {
        map.setView(selectedAlert.coordinates, 11);
      } else if (selectedAlert.district && DISTRICT_COORDINATES[selectedAlert.district]) {
        map.setView(DISTRICT_COORDINATES[selectedAlert.district], 10);
      }
    } else {
      map.setView([15.3173, 75.7139], 7);
    }
  }, [selectedAlert, map]);
  return null;
}

export function AlertsPage() {
  const dispatch = useAppDispatch();
  const globalFilters = useAppSelector((state) => state.globalFilters);
  const isDark = useAppSelector(selectIsDark);
  const activeDistrict = globalFilters.district;

  // Selected Alert State
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);

  // Load API data
  const { data: alertsList = [] } = useGetAlertsQuery(globalFilters);
  const { data: timelineData = [] } = useGetAlertTimelineQuery(selectedAlertId || '', { skip: !selectedAlertId });
  const { data: responseActions = [] } = useGetAlertResponsesQuery(selectedAlertId || '', { skip: !selectedAlertId });
  const { data: analytics } = useGetAlertAnalyticsQuery(globalFilters);

  // Auto-select first alert in the list on mount or filter update
  useEffect(() => {
    if (alertsList.length > 0) {
      // If current selection is not in list, fallback to first item
      const exists = alertsList.some(item => item.id === selectedAlertId);
      if (!exists) {
        setSelectedAlertId(alertsList[0].id);
      }
    } else {
      setSelectedAlertId(null);
    }
  }, [alertsList, selectedAlertId]);

  const selectedAlert = useMemo(() => {
    return alertsList.find(item => item.id === selectedAlertId) || null;
  }, [alertsList, selectedAlertId]);

  // 1. Calculate KPI Metrics
  const kpiData = useMemo(() => {
    const criticalCount = alertsList.filter(item => item.severity === 'critical' && item.status === 'active').length;
    const highCount = alertsList.filter(item => item.severity === 'high' && item.status === 'active').length;
    const resolvedCount = alertsList.filter(item => item.status === 'resolved').length;
    
    // Average response time simulation based on district
    let avgResponse = '12.4 min';
    if (activeDistrict?.toLowerCase() === 'bangalore') {
      avgResponse = '14.8 min';
    } else if (activeDistrict) {
      avgResponse = '9.5 min';
    }

    return {
      critical: criticalCount,
      high: highCount,
      resolved: resolvedCount,
      responseTime: avgResponse
    };
  }, [alertsList, activeDistrict]);

  const handleAlertClick = (alert: Alert) => {
    setSelectedAlertId(alert.id);
    if (alert.district) {
      dispatch(setDistrict(alert.district));
    }
  };

  // Fetch live district geojson
  const { data: geoJsonRecords } = useGetDistrictsGeoJsonQuery();
console.log(geoJsonRecords)
  const geoJsonData = useMemo(() => {
    return geoJsonRecords ? convertToGeoJson(geoJsonRecords) : null;
  }, [geoJsonRecords]);

  const mapStyle = (feature: any) => {
    const dName = feature?.properties?.name || feature?.properties?.district || feature?.properties?.NAME_2;
    const isSelected = selectedAlert?.district?.toLowerCase() === dName?.toLowerCase();
    return {
      fillColor: isDark ? '#1e293b' : '#f8fafc',
      fillOpacity: isSelected ? 0.35 : 0.15,
      color: isSelected ? '#3B82F6' : (isDark ? '#334155' : '#cbd5e1'),
      weight: isSelected ? 2.5 : 1,
    };
  };

  return (
    <DashboardLayout title="Real-Time Alerts">
      <div className="space-y-6">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-border gap-4">
          <div>
            <Typography variant="heading-xl" as="h1" className="font-bold text-foreground">
              Real-Time Command & Response Center
            </Typography>
            <Typography variant="body-sm" color="muted" className="mt-1 flex items-center gap-1.5">
              <Badge variant="outline" className="text-danger border-danger/20 bg-danger/5 animate-pulse">Live Operations Feed</Badge>
              Monitor active emergency dispatch alerts, track validation escalation pathways, and coordinate tactical station task matrices.
            </Typography>
          </div>
          {activeDistrict && (
            <Button
              onClick={() => dispatch(setDistrict(null))}
              variant="outline"
              size="sm"
              className="border-border hover:bg-accent text-xs font-semibold"
            >
              Clear Filter: {activeDistrict}
            </Button>
          )}
        </div>

        {/* Section 1: KPI Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card/40 border-border/80 backdrop-blur-sm shadow-md">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Critical Active Alerts</span>
                <Typography variant="heading-lg" className="font-bold font-data text-danger">
                  {kpiData.critical}
                </Typography>
              </div>
              <div className="h-10 w-10 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-center text-red-500">
                <Icon icon={ShieldAlert} size="sm" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-border/80 backdrop-blur-sm shadow-md">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">High Active Alerts</span>
                <Typography variant="heading-lg" className="font-bold font-data text-amber-500">
                  {kpiData.high}
                </Typography>
              </div>
              <div className="h-10 w-10 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-center text-amber-500">
                <Icon icon={AlertTriangle} size="sm" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-border/80 backdrop-blur-sm shadow-md">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Resolved Alerts (24h)</span>
                <Typography variant="heading-lg" className="font-bold font-data text-success">
                  {kpiData.resolved}
                </Typography>
              </div>
              <div className="h-10 w-10 bg-success/10 border border-success/20 rounded-lg flex items-center justify-center text-success">
                <Icon icon={CheckCircle2} size="sm" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-border/80 backdrop-blur-sm shadow-md">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Avg. Response Time</span>
                <Typography variant="heading-lg" className="font-bold font-data text-foreground">
                  {kpiData.responseTime}
                </Typography>
              </div>
              <div className="h-10 w-10 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center text-primary">
                <Icon icon={Clock} size="sm" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section 2, 3, 4, 5: Live Command Layout Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          
          {/* LEFT: Live Alerts Feed (4/12 width) */}
          <Card className="xl:col-span-4 bg-card/40 border-border/80 backdrop-blur-sm flex flex-col h-[700px] overflow-hidden">
            <CardHeader className="p-4 border-b border-border bg-card/25 flex flex-row items-center justify-between shrink-0">
              <div>
                <CardTitle className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                  <Icon icon={Bell} size="xs" className="text-primary animate-bounce" />
                  Live Stream
                </CardTitle>
                <CardDescription className="text-[11px]">Real-time operational dispatches.</CardDescription>
              </div>
              <Badge variant="outline" className="text-muted-foreground py-0.5">{alertsList.length} total</Badge>
            </CardHeader>
            <CardContent className="p-3 overflow-y-auto no-scrollbar flex-1">
              <IntelligenceAlertList
                districtFilter={activeDistrict || 'all'}
                selectedAlertId={selectedAlertId}
                onAlertClick={handleAlertClick}
              />
            </CardContent>
          </Card>

          {/* CENTER: Map & Details Workspace (5/12 width) */}
          <div className="xl:col-span-5 flex flex-col gap-6 h-[700px]">
            {/* Top Leaflet Map Pin Map */}
            <Card className="flex-1 bg-card/40 border-border/80 backdrop-blur-sm overflow-hidden relative min-h-[300px]">
              <CardContent className="p-0 h-full relative">
                <style dangerouslySetInnerHTML={{__html: `
                  @keyframes pulse-animation {
                    0% { transform: scale(0.95); opacity: 0.8; }
                    50% { transform: scale(1.25); opacity: 1; box-shadow: 0 0 12px currentColor; }
                    100% { transform: scale(0.95); opacity: 0.8; }
                  }
                `}} />
                <MapContainer
                  center={[15.3173, 75.7139]}
                  zoom={7}
                  minZoom={6}
                  maxBounds={[[9.5, 71.0], [23.5, 85.0]]}
                  maxBoundsViscosity={1.0}
                  className="w-full h-full z-0 outline-none"
                  zoomControl={false}
                  attributionControl={false}
                >
                  <MapController selectedAlert={selectedAlert} />
                  <TileLayer
                    url={isDark ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"}
                  />
                  {geoJsonData && (
                    <GeoJSON
                      data={geoJsonData as any}
                      style={mapStyle}
                      key={`${selectedAlert?.id || 'all'}-${geoJsonRecords?.length || 0}`}
                    />
                  )}
                  {alertsList.filter(alt => alt.coordinates).map((alt) => (
                    <Marker
                      key={alt.id}
                      position={alt.coordinates}
                      icon={createAlertIcon(alt.severity, selectedAlertId === alt.id)}
                      eventHandlers={{
                        click: () => setSelectedAlertId(alt.id),
                      }}
                    >
                      <Popup>
                        <div className="p-1 font-sans text-xs min-w-[150px]">
                          <div className="font-bold text-slate-100 flex items-center gap-1.5 mb-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getSeverityColor(alt.severity) }} />
                            {alt.title}
                          </div>
                          <div className="text-[10px] text-slate-300 space-y-0.5">
                            <div>Sector: <span className="font-semibold text-foreground">{alt.district}</span></div>
                            <div>Dispatch: <span className="font-semibold text-foreground font-data">{alt.timestamp}</span></div>
                            <div>Severity: <span className="font-bold capitalize text-foreground" style={{ color: getSeverityColor(alt.severity) }}>{alt.severity}</span></div>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
                
                {/* Floating indicator */}
                <div className="absolute bottom-4 left-4 z-10 pointer-events-none">
                  <Badge variant="outline" className="bg-slate-950/85 backdrop-blur border-border text-foreground font-bold py-1 flex items-center gap-1">
                    <Icon icon={Layers} size="sm" className="text-primary" />
                    <span>Karnataka Map Layer</span>
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Bottom Alert Details Workspace */}
            <Card className="h-[320px] bg-card/40 border-border/80 backdrop-blur-sm flex flex-col overflow-hidden">
              {selectedAlert ? (
                <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden">
                  <div className="border-b border-border bg-card/15 p-2 flex items-center justify-between shrink-0">
                    <TabsList className="bg-slate-950/45 border border-border">
                      <TabsTrigger value="overview" className="text-xs px-3 py-1">Overview</TabsTrigger>
                      <TabsTrigger value="timeline" className="text-xs px-3 py-1">Timeline Log</TabsTrigger>
                      <TabsTrigger value="incidents" className="text-xs px-3 py-1">Related Cases</TabsTrigger>
                      <TabsTrigger value="actions" className="text-xs px-3 py-1">Response Tasks</TabsTrigger>
                    </TabsList>
                    <Badge
                      variant={
                        selectedAlert.severity === 'critical'
                          ? 'risk-critical'
                          : selectedAlert.severity === 'high'
                          ? 'risk-high'
                          : selectedAlert.severity === 'medium'
                          ? 'warning'
                          : 'success'
                      }
                      size="sm"
                      className="scale-90 uppercase font-bold"
                    >
                      {selectedAlert.severity} Severity
                    </Badge>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
                    {/* TAB 1: OVERVIEW */}
                    <TabsContent value="overview" className="mt-0 space-y-3">
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase block">Incident Description</span>
                        <p className="text-xs text-slate-200 mt-1 leading-relaxed">{(selectedAlert as any).description || (selectedAlert as any).message}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-4 border-t border-border/45 pt-3">
                        <div>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase block">Affected Districts</span>
                          <span className="text-xs font-semibold text-primary capitalize mt-1 block">{selectedAlert.district || 'Unknown'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase block">Related Public Event</span>
                          <span className="text-xs text-slate-300 mt-1 block truncate">{selectedAlert.relatedEvents?.join(', ') || 'None'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase block">Target Syndicates</span>
                          <span className="text-xs text-danger font-semibold mt-1 block truncate">{selectedAlert.relatedSyndicates?.join(', ') || 'None'}</span>
                        </div>
                      </div>
                    </TabsContent>

                    {/* TAB 2: TIMELINE LOG */}
                    <TabsContent value="timeline" className="mt-0">
                      <div className="space-y-3">
                        {timelineData.map((stageItem, index) => (
                          <div key={index} className="flex gap-3 text-xs items-start">
                            <div className="font-data font-semibold text-primary w-[70px] shrink-0 text-right">{stageItem.timestamp}</div>
                            <div className="flex flex-col items-center shrink-0 pt-0.5">
                              <span className={cn(
                                "w-2.5 h-2.5 rounded-full border-2",
                                stageItem.status === 'completed' ? "bg-success border-success" :
                                stageItem.status === 'current' ? "bg-amber-500 border-amber-500 animate-ping" : "bg-transparent border-slate-700"
                              )} />
                              {index < timelineData.length - 1 && <div className="w-px h-8 bg-slate-700 mt-1" />}
                            </div>
                            <div className="space-y-0.5">
                              <span className="font-bold text-slate-200 block">{stageItem.stage}</span>
                              <span className="text-muted-foreground text-[11px] block">{stageItem.details}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    {/* TAB 3: RELATED INCIDENTS */}
                    <TabsContent value="incidents" className="mt-0">
                      <div className="space-y-2">
                        {selectedAlert.relatedCases?.map((caseId, index) => (
                          <div key={index} className="flex items-center justify-between p-2.5 rounded bg-slate-950/45 border border-border/60 hover:border-primary/40 transition-colors">
                            <div className="space-y-0.5">
                              <span className="font-bold font-data text-xs text-slate-200">{caseId}</span>
                              <span className="text-[10px] text-muted-foreground block">Linked case file log reference</span>
                            </div>
                            <Button variant="ghost" size="xs" className="h-7 text-primary hover:bg-primary/10">
                              Open File
                            </Button>
                          </div>
                        ))}
                        {(!selectedAlert.relatedCases || selectedAlert.relatedCases.length === 0 || selectedAlert.relatedCases[0] === 'None') && (
                          <div className="h-32 flex items-center justify-center text-muted-foreground text-xs">
                            No related cases linked to this alert pattern.
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    {/* TAB 4: RESPONSE ACTIONS */}
                    <TabsContent value="actions" className="mt-0">
                      <div className="space-y-2">
                        {responseActions.map((act) => (
                          <div key={act.id} className="flex items-start justify-between p-2.5 rounded bg-slate-950/45 border border-border/60 gap-3">
                            <div className="flex gap-2.5 items-start">
                              <div className={cn(
                                "h-4 w-4 rounded border flex items-center justify-center shrink-0 mt-0.5",
                                act.status === 'completed' ? "bg-success border-success text-success-foreground" : "border-slate-600 bg-slate-900"
                              )}>
                                {act.status === 'completed' && <Check className="h-3 w-3 stroke-[3]" />}
                              </div>
                              <div className="space-y-0.5 text-xs">
                                <span className="font-semibold text-slate-200 block">{act.action}</span>
                                <span className="text-[10px] text-muted-foreground block">Assignee: {act.assignee}</span>
                              </div>
                            </div>
                            <Badge variant={act.status === 'completed' ? 'success' : act.status === 'in-progress' ? 'warning' : 'secondary'} size="sm" className="scale-[0.8] origin-top-right">
                              {act.status === 'completed' ? 'Done' : `ETA: ${act.eta}`}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-xs p-4">
                  Select an alert from the feed to load detailed workspace diagnostics.
                </div>
              )}
            </Card>
          </div>

          {/* RIGHT: Escalation Timeline & Analytics (3/12 width) */}
          <div className="xl:col-span-3 flex flex-col gap-6 h-[700px]">
            {/* Escalation Workflow Progression */}
            <Card className="bg-card/40 border-border/80 backdrop-blur-sm shadow-md shrink-0">
              <CardHeader className="p-4 border-b border-border bg-card/25 flex flex-row items-center gap-1.5">
                <Icon icon={Activity} size="xs" className="text-primary" />
                <div>
                  <CardTitle className="text-sm font-bold text-slate-100">Escalation Stages</CardTitle>
                  <CardDescription className="text-[11px]">Active dispatch workflow tracker.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {selectedAlert && timelineData.length > 0 ? (
                  <div className="flex items-center justify-between relative py-2">
                    {/* Linear line background */}
                    <div className="absolute top-[21px] left-3 right-3 h-[2px] bg-slate-700 z-0" />
                    
                    {timelineData.map((stageItem, index) => {
                      const isCompleted = stageItem.status === 'completed';
                      const isCurrent = stageItem.status === 'current';
                      
                      return (
                        <div key={index} className="flex flex-col items-center z-10 relative">
                          <div className={cn(
                            "h-7 w-7 rounded-full flex items-center justify-center border-2 text-[10px] font-bold font-data",
                            isCompleted ? "bg-success border-success text-success-foreground" :
                            isCurrent ? "bg-amber-500 border-amber-500 text-slate-950 animate-pulse" : "bg-slate-950 border-slate-700 text-muted-foreground"
                          )}>
                            {isCompleted ? <Check className="h-3.5 w-3.5 stroke-[3.5]" /> : index + 1}
                          </div>
                          <span className={cn(
                            "text-[8px] font-bold tracking-wider mt-1.5 uppercase",
                            isCurrent ? "text-amber-500 font-extrabold" : "text-muted-foreground"
                          )}>
                            {stageItem.stage.slice(0, 5)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-16 flex items-center justify-center text-muted-foreground text-xs">
                    No active timeline tracking.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Alert Analytics */}
            <Card className="flex-1 bg-card/40 border-border/80 backdrop-blur-sm shadow-md overflow-hidden flex flex-col">
              <CardHeader className="p-4 border-b border-border bg-card/25 flex flex-row items-center gap-1.5 shrink-0">
                <Icon icon={Sparkles} size="xs" className="text-info" />
                <div>
                  <CardTitle className="text-sm font-bold text-slate-100">Live Analytics</CardTitle>
                  <CardDescription className="text-[11px]">Command metrics & distribution charts.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-4 flex-1 overflow-y-auto no-scrollbar space-y-4">
                {analytics ? (
                  <>
                    {/* Pie Chart: Severity Distribution */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Severity Distribution</span>
                      <div className="h-32 relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={analytics.severityDistribution}
                              cx="50%"
                              cy="50%"
                              innerRadius={28}
                              outerRadius={45}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {analytics.severityDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <ChartTooltip
                              contentStyle={{
                                backgroundColor: '#0f172a',
                                borderColor: '#334155',
                                fontSize: '10px',
                                color: '#f8fafc',
                                borderRadius: '4px'
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        {/* Custom Legend Overlay */}
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-1 text-[9px]">
                          {analytics.severityDistribution.map((entry, index) => (
                            <div key={index} className="flex items-center gap-1.5 text-slate-300">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                              <span className="font-semibold">{entry.name}:</span>
                              <span className="font-data font-bold text-foreground">{entry.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-border/60" />

                    {/* Bar Chart: Alerts by Type */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Alerts by Classifier Type</span>
                      <div className="h-32">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analytics.alertsByType} margin={{ top: 5, right: 0, left: -30, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                            <XAxis dataKey="type" stroke="#94a3b8" fontSize={7} tickLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={8} tickLine={false} />
                            <ChartTooltip
                              contentStyle={{
                                backgroundColor: '#0f172a',
                                borderColor: '#334155',
                                fontSize: '10px',
                                color: '#f8fafc',
                                borderRadius: '4px'
                              }}
                            />
                            <Bar dataKey="count" fill="#3B82F6" radius={[2, 2, 0, 0]} maxBarSize={20} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
                    Loading analytics streams...
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
export default AlertsPage;
