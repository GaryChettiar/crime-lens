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
  ChevronRight,
} from 'lucide-react';
import { DashboardLayout } from '@/components/templates/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/atoms/Icon';
import { TableSkeleton } from '@/components/molecules/DataStates';
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

export function CriminalProfilePage() {
  const { criminalId } = useParams<{ criminalId: string }>();

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

  // Fallback to profile type from data or general status
  const profileType = profile?.profile_type || 'Low-Level Offender';

  return (
    <DashboardLayout title="Criminal Profile">
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
        <Card className="bg-card/45 border-border/80 backdrop-blur-sm overflow-hidden shadow-md">
          <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="h-20 w-20 rounded-xl flex items-center justify-center bg-black border border-border relative overflow-hidden group shrink-0">
                <User className="h-10 w-10 text-muted-foreground" />
                <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl font-bold text-foreground">
                    {criminal?.name || 'Unknown Offender'}
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
                      {criminal?.criminalNumber || criminal?.id || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-wider block text-muted-foreground/60">Aliases</span>
                    <span className="font-semibold text-foreground">
                      {criminal?.alias || 'None'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-wider block text-muted-foreground/60">Age / Gender</span>
                    <span className="font-semibold text-foreground">
                      {criminal?.age ? `${criminal.age} yrs` : '—'} / {criminal?.gender || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-wider block text-muted-foreground/60">Nationality</span>
                    <span className="font-semibold text-foreground">
                      {criminal?.nationality || '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* MAIN PANELS: 3 Columns width */}
          <div className="lg:col-span-3 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Threat Assessment Hero Card */}
              <div className="md:col-span-1">
                <RiskScoreCard
                  riskScore={profile?.risk_score || 0}
                  threatLevel={profile?.threat_level || 'LOW'}
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
                      {getDistrictName(profile?.primary_district)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-muted-foreground block">
                      District Spread
                    </span>
                    <span className="text-sm font-bold text-foreground">
                      {profile?.district_spread !== undefined && profile?.district_spread !== null && profile?.district_spread !== ''
                        ? profile.district_spread
                        : 'Not Available'}
                    </span>
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

          {/* SIDEBAR TACTICAL ACTIONS: 1 Column width */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="bg-card/40 border-border/80 backdrop-blur-sm shadow-lg overflow-hidden">
              <CardHeader className="p-4 border-b border-border bg-card/20">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                  Tactical Actions
                </CardTitle>
                <CardDescription className="text-[10px]">
                  Investigative operations module.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <Button
                  onClick={handleRefreshIntel}
                  disabled={isGenerating}
                  variant="secondary"
                  className="w-full text-xs font-semibold h-9 bg-primary text-primary-foreground hover:bg-primary/95 cursor-pointer flex justify-center items-center gap-2 px-3.5"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                  {isGenerating ? 'Regenerating...' : 'Refresh Intelligence'}
                </Button>

                <div className="pt-4 border-t border-border mt-2 space-y-2">
                  <div className="p-2.5 rounded-lg border border-border bg-black/45 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-muted-foreground block">
                        System Flag
                      </span>
                      <span className="text-[10px] font-semibold text-danger">
                        Priority Target
                      </span>
                    </div>
                    <AlertOctagon className="h-4 w-4 text-danger animate-pulse" />
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
