import * as React from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DashboardLayout } from '@/components/templates/DashboardLayout';
import { Typography } from '@/components/atoms/Typography';
import { Badge } from '@/components/atoms/Badge';
import { Icon } from '@/components/atoms/Icon';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// New Atoms
import { DatePicker } from '@/components/atoms/DatePicker';
import { EmptyState } from '@/components/atoms/EmptyState';
import { DateRangePicker } from '@/components/ui/date-range-picker';

// New Molecules
import { DateRangeFilter } from '@/components/molecules/DateRangeFilter';
import { DistrictFilter } from '@/components/molecules/DistrictFilter';
import { CrimeTypeFilter } from '@/components/molecules/CrimeTypeFilter';
import { SeverityFilter } from '@/components/molecules/SeverityFilter';
import { NotificationItem } from '@/components/molecules/NotificationItem';
import { MetricCard } from '@/components/molecules/MetricCard';
import { TableToolbar } from '@/components/molecules/TableToolbar';
import { PaginationControls } from '@/components/molecules/PaginationControls';
import { ErrorState } from '@/components/molecules/ErrorState';

// New Organisms
import { FilterPanel } from '@/components/organisms/FilterPanel';
import { AnalyticsHeader } from '@/components/organisms/AnalyticsHeader';
import { CrimeDataTable } from '@/components/organisms/CrimeDataTable';
import { AlertCenter } from '@/components/organisms/AlertCenter';
import { ReportGenerator } from '@/components/organisms/ReportGenerator';
import { HotspotControlPanel } from '@/components/organisms/HotspotControlPanel';
import { NetworkDetailsPanel } from '@/components/organisms/NetworkDetailsPanel';

