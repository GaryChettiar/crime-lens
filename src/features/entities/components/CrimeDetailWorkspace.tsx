import * as React from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { AdminLayout } from '@/components/templates/AdminLayout/AdminLayout';
import { useGetCrimeByIdQuery, useUpdateCrimeStatusMutation } from '@/services/crimeApi';
import {
  downloadEntityReportPdf,
  type EntityReportType,
  useDownloadEntityReportMutation,
} from '@/services/entityReportsApi';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft, RefreshCw, AlertCircle, FolderOpen,
  LayoutDashboard, Paperclip, Users, Scale, Clock, ClipboardList,
  Eye, Shield, UserX, UserSearch, GitBranch, FileDown
} from 'lucide-react';
import { CRIME_STATUS_COLORS, CRIME_STATUS_STEPS } from '../types';
import { CrimeStatusWorkflow } from './CrimeStatusWorkflow';
import { OverviewTab } from './tabs/OverviewTab';
import { SuspectsTab } from './tabs/SuspectsTab';
import { EvidenceTab } from './tabs/EvidenceTab';
import { LegalSectionsTab } from './tabs/LegalSectionsTab';
import { TimelineTab } from './tabs/TimelineTab';
import { ActivityTab } from './tabs/ActivityTab';
import { VictimsTab } from './tabs/VictimsTab';
import { WitnessTab } from './tabs/WitnessTab';
import { NetworkAnalysisTab } from './tabs/NetworkAnalysisTab';
import type { CrimeStatus } from '@/services/crimeApi';
import type { CrimeTab } from '@/store/slices/crimeDetailsSlice';

const TAB_CONFIG: { value: CrimeTab; label: string; icon: React.ElementType }[] = [
  { value: 'overview', label: 'Overview', icon: LayoutDashboard },
  { value: 'evidence', label: 'Evidence', icon: Paperclip },
  { value: 'suspects', label: 'Suspects', icon: Users },
  { value: 'legal', label: 'Legal Sections', icon: Scale },
  { value: 'timeline', label: 'Timeline', icon: Clock },
  { value: 'activity', label: 'Activity', icon: ClipboardList },
  { value: 'victims', label: 'Victims', icon: UserX },
  { value: 'witness', label: 'Witness', icon: Eye },
  { value: 'criminal', label: 'Criminal', icon: UserSearch },
  { value: 'investigating_team', label: 'Investigating Team', icon: Shield },
  { value: 'network_analysis', label: 'Network Analysis', icon: GitBranch },
];

const VALID_TABS: CrimeTab[] = TAB_CONFIG.map((t) => t.value);

