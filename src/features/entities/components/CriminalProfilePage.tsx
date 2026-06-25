import * as React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  AlertTriangle,
  RefreshCw,
  FileText,
  Shield,
  MapPin,
  AlertOctagon,
  Calendar,
  Layers,
  X,
  ChevronRight,
  Hash,
  Clock,
  ShieldAlert,
  Users,
  Smartphone,
  Car,
} from 'lucide-react';
import { DashboardLayout } from '@/components/templates/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/atoms/Icon';
import { TableSkeleton } from '@/components/molecules/DataStates';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import {
  useGetCriminalByIdQuery,
  useGetCriminalProfileQuery,
  useGetCriminalRiskFactorsQuery,
  useGenerateCriminalProfileMutation,
} from '@/services/criminalsApi';
import { useGetDistrictsQuery } from '@/services/districtsApi';
import { RiskScoreCard } from './RiskScoreCard';
import { IntelligenceSummaryCard } from './IntelligenceSummaryCard';
import { MetricsGrid } from './MetricsGrid';
import { RiskFactorsCard } from './RiskFactorsCard';
import { CriminalDistrictMap } from './CriminalDistrictMap';

// ---------------------------------------------------------------------------
// Status badge colour helper
// ---------------------------------------------------------------------------
function statusVariant(status: string): 'success' | 'danger' | 'warning' | 'outline' {
  switch (status?.toUpperCase()) {
    case 'CHARGE_SHEETED': return 'success';
    case 'CLOSED':         return 'outline';
    case 'OPEN':           return 'danger';
    case 'UNDER_INVESTIGATION': return 'warning';
    default:               return 'outline';
  }
}

function statusLabel(status: string) {
  switch (status?.toUpperCase()) {
    case 'CHARGE_SHEETED':       return 'Charge Sheeted';
    case 'UNDER_INVESTIGATION':  return 'Under Investigation';
    case 'CLOSED':               return 'Closed';
    case 'OPEN':                 return 'Open';
    default:                     return status || '—';
  }
}

// ---------------------------------------------------------------------------
// Crime Incidents Modal
// ---------------------------------------------------------------------------
interface CrimeIncident {
  ROWID: string;
  crime_number: string;
  title: string;
  description: string;
  status: string;
  crime_occured_date_time: string;
  incident_registered_date: string;
}

interface CrimeIncidentsModalProps {
  incidents: CrimeIncident[];
  onClose: () => void;
}