export function DesignSystemPreview() {
  const [activeTab, setActiveTab] = React.useState('tokens');
  
  // Date Picker state
  const [date, setDate] = React.useState('2026-06-07');
  
  // Date Range state
  const [startDate, setStartDate] = React.useState('2026-06-01');
  const [endDate, setEndDate] = React.useState('2026-06-07');
  
  // Filters state
  const [district, setDistrict] = React.useState('all');
  const [crimeType, setCrimeType] = React.useState('all');
  const [severities, setSeverities] = React.useState<string[]>(['high', 'critical']);
  
  // Hotspot config state
  const [mapConfig, setMapConfig] = React.useState({
    showHeatmap: true,
    showClusters: false,
    showPredictions: true,
    radius: 150,
    minIntensity: 45,
    timeRange: '7d',
  });

  const handleSeverityToggle = (sev: string) => {
    setSeverities((prev) =>
      prev.includes(sev) ? prev.filter((s) => s !== sev) : [...prev, sev]
    );
  };

  const handleRetry = () => {
    console.log('Retry triggered');
  };

  return (
    <DashboardLayout title="Design System Preview">
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Title */}
        <div>
          <Typography variant="display-md" as="h1">
            CrimeLens Design System
          </Typography>
          <Typography variant="body-lg" color="muted" className="mt-1">
            Component specifications, interactive demonstrations, and architectural references.
          </Typography>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 w-full md:w-fit">
            <TabsTrigger value="tokens">Design Tokens</TabsTrigger>
            <TabsTrigger value="atoms">Atoms</TabsTrigger>
            <TabsTrigger value="molecules">Molecules</TabsTrigger>
            <TabsTrigger value="organisms">Organisms</TabsTrigger>
          </TabsList>

          {/* ========================================== */}
          {/* TOKENS TAB */}
          {/* ========================================== */}
          <TabsContent value="tokens" className="space-y-8 pt-4">
            {/* Color Swatches */}
            <section aria-labelledby="colors-heading" className="space-y-4">
              <div>
                <Typography variant="heading-lg" as="h2" id="colors-heading">
                  Color System
                </Typography>
                <Typography variant="body-sm" color="muted" className="mt-0.5">
                  Government-inspired, dark-first semantic color palettes.
                </Typography>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                <ColorSwatch label="Background" className="bg-background" />
                <ColorSwatch label="Foreground" className="bg-foreground" />
                <ColorSwatch label="Card" className="bg-card" />
                <ColorSwatch label="Primary" className="bg-primary" />
                <ColorSwatch label="Secondary" className="bg-secondary" />
                <ColorSwatch label="Accent" className="bg-accent" />
                <ColorSwatch label="Muted" className="bg-muted" />
                <ColorSwatch label="Destructive" className="bg-destructive" />
                <ColorSwatch label="Success" className="bg-success" />
                <ColorSwatch label="Warning" className="bg-warning" />
                <ColorSwatch label="Danger" className="bg-danger" />
                <ColorSwatch label="Info" className="bg-info" />
              </div>

              <Typography variant="heading-sm" className="mt-4">Risk Level Scale</Typography>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <ColorSwatch label="Low Risk" className="bg-risk-low text-risk-low-foreground" />
                <ColorSwatch label="Medium Risk" className="bg-risk-medium text-risk-medium-foreground" />
                <ColorSwatch label="High Risk" className="bg-risk-high text-risk-high-foreground" />
                <ColorSwatch label="Critical Risk" className="bg-risk-critical text-risk-critical-foreground" />
              </div>
            </section>

            <Separator />

            {/* Typography */}
            <section aria-labelledby="typo-heading" className="space-y-4">
              <div>
                <Typography variant="heading-lg" as="h2" id="typo-heading">
                  Typography Scale
                </Typography>
                <Typography variant="body-sm" color="muted" className="mt-0.5">
                  Inter Variable typeface configured for data-dense dashboards.
                </Typography>
              </div>

              <div className="space-y-4 bg-card/20 p-4 border rounded-lg">
                <div className="flex justify-between items-baseline border-b pb-2"><Typography variant="display-xl">Display XL</Typography><span className="text-xs text-muted-foreground font-data">48px / 700</span></div>
                <div className="flex justify-between items-baseline border-b pb-2"><Typography variant="display-lg">Display LG</Typography><span className="text-xs text-muted-foreground font-data">36px / 700</span></div>
                <div className="flex justify-between items-baseline border-b pb-2"><Typography variant="display-md">Display MD</Typography><span className="text-xs text-muted-foreground font-data">30px / 600</span></div>
                <div className="flex justify-between items-baseline border-b pb-2"><Typography variant="heading-xl">Heading XL</Typography><span className="text-xs text-muted-foreground font-data">24px / 600</span></div>
                <div className="flex justify-between items-baseline border-b pb-2"><Typography variant="heading-lg">Heading LG</Typography><span className="text-xs text-muted-foreground font-data">20px / 600</span></div>
                <div className="flex justify-between items-baseline border-b pb-2"><Typography variant="heading-md">Heading MD</Typography><span className="text-xs text-muted-foreground font-data">18px / 600</span></div>
                <div className="flex justify-between items-baseline border-b pb-2"><Typography variant="heading-sm">Heading SM</Typography><span className="text-xs text-muted-foreground font-data">16px / 600</span></div>
                <div className="flex justify-between items-baseline border-b pb-2"><Typography variant="body-lg">Body Large</Typography><span className="text-xs text-muted-foreground font-data">16px / 400</span></div>
                <div className="flex justify-between items-baseline border-b pb-2"><Typography variant="body-md">Body Medium</Typography><span className="text-xs text-muted-foreground font-data">14px / 400</span></div>
                <div className="flex justify-between items-baseline border-b pb-2"><Typography variant="body-sm">Body Small</Typography><span className="text-xs text-muted-foreground font-data">12px / 400</span></div>
                <div className="flex justify-between items-baseline pb-2"><Typography variant="caption">Caption text</Typography><span className="text-xs text-muted-foreground font-data">11px / 500</span></div>
              </div>
            </section>

            <Separator />

            {/* Layout parameters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Spacing */}
              <section aria-labelledby="spacing-heading" className="space-y-4">
                <Typography variant="heading-md" as="h3" id="spacing-heading">
                  Spacing Scale
                </Typography>
                <div className="space-y-2 bg-card p-3 rounded-md border">
                  {[{ t: '1', w: '4px' }, { t: '2', w: '8px' }, { t: '3', w: '12px' }, { t: '4', w: '16px' }, { t: '6', w: '24px' }, { t: '8', w: '32px' }].map((item) => (
                    <div key={item.t} className="flex items-center gap-2">
                       <span className="w-8 text-[10px] text-muted-foreground font-data text-right">{item.w}</span>
                      <div className="h-2 rounded-sm bg-primary" style={{ width: item.w }} />
                    </div>
                  ))}
                </div>
              </section>

              {/* Radius */}
              <section aria-labelledby="radius-heading" className="space-y-4">
                <Typography variant="heading-md" as="h3" id="radius-heading">
                  Border Radius
                </Typography>
                <div className="flex flex-wrap gap-3 p-3 bg-card rounded-md border justify-center">
                  {[{ l: 'xs', v: '2px' }, { l: 'sm', v: '4px' }, { l: 'md', v: '6px' }, { l: 'lg', v: '8px' }].map((item) => (
                    <div key={item.l} className="flex flex-col items-center gap-1">
                      <div className="size-10 border-2 border-primary bg-card" style={{ borderRadius: item.v }} />
                      <span className="text-[10px] text-muted-foreground font-data">{item.l} ({item.v})</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Shadows */}
              <section aria-labelledby="shadows-heading" className="space-y-4">
                <Typography variant="heading-md" as="h3" id="shadows-heading">
                  Box Shadows
                </Typography>
                <div className="flex flex-wrap gap-4 p-3 bg-card rounded-md border justify-center">
                  {['xs', 'sm', 'md', 'lg'].map((s) => (
                    <div key={s} className={`size-12 rounded-md bg-card border flex items-center justify-center shadow-${s}`}>
                      <span className="text-[10px] text-muted-foreground font-data font-semibold">{s}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </TabsContent>

          {/* ========================================== */}
          {/* ATOMS TAB */}
          {/* ========================================== */}
          <TabsContent value="atoms" className="space-y-6 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Button & Badges */}
              <Card>
                <CardHeader className="pb-3"><CardTitle>Action & Status Atoms</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  {/* Buttons */}
                  <div className="space-y-2">
                    <Typography variant="caption" color="muted" className="font-semibold uppercase tracking-wider block">Buttons</Typography>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm">Primary</Button>
                      <Button variant="secondary" size="sm">Secondary</Button>
                      <Button variant="outline" size="sm">Outline</Button>
                      <Button variant="ghost" size="sm">Ghost</Button>
                      <Button variant="destructive" size="sm">Destructive</Button>
                    </div>
                  </div>
                  
                  {/* Badges */}
                  <div className="space-y-2">
                    <Typography variant="caption" color="muted" className="font-semibold uppercase tracking-wider block">Badges</Typography>
                    <div className="flex flex-wrap gap-2">
                      <Badge>Default</Badge>
                      <Badge variant="success" dot>Success</Badge>
                      <Badge variant="warning">Warning</Badge>
                      <Badge variant="danger">Danger</Badge>
                      <Badge variant="info">Info</Badge>
                      <Badge variant="risk-critical" dot>Critical Risk</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Data Entry Fields */}
              <Card>
                <CardHeader className="pb-3"><CardTitle>Form Fields & Entries</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {/* Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label htmlFor="demo-input" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Text Input</label>
                      <Input id="demo-input" placeholder="Type query..." className="h-9" />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="demo-date" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Date Picker</label>
                      <DatePicker id="demo-date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-card" />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="demo-datetime" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Date & Time Picker</label>
                      <DatePicker id="demo-datetime" showTime value={date.includes('T') ? date : `${date}T12:00`} onChange={(e) => setDate(e.target.value)} className="bg-card" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Date Range Picker</label>
                      <DateRangePicker value={{ start: startDate, end: endDate }} onChange={(range) => { setStartDate(range.start || ''); setEndDate(range.end || ''); }} className="bg-card" />
                    </div>
                  </div>

                  {/* Textarea */}
                  <div className="space-y-1">
                    <label htmlFor="demo-textarea" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Textarea</label>
                    <Textarea id="demo-textarea" placeholder="Enter details..." className="min-h-[60px]" />
                  </div>

                  {/* Checkbox, Radio, Switch */}
                  <div className="grid grid-cols-3 gap-4 pt-2">
                    {/* Checkbox */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Checkbox</span>
                      <div className="flex items-center gap-2">
                        <Checkbox id="demo-chk" checked />
                        <label htmlFor="demo-chk" className="text-xs text-foreground cursor-pointer">Checked</label>
                      </div>
                    </div>

                    {/* Switch */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Switch</span>
                      <div className="flex items-center gap-2">
                        <Switch id="demo-sw" checked />
                        <label htmlFor="demo-sw" className="text-xs text-foreground cursor-pointer">On</label>
                      </div>
                    </div>

                    {/* Radio Group */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Radio Group</span>
                      <RadioGroup defaultValue="opt1" className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <RadioGroupItem value="opt1" id="opt1" />
                          <label htmlFor="opt1" className="text-xs text-foreground cursor-pointer">Option A</label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Feedback & Indicators */}
              <Card>
                <CardHeader className="pb-3"><CardTitle>Informational & Feedback Atoms</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {/* Tooltip */}
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground font-semibold">Hover Tooltip:</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm">Hover over me</Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Intelligence detail tooltip.
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Skeletons */}
                  <div className="space-y-2">
                    <span className="text-xs text-muted-foreground font-semibold">Skeleton Loaders:</span>
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-8 rounded-full" />
                      <div className="space-y-1.5 flex-1">
                        <Skeleton className="h-3.5 w-1/3" />
                        <Skeleton className="h-3 w-3/4" />
                      </div>
                    </div>
                  </div>

                  {/* Alerts */}
                  <div className="space-y-2">
                    <span className="text-xs text-muted-foreground font-semibold">Alert Messages:</span>
                    <Alert variant="warning">
                      <Icon icon={AlertTriangle} size="xs" />
                      <AlertTitle>Spike Warning</AlertTitle>
                      <AlertDescription>Crime counts increased by 15% in Sector 2.</AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>

              {/* Empty State */}
              <Card>
                <CardHeader className="pb-3"><CardTitle>Empty State</CardTitle></CardHeader>
                <CardContent>
                  <EmptyState
                    title="No Documents Logged"
                    description="No case reports have been generated for the selected timeframe."
                    actionLabel="Add Document"
                    onAction={() => console.log('Action')}
                    className="min-h-[180px] p-4"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ========================================== */}
          {/* MOLECULES TAB */}
          {/* ========================================== */}
          <TabsContent value="molecules" className="space-y-6 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Custom Filters */}
              <Card>
                <CardHeader className="pb-3"><CardTitle>Advanced Filters</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <DistrictFilter value={district} onValueChange={setDistrict} />
                  <CrimeTypeFilter value={crimeType} onValueChange={setCrimeType} />
                  <DateRangeFilter
                    startDate={startDate}
                    endDate={endDate}
                    onStartDateChange={setStartDate}
                    onEndDateChange={setEndDate}
                  />
                  <SeverityFilter
                    selectedSeverities={severities}
                    onSeverityToggle={handleSeverityToggle}
                  />
                </CardContent>
              </Card>

              {/* Stat Visualizations */}
              <div className="space-y-4">
                <MetricCard
                  label="Total Narcotics Cases"
                  value="1,492"
                  change={15.4}
                  changeLabel="vs last quarter"
                  sparklineData={[10, 15, 8, 20, 25, 18, 30, 42]}
                  status="warning"
                />
                
                <MetricCard
                  label="Response Frequency"
                  value="98.2%"
                  change={-1.2}
                  changeLabel="vs last week"
                  sparklineData={[98, 97, 99, 98, 97, 98, 99, 98]}
                  status="success"
                />

                <ErrorState
                  title="Database Timeout"
                  message="Unable to fetch real-time alert logs from Sector 3 stream."
                  onRetry={handleRetry}
                  className="min-h-[160px]"
                />
              </div>

              {/* Notifications / Alerts log */}
              <Card className="md:col-span-2">
                <CardHeader className="pb-3"><CardTitle>Incident & Alert Notifications</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <NotificationItem
                    id="1"
                    type="crime-spike"
                    title="Robbery Count Spike"
                    message="3 incidents of armed robbery detected in Downtown within 2 hours. Exceeds historical threshold limits."
                    severity="critical"
                    timestamp="10 min ago"
                    read={false}
                    onViewDetails={() => {}}
                  />
                  <NotificationItem
                    id="2"
                    type="threshold-breach"
                    title="Officer Dispatch Shortage"
                    message="Incident queue in Sector 5 exceeds available response capacity. 4 calls pending response."
                    severity="high"
                    timestamp="1 hour ago"
                    read={true}
                    onViewDetails={() => {}}
                  />
                </CardContent>
              </Card>

              {/* Table Toolbar & Pagination */}
              <Card className="md:col-span-2">
                <CardHeader className="pb-3"><CardTitle>Data Grid Support Molecules</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <TableToolbar
                    searchQuery=""
                    onSearchChange={() => {}}
                    showFilters={true}
                    onToggleFilters={() => {}}
                    onExport={() => {}}
                    activeFilters={[
                      { id: '1', label: 'Sector', value: 'Downtown' },
                      { id: '2', label: 'Severity', value: 'Critical' },
                    ]}
                    onRemoveFilter={() => {}}
                    onClearAllFilters={() => {}}
                  />
                  
                  <PaginationControls
                    currentPage={1}
                    totalPages={8}
                    pageSize={10}
                    onPageChange={() => {}}
                    onPageSizeChange={() => {}}
                    totalRecords={78}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ========================================== */}
          {/* ORGANISMS TAB */}
          {/* ========================================== */}
          <TabsContent value="organisms" className="space-y-6 pt-4">
            {/* Header organism */}
            <AnalyticsHeader
              title="Intelligence Core"
              subtitle="Aggregated crime mapping, syndicate networks, and alert centers."
              onRefresh={() => {}}
              onGenerateReport={() => {}}
              activeFiltersCount={2}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Filter Panel (4 cols) */}
              <div className="lg:col-span-4">
                <FilterPanel
                  startDate={startDate}
                  endDate={endDate}
                  district={district}
                  crimeType={crimeType}
                  selectedSeverities={severities}
                  onStartDateChange={setStartDate}
                  onEndDateChange={setEndDate}
                  onDistrictChange={setDistrict}
                  onCrimeTypeChange={setCrimeType}
                  onSeverityToggle={handleSeverityToggle}
                  onReset={() => {
                    setStartDate('');
                    setEndDate('');
                    setDistrict('all');
                    setCrimeType('all');
                    setSeverities([]);
                  }}
                  onApply={() => console.log('Apply')}
                />
              </div>

              {/* Right Column: Alert Center & Report Generator (8 cols) */}
              <div className="lg:col-span-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Alert Center */}
                  <AlertCenter
                    alerts={[
                      {
                        id: 'a1',
                        type: 'crime-spike',
                        title: 'Spike in Narcotics Arrests',
                        message: 'Sector 4 arrests increased by 30% weekly.',
                        severity: 'high',
                        timestamp: '20m ago',
                        read: false,
                      },
                      {
                        id: 'a2',
                        type: 'threshold-breach',
                        title: 'Critical Assault Rate Warning',
                        message: 'Homicide rate exceeds the defined AAA warning levels.',
                        severity: 'critical',
                        timestamp: '1h ago',
                        read: false,
                      },
                      {
                        id: 'a3',
                        type: 'system',
                        title: 'Sensors Online',
                        message: 'Automated CCTV monitoring nodes verified.',
                        severity: 'low',
                        timestamp: '5h ago',
                        read: true,
                      },
                    ]}
                    onMarkRead={() => {}}
                    onMarkAllRead={() => {}}
                  />

                  {/* Report Generator */}
                  <ReportGenerator
                    isGenerating={false}
                    onGenerateReport={() => {}}
                    onDownloadReport={() => {}}
                    history={[
                      {
                        id: 'r1',
                        title: 'May Sector 2 Crime Analysis',
                        type: 'crime-summary',
                        status: 'ready',
                        createdAt: '2026-06-01',
                        format: 'pdf',
                        size: '4.2 MB',
                      },
                      {
                        id: 'r2',
                        title: 'Syndicate Connection Report',
                        type: 'network-analysis',
                        status: 'generating',
                        createdAt: '2026-06-07',
                        format: 'json',
                      },
                    ]}
                  />
                </div>

                {/* Hotspot & Network Panels */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <HotspotControlPanel
                    config={mapConfig}
                    onConfigChange={setMapConfig}
                  />

                  <NetworkDetailsPanel
                    entity={{
                      id: 'n1',
                      label: 'Marcus "Viper" Vance',
                      type: 'suspect',
                      riskScore: 88,
                      connections: 2,
                      properties: {},
                      propertiesList: [
                        { label: 'Alias', value: 'Viper' },
                        { label: 'Role', value: 'Syndicate Enforcer' },
                        { label: 'Active Sector', value: 'Sector 1 (Downtown)' },
                        { label: 'Last Logged', value: '2026-06-06 22:15' },
                      ],
                      timeline: [
                        { date: '2026-06-06', event: 'Visual Contact Sighting', details: 'Sighted meeting with known cargo driver near Downtown Warehouse.' }
                      ],
                      aiInsights: [
                        'High-priority operational enforcer for the Marcus Vance Syndicate.',
                        'Direct phone connection logged to anonymous burner line under passive intercept.'
                      ]
                    }}
                    connections={[
                      { targetId: 'n2', targetLabel: 'Downtown Warehouse', type: 'located_at', weight: 4 },
                      { targetId: 'n3', targetLabel: 'Northern Syndicate', type: 'associated_with', weight: 5 },
                    ]}
                  />
                </div>
              </div>

              {/* Data Table (12 cols full width) */}
              <div className="lg:col-span-12">
                <Typography variant="heading-md" className="font-semibold mb-3">CrimeDataTable (TanStack Table)</Typography>
                <CrimeDataTable
                  data={[
                    {
                      id: 'c1',
                      caseNumber: 'HY-492018',
                      type: 'burglary',
                      description: 'Forcible entry into retail electronics outlet.',
                      location: 'Downtown / 448 Grand Ave',
                      timestamp: '2026-06-07 04:32',
                      severity: 'medium',
                      status: 'open',
                    },
                    {
                      id: 'c2',
                      caseNumber: 'HY-492022',
                      type: 'narcotics',
                      description: 'Illegal distribution of illegal substances.',
                      location: 'Northern / 1022 Broad St',
                      timestamp: '2026-06-07 08:15',
                      severity: 'high',
                      status: 'investigating',
                    },
                    {
                      id: 'c3',
                      caseNumber: 'HY-492025',
                      type: 'assault',
                      description: 'Aggravated assault involving physical threat.',
                      location: 'Southern / Sector 3 Hub',
                      timestamp: '2026-06-07 09:40',
                      severity: 'critical',
                      status: 'open',
                    },
                    {
                      id: 'c4',
                      caseNumber: 'HY-492030',
                      type: 'theft',
                      description: 'Grand larceny of commercial delivery vehicle.',
                      location: 'Eastern / 540 Industrial Pkwy',
                      timestamp: '2026-06-07 11:20',
                      severity: 'medium',
                      status: 'resolved',
                    },
                  ]}
                  currentPage={1}
                  totalPages={1}
                  pageSize={10}
                  onPageChange={() => {}}
                  onPageSizeChange={() => {}}
                  totalRecords={4}
                  showFilters={false}
                  onToggleFilters={() => {}}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

/* ---------------------------------------------------------------------------
   Helper Swatch Component
   --------------------------------------------------------------------------- */
function ColorSwatch({ label, className }: { label: string; className: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className={cn("h-10 rounded-md border border-border", className)} role="presentation" />
      <span className="text-[10px] text-muted-foreground truncate">{label}</span>
    </div>
  );
}
