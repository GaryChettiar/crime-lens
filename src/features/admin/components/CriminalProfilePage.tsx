import * as React from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  AlertTriangle, 
  TrendingUp, 
  RefreshCw, 
  FileText, 
  Phone, 
  Shield, 
  Activity, 
  FileDown, 
  ChevronRight, 
  Calendar, 
  MapPin, 
  Car, 
  AlertOctagon, 
  Clock, 
  Link2,
  Users,
  AlertCircle,
  CheckCircle2,
  Lock,
  Search
} from 'lucide-react';
import { DashboardLayout } from '@/components/templates/DashboardLayout';
import { Typography } from '@/components/atoms/Typography';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/atoms/Icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip as ChartTooltip,
  Legend
} from 'recharts';

// Define static mock data
const MOCK_CRIMINAL = {
  id: 'CR-2024-00142',
  name: 'Ravi Kumar',
  aliases: ['Black Ravi', 'RK'],
  status: 'ACTIVE',
  age: 32,
  gender: 'Male',
  nationality: 'Indian',
  threatLevel: 'CRITICAL',
  riskScore: 82,
  crimeCount: 18,
  networkStrength: 74,
  activeDistrict: 'Bengaluru Urban',
  districtSpread: 5,
  escalationTrend: '+75%',
  behavioralFlags: ['Violent', 'Armed', 'Repeat Offender'],
  knownPhones: [
    { number: '9876543210', provider: 'Airtel' },
    { number: '9123456789', provider: 'Jio' }
  ],
  vehicles: [
    { registration: 'KA01AB1234', type: 'Motorcycle' },
    { registration: 'KA05XY8899', type: 'Sedan' }
  ],
  riskFactors: [
    { factor: 'Repeat Offender', score: 20 },
    { factor: 'Violent History', score: 15 },
    { factor: 'Gang Association', score: 25 },
    { factor: 'Active Warrant', score: 15 },
    { factor: 'Vehicle Network', score: 7 }
  ],
  crimes: [
    { number: 'CR-2024-0105', category: 'Vehicle Theft', district: 'Bengaluru Urban', date: '2024-05-18', severity: 'Critical' },
    { number: 'CR-2024-0091', category: 'Robbery', district: 'Bengaluru Urban', date: '2024-04-12', severity: 'High' },
    { number: 'CR-2024-0044', category: 'Vehicle Theft', district: 'Tumakuru', date: '2024-02-28', severity: 'Medium' },
    { number: 'CR-2023-0812', category: 'Assault', district: 'Bengaluru Urban', date: '2023-12-05', severity: 'High' },
    { number: 'CR-2023-0711', category: 'Vehicle Theft', district: 'Ramanagara', date: '2023-10-19', severity: 'Medium' },
    { number: 'CR-2023-0599', category: 'Fraud', district: 'Mysuru', date: '2023-08-04', severity: 'Medium' },
    { number: 'CR-2023-0402', category: 'Vehicle Theft', district: 'Kolar', date: '2023-06-11', severity: 'Low' },
    { number: 'CR-2023-0211', category: 'Robbery', district: 'Bengaluru Urban', date: '2023-03-24', severity: 'High' },
    { number: 'CR-2022-0942', category: 'Vehicle Theft', district: 'Bengaluru Urban', date: '2022-11-09', severity: 'Medium' },
    { number: 'CR-2022-0610', category: 'Vehicle Theft', district: 'Tumakuru', date: '2022-07-15', severity: 'Low' }
  ],
  associates: [
    { name: 'Ajay', type: 'Co-conspirator', crimes: 4, status: 'Active Wanted', id: 'CR-2024-00812' },
    { name: 'Kumar', type: 'Associate', crimes: 2, status: 'In Custody', id: 'CR-2023-01056' },
    { name: 'Prakash', type: 'Runner', crimes: 5, status: 'Active Wanted', id: 'CR-2024-00994' },
    { name: 'Ramesh', type: 'Fencer (Receiver)', crimes: 3, status: 'Active Wanted', id: 'CR-2024-00122' }
  ]
};

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
];