export function CrimeDetailWorkspace() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read tab from URL query param; fall back to 'overview'
  const rawTab = searchParams.get('tab') as CrimeTab | null;
  const activeTab: CrimeTab = rawTab && VALID_TABS.includes(rawTab) ? rawTab : 'overview';

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  };

  const {
    data: crimeData,
    isLoading,
    isError,
    refetch,
  } = useGetCrimeByIdQuery(id!, { skip: !id });

  const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateCrimeStatusMutation();
  const [downloadEntityReport] = useDownloadEntityReportMutation();

  const handleStatusChange = async (status: CrimeStatus) => {
    if (!id) return;
    await updateStatus({ id, status }).unwrap();
  };

  const openReport = async (entity: EntityReportType, entityId: string) => {
    try {
      const pdf = await downloadEntityReport({ entity, id: entityId }).unwrap();
      downloadEntityReportPdf(pdf, entity);
    } catch (error) {
      console.error('Failed to download crime report:', error);
    }
  };

  // --- Loading State ---
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-4 max-w-[1400px] mx-auto pb-10">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AdminLayout>
    );
  }

  // --- Error State ---
  if (isError || !crimeData) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-7 w-7 text-destructive" />
          </div>
          <p className="text-sm font-semibold text-foreground">Incident not found</p>
          <p className="text-xs text-muted-foreground">
            This incident record does not exist or could not be loaded.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => refetch()}>
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </Button>
            <Link to="/entities/crimes">
              <Button size="sm" className="text-xs gap-1.5">
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Crimes
              </Button>
            </Link>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const statusLabel =
    CRIME_STATUS_STEPS.find((s) => s.value === crimeData.status)?.label ?? crimeData.status;

  return (
    <AdminLayout>
      <div className="space-y-4 max-w-[1400px] mx-auto pb-10">
        {/* Breadcrumb */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link
              to="/entities/crimes"
              className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Crimes
            </Link>
            <span className="text-muted-foreground/40 text-xs">/</span>
            <span className="text-xs text-muted-foreground font-mono">{crimeData.crimeNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1.5"
              onClick={() => id && void openReport('crime', id)}
            >
              <FileDown className="h-3.5 w-3.5" />
              Get Report
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1.5"
              onClick={() => refetch()}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Crime Header */}
        <div className="bg-card/60 border border-border/60 rounded-xl p-5 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 min-w-0">
              <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <FolderOpen className="h-6 w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg font-bold text-foreground truncate">{crimeData.title}</h1>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${
                      CRIME_STATUS_COLORS[crimeData.status] ?? 'bg-muted/50 text-muted-foreground'
                    }`}
                  >
                    {statusLabel}
                  </span>
                </div>
                {/* <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <span className="text-xs text-muted-foreground font-mono">{crimeData.crimeNumber}</span>
                  <span className="text-muted-foreground/30 text-xs">·</span>
                  <span className="text-xs text-muted-foreground">{crimeData.crimeCategory}</span>
                  {crimeData.district && (
                    <>
                      <span className="text-muted-foreground/30 text-xs">·</span>
                      <span className="text-xs text-muted-foreground">{crimeData.district}</span>
                    </>
                  )}
                  {crimeData.incidentDate && (
                    <>
                      <span className="text-muted-foreground/30 text-xs">·</span>
                      <span className="text-xs text-muted-foreground font-data">
                        {new Date(crimeData.incidentDate).toLocaleDateString('en-IN')}
                      </span>
                    </>
                  )}
                </div> */}
              </div>
            </div>
          </div>
        </div>

        {/* Status Workflow */}
        <CrimeStatusWorkflow
          currentStatus={crimeData.status}
          onStatusChange={handleStatusChange}
          isLoading={isUpdatingStatus}
        />

        {/* Tabs */}
        <div className="bg-card/40 border border-border/60 rounded-xl overflow-hidden backdrop-blur-sm">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            {/* Tab List */}
            <div className="border-b border-border/60 px-4 pt-3 overflow-x-auto">
              <TabsList className="bg-transparent p-0 h-auto gap-0 w-auto">
                {TAB_CONFIG.map(({ value, label, icon: Icon }) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className="
                      relative px-4 py-2 text-xs font-medium rounded-none border-b-2 border-transparent
                      data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent
                      text-muted-foreground hover:text-foreground transition-colors gap-1.5 h-auto
                    "
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Tab Content */}
            <div className="p-5">
              <TabsContent value="overview" className="mt-0">
                <OverviewTab crimeData={crimeData} />
              </TabsContent>

              <TabsContent value="evidence" className="mt-0">
                <EvidenceTab crimeId={crimeData.id} initialEvidence={crimeData.evidences ?? []} />
              </TabsContent>

              <TabsContent value="suspects" className="mt-0">
                <SuspectsTab crimeId={crimeData.id} />
              </TabsContent>

              <TabsContent value="legal" className="mt-0">
                <LegalSectionsTab crimeId={crimeData.id} />
              </TabsContent>

              <TabsContent value="timeline" className="mt-0">
                <TimelineTab crimeId={crimeData.id} initialTimeline={[
                  {
                    id: `crime-${crimeData.id}-registered`,
                    crimeId: crimeData.id,
                    eventType: 'crime_registered',
                    title: 'Incident Registered',
                    description: crimeData.description || 'Crime incident registered in the system.',
                    actor: crimeData.createdBy || 'System',
                    occurredAt: crimeData.createdAt || crimeData.incidentDate || new Date().toISOString(),
                  },
                  ...(crimeData.assignedOfficers?.map((officer, idx) => ({
                    id: `officer-${officer.id || idx}`,
                    crimeId: crimeData.id,
                    eventType: 'officer_assigned' as const,
                    title: 'Officer Assigned',
                    description: `Officer ${officer.badgeNumber || officer.officerId || 'assigned'} linked to investigation.`,
                    actor: officer.badgeNumber || 'Officer',
                    occurredAt: officer.createdAt || crimeData.createdAt || new Date().toISOString(),
                  })) ?? []),
                  ...(crimeData.evidences?.length ? [{
                    id: `evidence-${crimeData.id}`,
                    crimeId: crimeData.id,
                    eventType: 'evidence_uploaded' as const,
                    title: 'Evidence Collected',
                    description: `${crimeData.evidences.length} evidence item${crimeData.evidences.length > 1 ? 's' : ''} recorded for this incident.`,
                    actor: 'System',
                    occurredAt: crimeData.updatedAt || crimeData.createdAt || new Date().toISOString(),
                  }] : []),
                ]} />
              </TabsContent>

              <TabsContent value="activity" className="mt-0">
                <ActivityTab
                  crimeId={crimeData.id}
                  initialActivity={[
                    {
                      id: `activity-${crimeData.id}-created`,
                      crimeId: crimeData.id,
                      timestamp: crimeData.createdAt || new Date().toISOString(),
                      user: crimeData.createdBy || 'System',
                      action: 'INCIDENT_REGISTERED',
                      module: 'Crimes',
                      details: crimeData.description || 'Crime incident logged in the system.',
                    },
                    ...(crimeData.assignedOfficers?.length
                      ? [{
                          id: `activity-${crimeData.id}-assigned`,
                          crimeId: crimeData.id,
                          timestamp: crimeData.updatedAt || new Date().toISOString(),
                          user: 'Investigation Unit',
                          action: 'OFFICER_ASSIGNED',
                          module: 'Investigations',
                          details: `${crimeData.assignedOfficers.length} officer assignment${crimeData.assignedOfficers.length > 1 ? 's' : ''} recorded.`,
                        }]
                      : [])
                  ]}
                />
              </TabsContent>

              <TabsContent value="victims" className="mt-0">
                <VictimsTab incidentId={crimeData.id} items={crimeData.victims ?? []} />
              </TabsContent>

              <TabsContent value="witness" className="mt-0">
                <WitnessTab incidentId={crimeData.id} items={crimeData.witnesses ?? []} />
              </TabsContent>

              <TabsContent value="criminal" className="mt-0">
                <div className="space-y-3">
                  {(!crimeData.criminals || crimeData.criminals.length === 0) ? (
                    <div className="p-8 bg-muted/20 text-sm text-muted-foreground text-center rounded-lg border border-border/50">
                      No criminal records linked to this incident yet.
                    </div>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      {crimeData.criminals.map((criminal) => (
                        <div key={criminal.id} className="rounded-lg border border-border/60 bg-card/40 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-foreground">{criminal.name}</p>
                              {criminal.alias && <p className="text-[10px] text-muted-foreground">Alias: {criminal.alias}</p>}
                            </div>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-amber-500/10 text-amber-400 border-amber-500/20">
                              {criminal.status || 'Active'}
                            </span>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                            <div><span className="block text-[10px] uppercase tracking-wide">Gender</span>{criminal.gender || '—'}</div>
                            <div><span className="block text-[10px] uppercase tracking-wide">Age</span>{criminal.age ?? '—'}</div>
                            <div className="col-span-2"><span className="block text-[10px] uppercase tracking-wide">Phone</span>{criminal.phone || '—'}</div>
                            <div className="col-span-2"><span className="block text-[10px] uppercase tracking-wide">Address</span>{criminal.address || '—'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="investigating_team" className="mt-0">
                <div className="space-y-3">
                  {(!crimeData.assignedOfficers || crimeData.assignedOfficers.length === 0) ? (
                    <div className="p-8 bg-muted/20 text-sm text-muted-foreground text-center rounded-lg border border-border/50">
                      No investigating officers assigned to this case.
                    </div>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      {crimeData.assignedOfficers.map((officer, idx) => (
                        <div key={officer.id || idx} className="rounded-lg border border-border/60 bg-card/40 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-foreground">Badge {officer.badgeNumber || 'N/A'}</p>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border bg-blue-500/10 text-blue-400 border-blue-500/20">
                              {officer.operationalStatus || 'ACTIVE'}
                            </span>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                            <div><span className="block text-[10px] uppercase tracking-wide">Officer ID</span>{officer.officerId || '—'}</div>
                            <div><span className="block text-[10px] uppercase tracking-wide">Rank</span>{officer.rank || '—'}</div>
                            <div><span className="block text-[10px] uppercase tracking-wide">Contact</span>{officer.contactNumber || '—'}</div>
                            <div><span className="block text-[10px] uppercase tracking-wide">Station</span>{officer.stationId || '—'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="network_analysis" className="mt-0">
                <NetworkAnalysisTab crimeId={crimeData.id} crimeNumber={crimeData.crimeNumber} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </AdminLayout>
  );
}