function CrimeIncidentsModal({ incidents, onClose }: CrimeIncidentsModalProps) {
  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={handleBackdrop}
    >
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card/80">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <FileText className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Crime Incidents</h2>
              <p className="text-[10px] text-muted-foreground font-medium">
                {incidents.length} linked incident{incidents.length !== 1 ? 's' : ''} on record
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-4 space-y-2.5">
          {incidents.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-10">No incidents found.</p>
          ) : (
            incidents.map((inc) => (
              <div
                key={inc.ROWID}
                className="rounded-lg border border-border bg-card/40 p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 hover:bg-card/60 transition-colors"
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-extrabold tracking-widest text-primary/70 font-mono uppercase">
                      {inc.crime_number}
                    </span>
                    <Badge variant={statusVariant(inc.status)} size="sm" className="uppercase font-bold tracking-wide text-[9px]">
                      {statusLabel(inc.status)}
                    </Badge>
                  </div>
                  <span className="text-sm font-bold text-foreground">{inc.title}</span>
                  <span className="text-[11px] text-muted-foreground line-clamp-1">{inc.description}</span>
                </div>
                <div className="shrink-0 text-right space-y-1">
                  <div className="flex items-center gap-1 justify-end text-[10px] text-muted-foreground font-medium">
                    <Clock className="h-3 w-3" />
                    {inc.crime_occured_date_time
                      ? new Date(inc.crime_occured_date_time).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })
                      : '—'}
                  </div>
                  <div className="text-[10px] text-muted-foreground/60">
                    Registered: {inc.incident_registered_date || '—'}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// District Spread Modal
// ---------------------------------------------------------------------------
interface DistrictSpreadModalProps {
  districts: string[];
  primaryDistrict?: string;
  onClose: () => void;
}

function DistrictSpreadModal({ districts, primaryDistrict, onClose }: DistrictSpreadModalProps) {
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={handleBackdrop}
    >
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-4xl h-[65vh] max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <MapPin className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">District Spread — Operational Map</h2>
              <p className="text-[10px] text-muted-foreground font-medium">
                {districts.length} district{districts.length !== 1 ? 's' : ''} of operation
                {primaryDistrict ? ` · Primary: ${primaryDistrict}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body: Map + District List */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-0">
          {/* Map Panel */}
          <div className="flex-1 min-h-[300px] md:min-h-0 relative">
            {districts.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                No district data available.
              </div>
            ) : (
              <CriminalDistrictMap
                activeDistricts={districts}
                primaryDistrict={primaryDistrict}
              />
            )}
          </div>

          {/* District List Sidebar */}
          <div className="w-full md:w-56 shrink-0 border-t md:border-t-0 md:border-l border-border flex flex-col overflow-hidden">
            <div className="px-3 py-2.5 border-b border-border bg-card/40 shrink-0">
              <p className="text-[9px] uppercase font-extrabold tracking-wider text-muted-foreground">Zones of Operation</p>
            </div>
            <div className="overflow-y-auto flex-1 p-2 space-y-1">
              {districts.map((district, index) => {
                const isPrimary = primaryDistrict?.trim().toLowerCase() === district.trim().toLowerCase();
                return (
                  <div
                    key={index}
                    className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 transition-colors ${
                      isPrimary
                        ? 'bg-blue-500/15 border border-blue-500/30'
                        : 'bg-amber-500/8 border border-amber-500/20 hover:bg-amber-500/15'
                    }`}
                  >
                    <div className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                      isPrimary ? 'bg-blue-400' : 'bg-amber-400'
                    }`} />
                    <span className={`text-[11px] font-semibold ${
                      isPrimary ? 'text-blue-300' : 'text-foreground'
                    }`}>
                      {district}
                    </span>
                    {isPrimary && (
                      <span className="ml-auto text-[8px] font-bold uppercase text-blue-400 tracking-wider">Primary</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="px-3 py-2.5 border-t border-border bg-card/20 shrink-0 space-y-1">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-sm bg-blue-500/70" />
                <span className="text-[9px] text-muted-foreground font-medium">Primary district</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-sm bg-amber-500/70" />
                <span className="text-[9px] text-muted-foreground font-medium">Active zone</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Risk Score Breakdown Modal
// ---------------------------------------------------------------------------
interface RiskScoreBreakdown {
  repeat_offender_score?: number;
  severity_score?: number;
  behavioral_score?: number;
  associate_score?: number;
  vehicle_score?: number;
  phone_score?: number;
}

interface RiskScoreBreakdownModalProps {
  breakdown?: RiskScoreBreakdown;
  riskScore: number;
  threatLevel: string;
  onClose: () => void;
}

function RiskScoreBreakdownModal({ breakdown, riskScore, threatLevel, onClose }: RiskScoreBreakdownModalProps) {
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const getBadgeVariant = (level: string) => {
    const uppercaseLevel = level?.toUpperCase();
    if (uppercaseLevel === 'CRITICAL') return 'risk-critical';
    if (uppercaseLevel === 'HIGH') return 'risk-high';
    if (uppercaseLevel === 'MEDIUM') return 'warning';
    return 'success';
  };

  // Sub-scores
  const repeatOffender = breakdown?.repeat_offender_score ?? 0;
  const severity = breakdown?.severity_score ?? 0;
  const behavioral = breakdown?.behavioral_score ?? 0;
  const associate = breakdown?.associate_score ?? 0;
  const vehicle = breakdown?.vehicle_score ?? 0;
  const phone = breakdown?.phone_score ?? 0;

  const factors = [
    {
      name: 'Offense Frequency',
      score: repeatOffender,
      max: 40,
      description: 'Calculated from the total frequency of criminal incidents on record.',
      icon: Clock,
      color: 'bg-red-500',
    },
    {
      name: 'Crime Severity',
      score: severity,
      max: 100,
      description: 'Weighted average severity multiplier of all linked crime types.',
      icon: AlertTriangle,
      color: 'bg-amber-500',
    },
    {
      name: 'Criminal Network Strength',
      score: associate,
      max: 30,
      description: 'Assesses active partnerships and direct connections to other known offenders.',
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      name: 'Mobility Risk',
      score: vehicle,
      max: 20,
      description: 'Risk associated with linked vehicles and getaway operational capability.',
      icon: Car,
      color: 'bg-emerald-500',
    },
    {
      name: 'Communication Lines',
      score: phone,
      max: 10,
      description: 'Activity score based on registered SIM cards and contact networks.',
      icon: Smartphone,
      color: 'bg-indigo-500',
    },
    {
      name: 'Behavioral Flags',
      score: behavioral,
      max: null,
      description: 'Cumulative score from special intelligence flags and behavioral alerts.',
      icon: ShieldAlert,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={handleBackdrop}
    >
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Shield className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Threat Score Breakdown</h2>
              <p className="text-[10px] text-muted-foreground font-medium">
                Analysis of the composite risk scoring algorithm
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-6">
          {/* Composite Score Overview */}
          <div className="bg-muted/30 border border-border/60 rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Composite Score</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black font-data tracking-tight text-red-500">{riskScore}</span>
                <span className="text-xs font-semibold text-muted-foreground">/ 100</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">Risk Profile</span>
              <Badge variant={getBadgeVariant(threatLevel)} size="md" className="font-extrabold tracking-wider uppercase">
                {threatLevel || 'LOW'}
              </Badge>
            </div>
          </div>

          {/* Breakdown Factors List */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Scoring Component Analysis</h3>
            <div className="grid grid-cols-1 gap-3">
              {factors.map((f, idx) => {
                const IconComponent = f.icon;
                const percentage = f.max ? Math.min((f.score / f.max) * 100, 100) : null;
                
                return (
                  <div key={idx} className="border border-border/50 rounded-lg p-3.5 bg-card/20 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-md bg-muted/65 border border-border flex items-center justify-center">
                          <IconComponent className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-foreground block">{f.name}</span>
                          <span className="text-[10px] text-muted-foreground block leading-tight">{f.description}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono text-sm font-extrabold text-foreground">
                          {f.score}
                        </span>
                        {f.max && (
                          <span className="text-[10px] text-muted-foreground font-semibold">
                            {' '}/ {f.max}
                          </span>
                        )}
                        <span className="text-[9px] block text-muted-foreground/60 uppercase font-bold">Points</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {percentage !== null && (
                      <div className="w-full bg-muted/60 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${f.color}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export function CriminalProfilePage() {
  const { criminalId } = useParams<{ criminalId: string }>();

  const [showCrimeModal, setShowCrimeModal] = React.useState(false);
  const [showDistrictModal, setShowDistrictModal] = React.useState(false);
  const [showBreakdownModal, setShowBreakdownModal] = React.useState(false);

  const [generateProfile, { isLoading: isGenerating, isSuccess: isGenerateSuccess }] =
    useGenerateCriminalProfileMutation();

  const { data: criminal, isLoading: isLoadingCriminal } = useGetCriminalByIdQuery(criminalId || '');
  const { data: profile, isLoading: isLoadingProfile } = useGetCriminalProfileQuery(criminalId || '', {
    skip: !criminalId,
  });
  const { data: riskFactorsData, isLoading: isLoadingRiskFactors } = useGetCriminalRiskFactorsQuery(criminalId || '', {
    skip: !criminalId,
  });
  const { data: districts } = useGetDistrictsQuery();

  // Step 1: Run profile generation on mount
  React.useEffect(() => {
    if (criminalId) {
      generateProfile(criminalId).catch((err) => {
        console.error('Failed to auto-generate criminal profile:', err);
      });
    }
  }, [criminalId, generateProfile]);

  const handleRefreshIntel = async () => {
    if (criminalId) {
      try {
        await generateProfile(criminalId).unwrap();
      } catch (err) {
        console.error('Failed to regenerate criminal profile:', err);
      }
    }
  };

  const getDistrictName = (districtId?: string) => {
    if (!districtId) return 'Unknown District';
    const district = districts?.find((d: any) => d.id === districtId);
    return district?.name || 'Unknown District';
  };

  const isLoading = isLoadingCriminal || isLoadingProfile || isLoadingRiskFactors || isGenerating;

  if (isLoading && !profile) {
    return (
      <DashboardLayout title="Criminal Profile">
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
          <div className="flex items-center justify-between">
            <Link
              to="/entities/criminals"
              className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Criminals Directory
            </Link>
          </div>
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <RefreshCw className="h-10 w-10 text-primary animate-spin" />
            <p className="text-sm font-semibold text-muted-foreground">
              Compiling latest intelligence profile...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Derived data
  const profileType = profile?.profile_type || 'Low-Level Offender';
  const crimeIncidents: CrimeIncident[] = profile?.crime_incidents || [];
  const operatingDistricts: string[] = profile?.districts || [];

  return (
    <DashboardLayout title="Criminal Profile">
      {/* Modals */}
      {showCrimeModal && (
        <CrimeIncidentsModal
          incidents={crimeIncidents}
          onClose={() => setShowCrimeModal(false)}
        />
      )}
      {showDistrictModal && (
        <DistrictSpreadModal
          districts={operatingDistricts}
          primaryDistrict={profile?.district_name}
          onClose={() => setShowDistrictModal(false)}
        />
      )}
      {showBreakdownModal && (
        <RiskScoreBreakdownModal
          breakdown={profile?.risk_score_breakdown}
          riskScore={profile?.risk_score || 0}
          threatLevel={profile?.threat_level || 'LOW'}
          onClose={() => setShowBreakdownModal(false)}
        />
      )}

      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/entities/criminals"
            className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Criminals Directory
          </Link>
          <div className="text-[10px] text-muted-foreground font-data">
            System Node: SEC-04 | Status: Operational
          </div>
        </div>

        {/* 1. Header Section */}
        <Card className="bg-card/45 border-border/80 backdrop-blur-sm overflow-hidden shadow-md relative">
          <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="absolute top-4 right-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleRefreshIntel}
                    disabled={isGenerating}
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 cursor-pointer"
                  >
                    <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                    <span className="sr-only">Refresh Intelligence</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  Refresh Intelligence
                </TooltipContent>
              </Tooltip>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="h-20 w-20 rounded-xl flex items-center justify-center bg-black border border-border relative overflow-hidden group shrink-0">
                <User className="h-10 w-10 text-muted-foreground" />
                <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl font-bold text-foreground">
                    {profile?.criminal_name || criminal?.name || 'Unknown Offender'}
                  </h1>
                  <Badge variant="success" size="sm" className="font-bold tracking-wide uppercase">
                    {criminal?.status || profile?.status || 'ACTIVE'}
                  </Badge>
                  <Badge variant="outline" size="sm" className="font-extrabold tracking-wide uppercase border-primary/20 text-primary">
                    {profileType}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-xs text-muted-foreground font-medium">
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-wider block text-muted-foreground/60">Criminal Number</span>
                    <span className="font-semibold text-foreground font-data font-mono">
                      {profile?.criminal_number || criminal?.criminalNumber || criminal?.id || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-wider block text-muted-foreground/60">Aliases</span>
                    <span className="font-semibold text-foreground">
                      {profile?.aliases && profile.aliases.length > 0
                        ? profile.aliases.join(', ')
                        : (criminal?.alias || 'None')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-wider block text-muted-foreground/60">Age / Gender</span>
                    <span className="font-semibold text-foreground">
                      {(profile?.age !== undefined && profile?.age !== null && profile?.age !== '') || criminal?.age
                        ? `${profile?.age ?? criminal?.age} yrs`
                        : '—'}{' '}
                      / {profile?.gender || criminal?.gender || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-wider block text-muted-foreground/60">Nationality</span>
                    <span className="font-semibold text-foreground">
                      {profile?.nationality || criminal?.nationality || '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Workspace Layout */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Threat Assessment Hero Card */}
              <div className="md:col-span-1">
                <RiskScoreCard
                  riskScore={profile?.risk_score || 0}
                  threatLevel={profile?.threat_level || 'LOW'}
                  onClick={() => setShowBreakdownModal(true)}
                />
              </div>

              {/* Intelligence Summary Callout */}
              <div className="md:col-span-2">
                <IntelligenceSummaryCard summary={profile?.profile_summary || ''} />
              </div>
            </div>

            {/* Metrics Dashboard Widgets */}
            <MetricsGrid
              crimeFrequency={profile?.crime_frequency}
              associateCount={profile?.associate_count}
              networkStrength={profile?.network_strength}
              districtSpread={profile?.district_spread}
              onCrimeFrequencyClick={crimeIncidents.length > 0 ? () => setShowCrimeModal(true) : undefined}
              onDistrictSpreadClick={operatingDistricts.length > 0 ? () => setShowDistrictModal(true) : undefined}
            />

            {/* Intelligence Breakdown details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Crime Analysis Card */}
              <Card className="bg-card/40 border-border/80 backdrop-blur-sm shadow-md">
                <CardHeader className="p-4 border-b border-border bg-card/20">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-primary" />
                    Crime Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-muted-foreground block">
                      Primary Crime Type
                    </span>
                    <span className="text-sm font-bold text-foreground">
                      {profile?.primary_crime_type || '—'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-muted-foreground block">
                        Active Years
                      </span>
                      <span className="text-sm font-bold text-foreground">
                        {profile?.active_years !== undefined ? `${profile.active_years} yrs` : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-muted-foreground block">
                        Last Activity
                      </span>
                      <span className="text-xs font-bold text-foreground font-data">
                        {profile?.last_activity_date
                          ? new Date(profile.last_activity_date).toLocaleDateString('en-IN')
                          : '—'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Geographic Intelligence Card */}
              <Card className="bg-card/40 border-border/80 backdrop-blur-sm shadow-md">
                <CardHeader className="p-4 border-b border-border bg-card/20">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary" />
                    Geographic Intelligence
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-muted-foreground block">
                      Primary District
                    </span>
                    <span className="text-sm font-bold text-foreground block truncate" title={getDistrictName(profile?.primary_district)}>
                      {profile?.district_name || getDistrictName(profile?.primary_district)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-muted-foreground block">
                      District Spread
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">
                        {profile?.district_spread !== undefined && profile?.district_spread !== null && profile?.district_spread !== ''
                          ? profile.district_spread
                          : 'Not Available'}
                      </span>
                      {operatingDistricts.length > 0 && (
                        <button
                          onClick={() => setShowDistrictModal(true)}
                          className="text-[9px] font-bold text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
                        >
                          View all
                        </button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Trend Analysis Card */}
              <Card className="bg-card/40 border-border/80 backdrop-blur-sm shadow-md">
                <CardHeader className="p-4 border-b border-border bg-card/20">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-primary" />
                    Trend Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-muted-foreground block">
                      Escalation Trend
                    </span>
                    <span className="text-sm font-bold text-foreground font-data">
                      {profile?.escalation_trend !== undefined && profile?.escalation_trend !== null && profile?.escalation_trend !== ''
                        ? `${profile.escalation_trend}%`
                        : 'Not Available'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-muted-foreground block">
                      Trend Status
                    </span>
                    <span className={`text-xs font-bold ${
                      profile?.escalation_trend === undefined || profile?.escalation_trend === null || profile?.escalation_trend === ''
                        ? 'text-muted-foreground italic'
                        : parseFloat(profile.escalation_trend) > 0
                        ? 'text-danger animate-pulse'
                        : parseFloat(profile.escalation_trend) < 0
                        ? 'text-success'
                        : 'text-amber-500'
                    }`}>
                      {profile?.escalation_trend === undefined || profile?.escalation_trend === null || profile?.escalation_trend === ''
                        ? 'Not Available'
                        : parseFloat(profile.escalation_trend) > 0
                        ? 'Increasing'
                        : parseFloat(profile.escalation_trend) < 0
                        ? 'Declining'
                        : 'Stable'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Risk Factors Breakdown */}
            <RiskFactorsCard riskFactors={riskFactorsData?.riskFactors || []} />
        </div>
      </div>
    </DashboardLayout>
  );
}