const CRIME_DISTRIBUTION = [
  { name: 'Vehicle Theft', value: 60, color: 'hsl(var(--chart-1))' },
  { name: 'Robbery', value: 20, color: 'hsl(var(--chart-2))' },
  { name: 'Fraud', value: 10, color: 'hsl(var(--chart-3))' },
  { name: 'Assault', value: 10, color: 'hsl(var(--chart-4))' }
];

export function CriminalProfilePage() {
  const { criminalId } = useParams<{ criminalId: string }>();
  const [activeTab, setActiveTab] = React.useState('overview');
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [refreshMessage, setRefreshMessage] = React.useState<string | null>(null);
  const [showProfileAlert, setShowProfileAlert] = React.useState(false);

  const handleRefreshIntel = () => {
    setIsRefreshing(true);
    setRefreshMessage(null);
    setTimeout(() => {
      setIsRefreshing(false);
      setRefreshMessage('Intelligence profile sync completed successfully.');
      setTimeout(() => setRefreshMessage(null), 3000);
    }, 1500);
  };

  const handleGenerateProfile = () => {
    setShowProfileAlert(true);
    setTimeout(() => setShowProfileAlert(false), 3000);
  };

  return (
    <DashboardLayout title="Criminal Profile">
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link 
            to="/administration/criminals" 
            className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Criminal Registry
          </Link>
          <div className="text-[10px] text-muted-foreground font-data">
            Last Synced: {new Date().toLocaleDateString('en-IN')} | System Node: SEC-04
          </div>
        </div>

        {/* Global Action Alerts */}
        {refreshMessage && (
          <div className="p-3 bg-success/15 border border-success/30 rounded-lg flex items-center gap-2 text-xs text-success animate-in fade-in slide-in-from-top-2 duration-200">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{refreshMessage}</span>
          </div>
        )}

        {showProfileAlert && (
          <div className="p-3 bg-primary/15 border border-primary/30 rounded-lg flex items-center gap-2 text-xs text-primary animate-in fade-in slide-in-from-top-2 duration-200">
            <Icon icon={FileText} size="xs" />
            <span>Comprehensive intelligence profile compiled. Report download package queued.</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* MAIN PANELS: 3 Columns width */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* 1. Header Section */}
            <CriminalHeader criminal={MOCK_CRIMINAL} />

            {/* 2. Risk Cards */}
            <RiskMetricsGrid criminal={MOCK_CRIMINAL} />

            {/* 3. Intelligence Summary */}
            <IntelligenceSummary />

            {/* 4. Tabs Section */}
            <Card className="bg-card/40 border-border/80 backdrop-blur-sm shadow-md overflow-hidden">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col" >
                <div className="border-b border-border bg-card/20 p-2 flex items-center justify-between shrink-0 overflow-x-auto">
                  <TabsList className="bg-950/45 border border-border">
                    <TabsTrigger value="overview" className="text-xs px-4 py-1.5">Overview</TabsTrigger>
                    <TabsTrigger value="crime-history" className="text-xs px-4 py-1.5">Crime History</TabsTrigger>
                    <TabsTrigger value="associate-network" className="text-xs px-4 py-1.5">Associate Network</TabsTrigger>
                    <TabsTrigger value="risk-breakdown" className="text-xs px-4 py-1.5">Risk Breakdown</TabsTrigger>
                  </TabsList>
                </div>

                <div className="p-5">
                  <TabsContent value="overview" className="mt-0">
                    <OverviewTab criminal={MOCK_CRIMINAL} />
                  </TabsContent>

                  <TabsContent value="crime-history" className="mt-0">
                    <CrimeHistoryTab criminal={MOCK_CRIMINAL} />
                  </TabsContent>

                  <TabsContent value="associate-network" className="mt-0">
                    <AssociateNetworkTab criminal={MOCK_CRIMINAL} />
                  </TabsContent>

                  <TabsContent value="risk-breakdown" className="mt-0">
                    <RiskBreakdownTab criminal={MOCK_CRIMINAL} />
                  </TabsContent>
                </div>
              </Tabs>
            </Card>

          </div>

          {/* SIDEBAR ACTIONS: 1 Column width */}
          <div className="lg:col-span-1 lg:sticky lg:top-6">
            <Card className="bg-card/40 border-border/80 backdrop-blur-sm shadow-lg overflow-hidden">
              <CardHeader className="p-4 border-b border-border bg-card/20">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Icon icon={Shield} size="xs" className="text-primary" />
                  Tactical Actions
                </CardTitle>
                <CardDescription className="text-[10px]">Investigative operations module.</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <Button 
                  onClick={handleGenerateProfile}
                  variant="secondary" 
                  className="w-full text-xs font-semibold h-9 bg-primary text-primary-foreground hover:bg-primary/95 cursor-pointer flex justify-start items-center gap-2 px-3.5"
                >
                  <Icon icon={FileText} size="xs" />
                  Generate Profile
                </Button>

                <Button 
                  onClick={handleRefreshIntel}
                  disabled={isRefreshing}
                  variant="outline" 
                  className="w-full text-xs font-semibold h-9 border-border hover:bg-accent text-foreground cursor-pointer flex justify-start items-center gap-2 px-3.5"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Syncing...' : 'Refresh Intelligence'}
                </Button>

                <Button 
                  onClick={() => setActiveTab('crime-history')}
                  variant="outline" 
                  className="w-full text-xs font-semibold h-9 border-border hover:bg-accent text-foreground cursor-pointer flex justify-start items-center gap-2 px-3.5"
                >
                  <Icon icon={Activity} size="xs" />
                  View Crime History
                </Button>

                <Button 
                  onClick={handleGenerateProfile}
                  variant="outline" 
                  className="w-full text-xs font-semibold h-9 border-border hover:bg-accent text-foreground cursor-pointer flex justify-start items-center gap-2 px-3.5"
                >
                  <FileDown className="h-3.5 w-3.5 text-muted-foreground" />
                  Export Report (PDF)
                </Button>

                <div className="pt-4 border-t border-border mt-2 space-y-2">
                  <div className="p-2.5 rounded-lg border border-border bg-950/45 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-muted-foreground block">System Flag</span>
                      <span className="text-[10px] font-semibold text-danger">Priority Target</span>
                    </div>
                    <AlertTriangle className="h-4 w-4 text-danger animate-pulse" />
                  </div>
                  
                  <div className="p-2.5 rounded-lg border border-border bg-950/45 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-muted-foreground block">Case Link Status</span>
                      <span className="text-[10px] font-semibold text-success font-data font-mono">LINKED (18/18)</span>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ---------------------------------------------------------------------------
// 1. CriminalHeader Sub-Component
// ---------------------------------------------------------------------------
interface CriminalHeaderProps {
  criminal: typeof MOCK_CRIMINAL;
}

function CriminalHeader({ criminal }: CriminalHeaderProps) {
  return (
    <Card className="bg-card/45 border-border/80 backdrop-blur-sm overflow-hidden shadow-md">
      <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {/* Avatar Placeholder */}
          <div className="h-20 w-20 rounded-xl flex items-center justify-center bg-950 border border-border relative overflow-hidden group shrink-0">
            <User className="h-10 w-10 text-muted-foreground" />
            <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
          </div>
          
          {/* Identity Information Grid */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <Typography variant="heading-lg" className="font-bold text-100">{criminal.name}</Typography>
              <Badge variant="success" size="sm" className="font-bold tracking-wide">
                {criminal.status}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-xs text-muted-foreground font-medium">
              <div>
                <span className="text-[9px] uppercase font-bold tracking-wider block text-muted-foreground/60">Criminal ID</span>
                <span className="font-semibold text-foreground font-data font-mono">{criminal.id}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold tracking-wider block text-muted-foreground/60">Aliases</span>
                <span className="font-semibold text-foreground">{criminal.aliases.join(', ')}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold tracking-wider block text-muted-foreground/60">Age / Gender</span>
                <span className="font-semibold text-foreground">{criminal.age} / {criminal.gender}</span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold tracking-wider block text-muted-foreground/60">Nationality</span>
                <span className="font-semibold text-foreground">{criminal.nationality}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Threat Level Badge */}
        <div className="flex flex-col items-start md:items-end justify-center pt-4 md:pt-0 border-t md:border-t-0 border-border/60 shrink-0">
          <span className="text-[9px] uppercase font-bold tracking-widest text-muted-foreground mb-1">Threat Classification</span>
          <Badge 
            variant="risk-critical" 
            size="lg"
            className="font-extrabold text-[13px] tracking-wider py-1 px-4 border border-red-500/20 shadow-md bg-red-500/10 text-red-500 rounded-lg animate-pulse"
          >
            {criminal.threatLevel}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 2. RiskMetricsGrid Sub-Component
// ---------------------------------------------------------------------------
function RiskMetricsGrid({ criminal }: CriminalHeaderProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* Risk Score */}
      <Card className="bg-card/45 border-border/80 backdrop-blur-sm p-3.5 relative overflow-hidden flex flex-col justify-between min-h-[120px] pb-3">
        <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground leading-none">Risk Score</span>
        <div className="flex items-baseline gap-1 mt-2">
          <span className="text-3xl font-extrabold font-data text-red-500">{criminal.riskScore}</span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
        <span className="text-[9px] sm:text-[10px] text-muted-foreground font-semibold flex items-center gap-1 mt-1 leading-tight">
          <AlertCircle className="h-3 w-3 text-red-500 shrink-0" /> Critical Risk Zone
        </span>
      </Card>

      {/* Crime Count */}
      <Card className="bg-card/45 border-border/80 backdrop-blur-sm p-3.5 relative overflow-hidden flex flex-col justify-between min-h-[120px] pb-3">
        <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground leading-none">Total Crimes</span>
        <div className="text-3xl font-extrabold font-data text-100 mt-2">{criminal.crimeCount}</div>
        <span className="text-[9px] sm:text-[10px] text-muted-foreground font-semibold mt-1 leading-tight">18 active linked FIRs</span>
      </Card>

      {/* Network Strength */}
      <Card className="bg-card/45 border-border/80 backdrop-blur-sm p-3.5 relative overflow-hidden flex flex-col justify-between min-h-[120px] pb-3">
        <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground leading-none">Network Strength</span>
        <div className="text-3xl font-extrabold font-data text-amber-500 mt-2">{criminal.networkStrength}</div>
        <span className="text-[9px] sm:text-[10px] text-muted-foreground font-semibold mt-1 leading-tight">74/100 connection density</span>
      </Card>

      {/* Active District */}
      <Card className="bg-card/45 border-border/80 backdrop-blur-sm p-3.5 relative overflow-hidden flex flex-col justify-between min-h-[120px] pb-3">
        <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground leading-none">Active District</span>
        <div className="text-xs sm:text-sm font-bold text-100 mt-2 flex items-center gap-1 min-w-0">
          <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="truncate" title={criminal.activeDistrict}>{criminal.activeDistrict}</span>
        </div>
        <span className="text-[9px] sm:text-[10px] text-muted-foreground font-semibold mt-1 leading-tight">Primary Operations Base</span>
      </Card>

      {/* District Spread */}
      <Card className="bg-card/45 border-border/80 backdrop-blur-sm p-3.5 relative overflow-hidden flex flex-col justify-between min-h-[120px] pb-3">
        <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground leading-none">District Spread</span>
        <div className="text-3xl font-extrabold font-data text-100 mt-2">{criminal.districtSpread}</div>
        <span className="text-[9px] sm:text-[10px] text-muted-foreground font-semibold mt-1 leading-tight">Districts Operated In</span>
      </Card>

      {/* Escalation Trend */}
      <Card className="bg-card/45 border-border/80 backdrop-blur-sm p-3.5 relative overflow-hidden flex flex-col justify-between min-h-[120px] pb-3">
        <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground leading-none">Escalation Trend</span>
        <div className="text-3xl font-extrabold font-data text-red-500 mt-2 flex items-center gap-1">
          {criminal.escalationTrend}
          <TrendingUp className="h-4 w-4 text-red-500 shrink-0" />
        </div>
        <span className="text-[9px] sm:text-[10px] text-muted-foreground font-semibold mt-1 leading-tight">vs previous quarter</span>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 3. IntelligenceSummary Sub-Component
// ---------------------------------------------------------------------------
function IntelligenceSummary() {
  return (
    <Card className="bg-red-500/5 border border-red-500/20 rounded-lg overflow-hidden shadow-md">
      <CardContent className="p-4 flex gap-3.5 items-start">
        <div className="h-8 w-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0 mt-0.5">
          <AlertOctagon className="h-4 w-4" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider">Intelligence Summary</h4>
          <p className="text-xs text-200 leading-relaxed font-medium">
            The subject is a high-risk repeat offender primarily involved in vehicle theft activities. 
            The criminal operates predominantly in Bengaluru Urban and maintains an active associate network. 
            Recent activity trends indicate increasing criminal involvement across multiple districts.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 4. Overview Tab
// ---------------------------------------------------------------------------
function OverviewTab({ criminal }: CriminalHeaderProps) {
  return (
    <div className="space-y-6">
      {/* Behavioral Flags */}
      <div>
        <h4 className="text-xs uppercase font-bold tracking-wider text-muted-foreground mb-2">Behavioral Flags</h4>
        <div className="flex flex-wrap gap-2">
          {criminal.behavioralFlags.map((flag) => (
            <Badge 
              key={flag} 
              variant={flag === 'Violent' || flag === 'Armed' ? 'danger' : 'secondary'} 
              size="md"
              className="font-bold uppercase tracking-wider"
            >
              {flag}
            </Badge>
          ))}
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Known Phones */}
        <div>
          <h4 className="text-xs uppercase font-bold tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-primary" />
            Known Phones
          </h4>
          <div className="border border-border/80 rounded-lg overflow-hidden bg-950/20">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-card/30 border-b border-border/80 text-muted-foreground uppercase text-[10px] font-bold">
                  <th className="p-3">Phone Number</th>
                  <th className="p-3">Provider</th>
                </tr>
              </thead>
              <tbody>
                {criminal.knownPhones.map((phone) => (
                  <tr key={phone.number} className="border-b border-border/60 hover:bg-card/20 transition-colors">
                    <td className="p-3 font-mono font-bold text-200">{phone.number}</td>
                    <td className="p-3 text-300 font-semibold">{phone.provider}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vehicles */}
        <div>
          <h4 className="text-xs uppercase font-bold tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
            <Car className="h-3.5 w-3.5 text-primary" />
            Vehicles Mapped
          </h4>
          <div className="border border-border/80 rounded-lg overflow-hidden bg-950/20">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-card/30 border-b border-border/80 text-muted-foreground uppercase text-[10px] font-bold">
                  <th className="p-3">Registration</th>
                  <th className="p-3">Type</th>
                </tr>
              </thead>
              <tbody>
                {criminal.vehicles.map((vehicle) => (
                  <tr key={vehicle.registration} className="border-b border-border/60 hover:bg-card/20 transition-colors">
                    <td className="p-3 font-mono font-bold text-200">{vehicle.registration}</td>
                    <td className="p-3 text-300 font-semibold">{vehicle.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 5. Crime History Tab
// ---------------------------------------------------------------------------
function CrimeHistoryTab({ criminal }: CriminalHeaderProps) {
  return (
    <div className="space-y-6">
      {/* Distribution Chart & Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        
        {/* Left Side: Pie Chart */}
        <div className="md:col-span-5 flex flex-col items-center">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2 self-start">Crime Type Distribution</span>
          <div className="h-44 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={CRIME_DISTRIBUTION}
                  cx="50%"
                  cy="50%"
                  innerRadius={36}
                  outerRadius={60}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {CRIME_DISTRIBUTION.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                 <ChartTooltip
                   contentStyle={{
                     backgroundColor: 'hsl(var(--card))',
                     borderColor: 'hsl(var(--border))',
                     fontSize: '11px',
                     color: 'hsl(var(--foreground))',
                     borderRadius: '6px'
                   }}
                 />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Side: Chart Legend / Metrics list */}
        <div className="md:col-span-7 grid grid-cols-2 gap-4">
          {CRIME_DISTRIBUTION.map((item) => (
            <div key={item.name} className="p-3 rounded-lg border border-border bg-950/15 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-xs font-semibold text-200">{item.name}</span>
              </div>
              <span className="text-xs font-extrabold font-data text-foreground">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Dense Crime Record List Table */}
      <div className="space-y-3">
        <h4 className="text-xs uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-primary" />
          Linked Incident History (10 Cases Mapped)
        </h4>
        
        <div className="border border-border/80 rounded-lg overflow-hidden bg-950/20">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-card/30 border-b border-border/80 text-muted-foreground uppercase text-[10px] font-bold">
                <th className="p-3">Crime Number</th>
                <th className="p-3">Category</th>
                <th className="p-3">District</th>
                <th className="p-3">Date</th>
                <th className="p-3">Severity</th>
              </tr>
            </thead>
            <tbody>
              {criminal.crimes.map((crime) => (
                <tr key={crime.number} className="border-b border-border/60 hover:bg-card/20 transition-colors">
                  <td className="p-3 font-mono font-bold text-primary hover:underline cursor-pointer">{crime.number}</td>
                  <td className="p-3 text-200 font-semibold">{crime.category}</td>
                  <td className="p-3 text-300">{crime.district}</td>
                  <td className="p-3 text-muted-foreground font-data">{crime.date}</td>
                  <td className="p-3">
                    <Badge
                      variant={
                        crime.severity === 'Critical' ? 'risk-critical' :
                        crime.severity === 'High' ? 'risk-high' :
                        crime.severity === 'Medium' ? 'warning' : 'success'
                      }
                      size="sm"
                      className="font-bold uppercase tracking-wider text-[9px] py-0.5"
                    >
                      {crime.severity}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 6. Associate Network Tab
// ---------------------------------------------------------------------------
function AssociateNetworkTab({ criminal }: CriminalHeaderProps) {
  return (
    <div className="space-y-6">
      {/* Associate Count */}
      <div className="flex items-center justify-between bg-950/40 p-4 border border-border rounded-lg">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center text-primary">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-100">Criminal Associate Network</h4>
            <p className="text-[10px] text-muted-foreground">Mapped relationships of the suspect within priority gangs.</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[9px] uppercase font-bold text-muted-foreground block">Associate Count</span>
          <span className="text-xl font-extrabold text-200 font-data">12 Mapped</span>
        </div>
      </div>

      {/* Network Relationship Graph Visual Representation */}
      <div className="border border-border bg-950/20 p-5 rounded-lg">
        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block mb-4">Visual Link Network Structure</span>
        <div className="flex flex-col items-center justify-center py-4">
          {/* Main Node */}
          <div className="relative z-10 px-5 py-2.5 rounded-lg border border-red-500/40 bg-red-500/10 text-red-500 font-bold text-xs shadow-md">
            {criminal.name} (SUBJECT)
          </div>
          
          {/* Connecting Vertical Trunk */}
          <div className="w-0.5 h-6 bg-border" />
          
          {/* horizontal branching line */}
          <div className="w-[80%] h-0.5 bg-border relative">
            {/* Branch nodes lines */}
            <div className="absolute top-0 left-0 w-0.5 h-6 bg-border" />
            <div className="absolute top-0 left-[33%] w-0.5 h-6 bg-border" />
            <div className="absolute top-0 left-[66%] w-0.5 h-6 bg-border" />
            <div className="absolute top-0 right-0 w-0.5 h-6 bg-border" />
          </div>
          
          {/* Branch Nodes cards */}
          <div className="grid grid-cols-4 gap-4 w-[90%] mt-6 text-center text-[10px]">
            <div className="p-2 rounded bg-card border border-border font-semibold text-200">Ajay</div>
            <div className="p-2 rounded bg-card border border-border font-semibold text-200">Kumar</div>
            <div className="p-2 rounded bg-card border border-border font-semibold text-200">Prakash</div>
            <div className="p-2 rounded bg-card border border-border font-semibold text-200">Ramesh</div>
          </div>
        </div>
      </div>

      {/* Associates List Cards */}
      <div className="space-y-3">
        <h4 className="text-xs uppercase font-bold tracking-wider text-muted-foreground">Known Criminal Associates</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {criminal.associates.map((associate) => (
            <Card key={associate.name} className="bg-card/45 border-border hover:border-primary/40 transition-colors p-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded bg-900 border border-border flex items-center justify-center text-muted-foreground">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-100">{associate.name}</h4>
                      <span className="text-[9px] font-mono text-muted-foreground">{associate.id}</span>
                    </div>
                  </div>
                  <Badge variant={associate.status === 'In Custody' ? 'muted' : 'danger'} size="sm" className="scale-[0.8] origin-top-right uppercase font-bold tracking-wider">
                    {associate.status}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-border/50">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-muted-foreground block">Relationship Type</span>
                    <span className="text-300 font-semibold">{associate.type}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-muted-foreground block">Linked Crimes</span>
                    <span className="text-300 font-semibold font-data">{associate.crimes} Cases</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 7. Risk Breakdown Tab
// ---------------------------------------------------------------------------
function RiskBreakdownTab({ criminal }: CriminalHeaderProps) {
  return (
    <div className="space-y-6">
      {/* Summary Score Callout */}
      <div className="bg-red-500/5 border border-red-500/20 p-5 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider">Risk Evaluation Metric Scoreboard</h4>
          <p className="text-xs text-300 max-w-lg leading-relaxed">
            The profile risk rating is calculated using static variables including repeat offenses, violence metrics, active judicial warrants, and association linkages.
          </p>
        </div>
        <div className="flex flex-col items-center bg-950/60 p-4 border border-border rounded-lg min-w-[120px]">
          <span className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Final Risk Score</span>
          <span className="text-3xl font-extrabold font-data text-red-500">{criminal.riskScore}</span>
        </div>
      </div>

      {/* Factors Table */}
      <div className="space-y-3">
        <h4 className="text-xs uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-primary" />
          Factor Risk Distribution List
        </h4>
        
        <div className="border border-border/80 rounded-lg overflow-hidden bg-950/20">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-card/30 border-b border-border/80 text-muted-foreground uppercase text-[10px] font-bold">
                <th className="p-3">Factor</th>
                <th className="p-3 text-right">Score Weight</th>
              </tr>
            </thead>
            <tbody>
              {criminal.riskFactors.map((factor) => (
                <tr key={factor.factor} className="border-b border-border/60 hover:bg-card/20 transition-colors">
                  <td className="p-3 font-semibold text-200">{factor.factor}</td>
                  <td className="p-3 text-right font-mono font-bold text-red-400 font-data">+{factor.score}</td>
                </tr>
              ))}
              <tr className="bg-950/50 font-bold border-b border-border/80">
                <td className="p-3 text-100">Final Evaluated Risk Score</td>
                <td className="p-3 text-right font-mono text-red-500 font-data text-sm">= {criminal.riskScore}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default CriminalProfilePage;
