import * as React from 'react';
import { DashboardLayout } from '@/components/templates/DashboardLayout';
import { Typography } from '@/components/atoms/Typography';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { DatePicker } from '@/components/atoms/DatePicker';
import { useGetDistrictsQuery } from '@/services/districtsApi';
import { useGetStationsQuery } from '@/services/policeStationsApi';
import { useGetCrimeCategoriesQuery } from '@/services/crimeCategoryApi';
import { useAppSelector } from '@/store/hooks';
import { useAnalyticsFilters } from '@/hooks/useAnalyticsFilters';
import usePermissions from '@/hooks/usePermissions';
import {
  useGetEfirsQuery,
  useCreateEfirMutation,
  useUpdateEfirStatusMutation,
  useUploadEfirEvidenceMutation,
  type Efir
} from '@/services/efirApi';
import {
  FileText,
  Search,
  Send,
  CheckCircle,
  AlertTriangle,
  Clock,
  Upload,
  ArrowRight,
  ChevronLeft,
  FileCheck,
  Plus
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export function EfirPage() {
  // Dialog state for Add FIR
  const [openAddFir, setOpenAddFir] = React.useState(false);

  // Citizen form state (now reused as internal FIR creation form)
  const [complainantName, setComplainantName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [district, setDistrict] = React.useState('');
  const [policeStation, setPoliceStation] = React.useState('');
  const [incidentType, setIncidentType] = React.useState('');
  const [incidentDate, setIncidentDate] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [evidenceName, setEvidenceName] = React.useState('');
  const [witnessInfo, setWitnessInfo] = React.useState('');
  const [declared, setDeclared] = React.useState(false);
  

  // Officer view state
  const [selectedOfficerEfirId, setSelectedOfficerEfirId] = React.useState<string | null>(null);
  const [officerNotes, setOfficerNotes] = React.useState('');
  const [assignedOfficer, setAssignedOfficer] = React.useState('');

  // RTK Query endpoints
  const { data: districts = [] } = useGetDistrictsQuery();
  const { data: crimeCategories = [] } = useGetCrimeCategoriesQuery();
  const { data: stations = [] } = useGetStationsQuery(district ? { districtId: district } : undefined);
  const [createEfir, { isLoading: isSubmitting }] = useCreateEfirMutation();
  const [updateEfirStatus, { isLoading: isUpdatingStatus }] = useUpdateEfirStatusMutation();
  const [uploadEvidence] = useUploadEfirEvidenceMutation();

  

  // Initialize district, station, category defaults when data loads
  const analyticsFilters = useAnalyticsFilters();
  const globalFilters = useAppSelector((s) => s.globalFilters);
  const { hasPermission } = usePermissions();

  // Build query params for fetching E-FIRs (analytics context takes precedence)
  const efirQueryParams = React.useMemo(() => {
    const d = analyticsFilters?.districtId ?? globalFilters.district ?? undefined;
    const s = analyticsFilters?.stationId ?? globalFilters.policeStation ?? undefined;
    if (!d && !s) return undefined;
    return { districtId: d, stationId: s };
  }, [analyticsFilters, globalFilters]);

  const { data: efirs = [], refetch } = useGetEfirsQuery(efirQueryParams);

  const selectedOfficerEfir = React.useMemo(() => {
    return efirs.find(e => e.firId === selectedOfficerEfirId) || null;
  }, [efirs, selectedOfficerEfirId]);

  React.useEffect(() => {
    if (selectedOfficerEfir) {
      setOfficerNotes(selectedOfficerEfir.officerNotes || '');
      setAssignedOfficer(selectedOfficerEfir.assignedOfficerId || '');
    }
  }, [selectedOfficerEfir]);

  // Defaults from APIs
  React.useEffect(() => {
    if (!district && districts && districts.length > 0) {
      setDistrict(districts[0].id);
    }
  }, [districts, district]);

  React.useEffect(() => {
    if ((!policeStation || policeStation === '') && stations && stations.length > 0) {
      setPoliceStation(stations[0].id);
    }
  }, [stations, policeStation]);

  React.useEffect(() => {
    if (!incidentType && crimeCategories && crimeCategories.length > 0) {
      setIncidentType(crimeCategories[0].crime_category_name || '');
    }
  }, [crimeCategories, incidentType]);

  // When opening Add FIR, prefill district/station from analytics context or global filters
  React.useEffect(() => {
    if (openAddFir) {
      // analyticsFilters has districtId and stationId
      if (analyticsFilters?.districtId) {
        setDistrict(analyticsFilters.districtId);
      } else if (globalFilters.district) {
        setDistrict(globalFilters.district);
      }

      if (analyticsFilters?.stationId) {
        setPoliceStation(analyticsFilters.stationId);
      } else if (globalFilters.policeStation) {
        setPoliceStation(globalFilters.policeStation);
      }
    }
  }, [openAddFir, analyticsFilters, globalFilters]);

  // Citizen submit handler
  const handleSubmitEfir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!declared) return;

    try {
        const payload = {
          complainantName,
          phone,
          district,
          policeStation: policeStation || `${district} Main Station`,
          incidentType,
          incidentDate,
          description,
          evidenceUrls: evidenceName ? [evidenceName] : [],
        };
        console.log('Creating FIR with payload:', payload);
      const res = await createEfir({
          ...payload,
      }).unwrap();

      // Close dialog, reset form and refresh queue so new FIR is visible
      setOpenAddFir(false);
      resetForm();
      refetch();
    } catch (err) {
      console.error("Error submitting E-FIR:", err);
    }
  };

  // Reset form helper
  const resetForm = () => {
    setComplainantName('');
    setPhone('');
    setPoliceStation('');
    setIncidentType('theft');
    setIncidentDate('');
    setDescription('');
    setEvidenceName('');
    setWitnessInfo('');
    setDeclared(false);
  };

  // Officer action handler
  const handleOfficerAction = async (status: Efir['status']) => {
    if (!selectedOfficerEfirId) return;
    try {
      await updateEfirStatus({
        firId: selectedOfficerEfirId,
        status,
        officerNotes,
        assignedOfficerId: assignedOfficer || null,
      }).unwrap();
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  // Officer metrics
  const metrics = React.useMemo(() => {
    return {
      submitted: efirs.filter(e => e.status === 'submitted').length,
      underReview: efirs.filter(e => e.status === 'under_review').length,
      approved: efirs.filter(e => e.status === 'approved' || e.status === 'assigned').length,
      rejected: efirs.filter(e => e.status === 'rejected').length,
    };
  }, [efirs]);

  return (
    <DashboardLayout title="E-FIR Workspace">
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        
        {/* Dialog for creating FIRs (officer-only) */}
        <Dialog open={openAddFir} onOpenChange={setOpenAddFir}>
          <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 font-bold text-foreground">
                <FileText className="h-5 w-5 text-primary" />
                Create FIR
              </DialogTitle>
            </DialogHeader>
            <CardContent className="">
              <form onSubmit={handleSubmitEfir} className="space-y-4 text-xs">
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest block">1. Complainant Information</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-muted-foreground font-semibold">Complainant</label>
                      <Input
                        value={complainantName}
                        onChange={(e) => setComplainantName(e.target.value)}
                        placeholder="e.g. Ramesh Hegde"
                        className="text-xs h-9"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-muted-foreground font-semibold">Contact Phone Number</label>
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. +91 98450 12345"
                        className="text-xs h-9 font-data"
                        required
                      />
                    </div>
                  </div>
                </div>

                <Separator className="bg-border/30" />

                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest block">2. Incident Details</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-muted-foreground font-semibold">Incident Category</label>
                      <select
                        value={incidentType}
                        onChange={(e) => setIncidentType(e.target.value)}
                        className="w-full h-9 px-2 rounded-md border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        {(crimeCategories || []).map((c) => (
                          <option key={c.ROWID} value={c.crime_category_name}>{c.crime_category_name}</option>
                        ))}
                      </select>
                    </div>
                    {hasPermission('view_district_filters') && (
                      <div className="space-y-1">
                        <label className="text-muted-foreground font-semibold">District Location</label>
                        <select
                          value={district}
                          onChange={(e) => {
                            const newDistrict = e.target.value;
                            setDistrict(newDistrict);
                            setPoliceStation('');
                          }}
                          className="w-full h-9 px-2 rounded-md border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          {districts.map((d) => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="space-y-1">
                      <label className="text-muted-foreground font-semibold">Incident Date</label>
                      <DatePicker
                        value={incidentDate}
                        onChange={(e) => setIncidentDate(e.target.value)}
                        className="w-full bg-background"
                        placeholder="Select Incident Date"
                        id="incident-date-picker"
                      />
                    </div>
                  </div>
                  {hasPermission('view_district_filters') && (
                    <div className="space-y-1">
                      <label className="text-muted-foreground font-semibold">Specific Area / Nearest Police Station (Optional)</label>
                      <select
                        value={policeStation}
                        onChange={(e) => setPoliceStation(e.target.value)}
                        className="w-full h-9 px-2 rounded-md border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        id="police-station-select"
                      >
                        <option value="">-- Select Police Station --</option>
                        {(stations || []).map((ps) => (
                          <option key={ps.id} value={ps.id}>{ps.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-muted-foreground font-semibold">Incident Description (Brief narrative of events)</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe what occurred, items stolen, physical markers of suspects, or transaction details..."
                      className="w-full h-24 p-2.5 rounded-md border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-normal resize-none"
                      required
                    />
                  </div>
                </div>

                <Separator className="bg-border/30" />

                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest block">3. Auxiliary Information</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-muted-foreground font-semibold">Evidence</label>
                      <div className="flex gap-2">
                        <Input
                          value={evidenceName}
                          onChange={(e) => setEvidenceName(e.target.value)}
                          placeholder="e.g. screenshots.pdf or clips.mp4"
                          className="text-xs h-9"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-muted-foreground font-semibold">Witness Names & Contact (Optional)</label>
                      <Input
                        value={witnessInfo}
                        onChange={(e) => setWitnessInfo(e.target.value)}
                        placeholder="e.g. Anand Gowda (+91 99000-11122)"
                        className="text-xs h-9"
                      />
                    </div>
                  </div>
                </div>

                <Separator className="bg-border/30" />

                <div className="bg-muted/10 p-3 rounded border border-border/30 flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={declared}
                    onChange={(e) => setDeclared(e.target.checked)}
                    className="h-4 w-4 rounded border-border accent-primary cursor-pointer mt-0.5"
                    id="declaration-cb"
                  />
                  <label htmlFor="declaration-cb" className="text-[10px] text-muted-foreground leading-normal select-none cursor-pointer">
                    <strong className="text-foreground block mb-0.5">Legal Declaration & Oath</strong>
                    I hereby declare that the information provided is true to the best of my knowledge.
                  </label>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    disabled={!declared || isSubmitting}
                    className="h-9 px-6 font-bold text-xs gap-1.5"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Create FIR</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </DialogContent>
        </Dialog>

        {/* ── OFFICER REVIEW QUEUE WORKSPACE ── */}
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {selectedOfficerEfir ? (
              /* Officer Detailed Inspection View */
              <div className="max-w-3xl mx-auto space-y-5">
                <Button
                  onClick={() => setSelectedOfficerEfirId(null)}
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground h-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Back to Review Queue</span>
                </Button>

                <Card className="border border-border bg-card shadow-lg text-xs">
                  <div className="p-4 border-b border-border/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Officer Investigation Dashboard</span>
                      <Typography variant="heading-sm" className="font-data font-bold text-foreground mt-0.5">{selectedOfficerEfir.firId}</Typography>
                    </div>
                    <Badge variant={
                      selectedOfficerEfir.status === 'submitted' ? 'secondary' :
                      selectedOfficerEfir.status === 'under_review' ? 'warning' :
                      selectedOfficerEfir.status === 'rejected' ? 'risk-critical' : 'success'
                    } size="sm" className="uppercase tracking-wider">
                      {selectedOfficerEfir.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <CardContent className="p-5 space-y-5">
                    
                    {/* Complainant details */}
                    <div className="grid grid-cols-2 gap-4 leading-relaxed text-[11px]">
                      <div>
                        <span className="text-muted-foreground font-semibold block">Complainant</span>
                        <strong className="text-foreground text-sm">{selectedOfficerEfir.complainantName}</strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground font-semibold block">Phone Number</span>
                        <strong className="text-foreground text-sm font-data">{selectedOfficerEfir.phone}</strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground font-semibold block">Incident Date</span>
                        <strong className="text-foreground font-data">{selectedOfficerEfir.incidentDate}</strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground font-semibold block">Incident Category</span>
                        <strong className="text-foreground capitalize">{selectedOfficerEfir.incidentType}</strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground font-semibold block">District</span>
                        <strong className="text-foreground capitalize">{selectedOfficerEfir.district}</strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground font-semibold block">Police Station Hub</span>
                        <strong className="text-foreground">{selectedOfficerEfir.policeStation}</strong>
                      </div>
                      <div className="col-span-2 border-t border-border/30 pt-3">
                        <span className="text-muted-foreground font-semibold block mb-1">Incident Description</span>
                        <p className="text-muted-foreground leading-relaxed bg-muted/15 border border-border/35 p-3 rounded-md">
                          {selectedOfficerEfir.description}
                        </p>
                      </div>
                    </div>

                    {/* Evidence List */}
                    <div className="space-y-2 border-t border-border/30 pt-4">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-widest block">Evidence</span>
                      {selectedOfficerEfir.evidenceUrls.length === 0 ? (
                        <div className="text-[10px] text-muted-foreground italic">No evidence files provided.</div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {selectedOfficerEfir.evidenceUrls.map((url, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 border border-border/40 rounded bg-muted/5">
                              <span className="font-semibold text-[10px] text-foreground truncate max-w-[200px]">{url}</span>
                              <Badge variant="outline" size="sm" className="bg-primary/5 text-primary text-[8px] py-0 cursor-pointer hover:bg-primary/10">Download</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <Separator className="bg-border/30" />

                    {/* Officer actions & notes */}
                    <div className="space-y-4 bg-muted/10 border border-border/40 p-4 rounded-lg">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-widest block">Investigation Control Board</span>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-muted-foreground font-semibold text-[10px] uppercase">Assign Officer</label>
                          <select
                            value={assignedOfficer}
                            onChange={(e) => setAssignedOfficer(e.target.value)}
                            className="w-full h-8.5 px-2 rounded border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value="">-- Assign Investigator --</option>
                            <option value="Insp. A. Kumar">Insp. A. Kumar (District Captain)</option>
                            <option value="Insp. M. Gowda">Insp. M. Gowda (Cyber Command)</option>
                            <option value="Insp. S. Patil">Insp. S. Patil (Special Patrol)</option>
                          </select>
                        </div>
                        
                        <div className="space-y-1.5">
                          <label className="text-muted-foreground font-semibold text-[10px] uppercase block">Action Status</label>
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            <Button
                              onClick={() => handleOfficerAction('under_review')}
                              variant="outline"
                              size="sm"
                              className="h-8 text-[10px] font-bold border-warning/50 text-warning bg-warning/5 hover:bg-warning/15"
                            >
                              Under Review
                            </Button>
                            <Button
                              onClick={() => handleOfficerAction(assignedOfficer ? 'assigned' : 'approved')}
                              variant="outline"
                              size="sm"
                              className="h-8 text-[10px] font-bold border-success/50 text-success bg-success/5 hover:bg-success/15"
                            >
                              Approve
                            </Button>
                            <Button
                              onClick={() => handleOfficerAction('rejected')}
                              variant="outline"
                              size="sm"
                              className="h-8 text-[10px] font-bold border-danger/50 text-danger bg-danger/5 hover:bg-danger/15"
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-muted-foreground font-semibold text-[10px] uppercase">Officer Decision Notes</label>
                        <textarea
                          value={officerNotes}
                          onChange={(e) => setOfficerNotes(e.target.value)}
                          placeholder="Log notes about verification runs, CDR phone matches, or details requests..."
                          className="w-full h-20 p-2 rounded border border-border bg-card text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary leading-normal resize-none"
                        />
                      </div>

                      <div className="flex justify-end gap-2.5 pt-1.5 border-t border-border/20">
                        <Button
                          onClick={() => handleOfficerAction(selectedOfficerEfir.status)}
                          disabled={isUpdatingStatus}
                          className="h-8 text-xs font-bold"
                        >
                          Save Notes & Assignment
                        </Button>
                      </div>
                    </div>

                    {/* Status Visual Timeline */}
                    <div className="space-y-3 border-t border-border/30 pt-4">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-widest block flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        Ledger Audit Timeline
                      </span>
                      <div className="relative border-l border-border pl-3.5 space-y-4 text-[10px]">
                        {selectedOfficerEfir.timeline.map((item, idx) => (
                          <div key={idx} className="relative space-y-0.5">
                            <div className="absolute -left-[20.5px] top-1 size-2 rounded-full border border-border bg-card flex items-center justify-center">
                              <div className="size-1 bg-primary rounded-full" />
                            </div>
                            <div className="text-[9px] font-bold text-muted-foreground">{item.date}</div>
                            <div className="font-bold text-foreground">{item.event}</div>
                            <p className="text-muted-foreground leading-relaxed">{item.details}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                  </CardContent>
                </Card>
              </div>
            ) : (
              /* Officer Queue List View */
              <div className="space-y-6">
                
                {/* Officer metrics cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="p-3.5 border border-border bg-card shadow-xs">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">New Submitted</span>
                    <div className="text-xl font-bold font-data text-foreground mt-1">{metrics.submitted}</div>
                  </Card>
                  <Card className="p-3.5 border border-border bg-card shadow-xs">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Under Review</span>
                    <div className="text-xl font-bold font-data text-warning mt-1">{metrics.underReview}</div>
                  </Card>
                  <Card className="p-3.5 border border-border bg-card shadow-xs">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Approved Cases</span>
                    <div className="text-xl font-bold font-data text-success mt-1">{metrics.approved}</div>
                  </Card>
                  <Card className="p-3.5 border border-border bg-card shadow-xs">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Rejected Cases</span>
                    <div className="text-xl font-bold font-data text-danger mt-1">{metrics.rejected}</div>
                  </Card>
                </div>

                {/* Queue list table */}
                <Card className="border border-border bg-card shadow-md">
                  <div className="p-4 border-b border-border/60 flex items-center justify-between">
                    <div>
                      <Typography variant="heading-sm" className="font-bold text-foreground">
                        E-FIR Ingestion Review Queue
                      </Typography>
                      <Typography variant="caption" color="muted">
                        Patrol division workflow for verifying submissions.
                      </Typography>
                    </div>
                    <div>
                      <Button onClick={() => { setPoliceStation((stations && stations[0]) ? stations[0].id : ''); setOpenAddFir(true); }} className="gap-2">
                        <Plus className="mr-2 h-4 w-4" />
                        Add FIR
                      </Button>
                    </div>
                  </div>
                  <CardContent className="p-0 overflow-x-auto text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-muted/10 border-b border-border text-muted-foreground font-bold text-[10px] uppercase">
                          <th className="p-3.5">E-FIR ID</th>
                          <th className="p-3.5">Complainant</th>
                          <th className="p-3.5">Incident Category</th>
                          <th className="p-3.5">District</th>
                          <th className="p-3.5">Submitted Date</th>
                          <th className="p-3.5">Status</th>
                          <th className="p-3.5">Investigator</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 font-medium text-foreground">
                        {efirs.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-muted-foreground">
                              No E-FIR records located in digital databases.
                            </td>
                          </tr>
                        ) : (
                          efirs.map((e) => (
                            <tr
                              key={e.firId}
                              onClick={() => setSelectedOfficerEfirId(e.firId)}
                              className="hover:bg-muted/10 transition-colors cursor-pointer"
                            >
                              <td className="p-3.5 font-data font-bold text-primary hover:underline">{e.firId}</td>
                              <td className="p-3.5">{e.complainantName}</td>
                              <td className="p-3.5 capitalize">{e.incidentType}</td>
                              <td className="p-3.5 capitalize">{e.district}</td>
                              <td className="p-3.5 font-data text-[11px] text-muted-foreground">{e.incidentDate}</td>
                              <td className="p-3.5">
                                <Badge variant={
                                  e.status === 'submitted' ? 'secondary' :
                                  e.status === 'under_review' ? 'warning' :
                                  e.status === 'rejected' ? 'risk-critical' : 'success'
                                } size="sm" className="py-0.5 scale-90">
                                  {e.status.replace('_', ' ')}
                                </Badge>
                              </td>
                              <td className="p-3.5 text-muted-foreground font-semibold">
                                {e.assignedOfficerId || <span className="italic opacity-60">Unassigned</span>}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

      </div>
    </DashboardLayout>
  );
}

export default EfirPage;
