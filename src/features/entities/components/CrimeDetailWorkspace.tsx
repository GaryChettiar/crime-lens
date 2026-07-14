import * as React from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { AdminLayout } from '@/components/templates/AdminLayout/AdminLayout';
import { useGetCrimeByIdQuery, useUpdateCrimeStatusMutation } from '@/services/crimeApi';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft, RefreshCw, AlertCircle, FolderOpen,
  LayoutDashboard, Paperclip, Users, Scale, Clock, ClipboardList,
} from 'lucide-react';
import { CRIME_STATUS_COLORS, CRIME_STATUS_STEPS } from '../types';
import { CrimeStatusWorkflow } from './CrimeStatusWorkflow';
import { OverviewTab } from './tabs/OverviewTab';
import { SuspectsTab } from './tabs/SuspectsTab';
import { EvidenceTab } from './tabs/EvidenceTab';
import { LegalSectionsTab } from './tabs/LegalSectionsTab';
import { TimelineTab } from './tabs/TimelineTab';
import { ActivityTab } from './tabs/ActivityTab';
import type { CrimeStatus } from '@/services/crimeApi';
import type { CrimeTab } from '@/store/slices/crimeDetailsSlice';

const TAB_CONFIG: { value: CrimeTab; label: string; icon: React.ElementType }[] = [
  { value: 'overview', label: 'Overview', icon: LayoutDashboard },
  { value: 'evidence', label: 'Evidence', icon: Paperclip },
  { value: 'suspects', label: 'Suspects', icon: Users },
  { value: 'legal', label: 'Legal Sections', icon: Scale },
  { value: 'timeline', label: 'Timeline', icon: Clock },
  { value: 'activity', label: 'Activity', icon: ClipboardList },
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

  const handleStatusChange = async (status: CrimeStatus) => {
    if (!id) return;
    await updateStatus({ id, status }).unwrap();
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
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
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
                </div>
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
                <EvidenceTab crimeId={crimeData.id} />
              </TabsContent>

              <TabsContent value="suspects" className="mt-0">
                <SuspectsTab crimeId={crimeData.id} />
              </TabsContent>

              <TabsContent value="legal" className="mt-0">
                <LegalSectionsTab crimeId={crimeData.id} />
              </TabsContent>

              <TabsContent value="timeline" className="mt-0">
                <TimelineTab crimeId={crimeData.id} />
              </TabsContent>

              <TabsContent value="activity" className="mt-0">
                <ActivityTab crimeId={crimeData.id} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </AdminLayout>
  );
}
