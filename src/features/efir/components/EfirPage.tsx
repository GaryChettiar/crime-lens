import * as React from 'react';
import { DashboardLayout } from '@/components/templates/DashboardLayout';
import { Typography } from '@/components/atoms/Typography';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { DatePicker } from '@/components/atoms/DatePicker';
import { DISTRICT_CENTERS } from '@/features/geospatial/data/mockGeospatialData';
import {
  useGetEfirsQuery,
  useCreateEfirMutation,
  useUpdateEfirStatusMutation,
  useUploadEfirEvidenceMutation,
  type Efir
} from '@/services/efirApi';
import {
  FileText,
  Users,
  Search,
  UserCheck,
  Send,
  CheckCircle,
  AlertTriangle,
  Clock,
  Upload,
  ArrowRight,
  ChevronLeft,
  FileCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function EfirPage() {
  const [activeTab, setActiveTab] = React.useState<'citizen' | 'officer'>('citizen');
  const [citizenSubView, setCitizenSubView] = React.useState<'submit' | 'track'>('submit');
  
  // Citizen form state
  const [complainantName, setComplainantName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [district, setDistrict] = React.useState('Bangalore');
  const [policeStation, setPoliceStation] = React.useState('');
  const [incidentType, setIncidentType] = React.useState('theft');
  const [incidentDate, setIncidentDate] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [evidenceName, setEvidenceName] = React.useState('');
  const [witnessInfo, setWitnessInfo] = React.useState('');
  const [declared, setDeclared] = React.useState(false);
  const [submittedEfirId, setSubmittedEfirId] = React.useState('');

  // Citizen track state
  const [trackId, setTrackId] = React.useState('');
  const [trackedEfir, setTrackedEfir] = React.useState<Efir | null>(null);
  const [trackError, setTrackError] = React.useState('');
  const [newEvidenceFile, setNewEvidenceFile] = React.useState('');

  // Officer view state
  const [selectedOfficerEfirId, setSelectedOfficerEfirId] = React.useState<string | null>(null);
  const [officerNotes, setOfficerNotes] = React.useState('');
  const [assignedOfficer, setAssignedOfficer] = React.useState('');

  // RTK Query endpoints
  const { data: efirs = [], refetch } = useGetEfirsQuery();
  const [createEfir, { isLoading: isSubmitting }] = useCreateEfirMutation();
  const [updateEfirStatus, { isLoading: isUpdatingStatus }] = useUpdateEfirStatusMutation();
  const [uploadEvidence] = useUploadEfirEvidenceMutation();

  const selectedOfficerEfir = React.useMemo(() => {
    return efirs.find(e => e.firId === selectedOfficerEfirId) || null;
  }, [efirs, selectedOfficerEfirId]);

  React.useEffect(() => {
    if (selectedOfficerEfir) {
      setOfficerNotes(selectedOfficerEfir.officerNotes || '');
      setAssignedOfficer(selectedOfficerEfir.assignedOfficerId || '');
    }
  }, [selectedOfficerEfir]);

  // Citizen submit handler
  const handleSubmitEfir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!declared) return;

    try {
      const res = await createEfir({
        complainantName,
        phone,
        district,
        policeStation: policeStation || `${district} Main Station`,
        incidentType,
        incidentDate,
        description,
        evidenceUrls: evidenceName ? [evidenceName] : [],
      }).unwrap();

      setSubmittedEfirId(res.firId);
      // Reset form
      setComplainantName('');
      setPhone('');
      setPoliceStation('');
      setDescription('');
      setEvidenceName('');
      setWitnessInfo('');
      setDeclared(false);
      refetch();
    } catch (err) {
      console.error("Error submitting E-FIR:", err);
    }
  };

  // Citizen tracking handler
  const handleTrackEfir = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!trackId.trim()) return;

    const found = efirs.find(f => f.firId.toLowerCase() === trackId.trim().toLowerCase());
    if (found) {
      setTrackedEfir(found);
      setTrackError('');
    } else {
      setTrackedEfir(null);
      setTrackError('No E-FIR matching this ID was found.');
    }
  };

  const handleUploadAdditionalEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackedEfir || !newEvidenceFile.trim()) return;

    try {
      const res = await uploadEvidence({
        firId: trackedEfir.firId,
        fileUrl: newEvidenceFile.trim()
      }).unwrap();
      
      setTrackedEfir(res);
      setNewEvidenceFile('');
      refetch();
    } catch (err) {
      console.error(err);
    }
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
      <div className="space-y-6 max-w-7xl mx-auto pb-12 px-4">
        
        {/* Symmetrical Role Tab Selection */}
        <div className="flex border-b border-border bg-card rounded-lg p-1 shrink-0 max-w-sm mx-auto shadow-md">
          <button
            onClick={() => {
              setActiveTab('citizen');
              setSelectedOfficerEfirId(null);
            }}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer select-none flex-1 justify-center rounded-md',
              activeTab === 'citizen'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/10'
            )}
          >
            <Users className="h-4 w-4" />
            <span>Citizen Portal</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('officer');
              setSelectedOfficerEfirId(null);
            }}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer select-none flex-1 justify-center rounded-md',
              activeTab === 'officer'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/10'
            )}
          >
            <UserCheck className="h-4 w-4" />
            <span>Officer Portal</span>
          </button>
        </div>

        {/* ── CITIZEN PORTAL WORKSPACE ── */}
        {activeTab === 'citizen' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  setCitizenSubView('submit');
                  setSubmittedEfirId('');
                }}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer",
                  citizenSubView === 'submit' ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground border border-transparent"
                )}
              >
                Submit E-FIR Case
              </button>
              <button
                onClick={() => setCitizenSubView('track')}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer",
                  citizenSubView === 'track' ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground border border-transparent"
                )}
              >
                Track Status & Upload Evidence
              </button>
            </div>

            {citizenSubView === 'submit' ? (
              <Card className="max-w-2xl mx-auto border border-border bg-card shadow-lg">
                <div className="p-4 border-b border-border/60">
                  <Typography variant="heading-md" className="font-bold text-foreground flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    New E-FIR Submission Form
                  </Typography>
                  <Typography variant="caption" color="muted">
                    Citizen complaints filed online. Legally verified under IT-Act Section 66A.
                  </Typography>
                </div>
                <CardContent className="p-5">
                  {submittedEfirId ? (
                    <div className="text-center py-8 space-y-4">
                      <div className="size-12 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto border border-success/20">
                        <CheckCircle className="h-6 w-6" />
                      </div>
                      <div className="space-y-1.5">
                        <Typography variant="heading-sm" className="font-bold text-foreground">E-FIR Submitted Successfully</Typography>
                        <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
                          Your report has been logged in the digital ledger. Save the ID below to track response patrols or upload more evidence.
                        </p>
                      </div>
                      <div className="p-3 bg-muted/20 border border-border/60 rounded-md font-data font-bold text-sm text-foreground max-w-xs mx-auto">
                        {submittedEfirId}
                      </div>
                      <Button
                        onClick={() => {
                          setTrackId(submittedEfirId);
                          setCitizenSubView('track');
                          handleTrackEfir();
                        }}
                        className="gap-1.5 font-bold text-xs"
                      >
                        Track Case
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmitEfir} className="space-y-4 text-xs">
                      {/* Section 1: Complainant Details */}
                      <div className="space-y-3">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest block">1. Complainant Information</span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-muted-foreground font-semibold">Full Legal Name</label>
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

                      {/* Section 2: Incident Details */}
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
                              <option value="theft">Theft</option>
                              <option value="burglary">Burglary</option>
                              <option value="assault">Assault</option>
                              <option value="narcotics">Narcotics Offense</option>
                              <option value="cyber">Cyber Crime</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-muted-foreground font-semibold">District Location</label>
                            <select
                              value={district}
                              onChange={(e) => setDistrict(e.target.value)}
                              className="w-full h-9 px-2 rounded-md border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                              {Object.keys(DISTRICT_CENTERS).sort().map((d) => (
                                <option key={d} value={d}>{d}</option>
                              ))}
                            </select>
                          </div>
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
                        <div className="space-y-1">
                          <label className="text-muted-foreground font-semibold">Specific Area / Nearest Police Station (Optional)</label>
                          <Input
                            value={policeStation}
                            onChange={(e) => setPoliceStation(e.target.value)}
                            placeholder="e.g. Malleshwaram Division Hub"
                            className="text-xs h-9"
                          />
                        </div>
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

                      {/* Section 3: Evidence & Witness */}
                      <div className="space-y-3">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest block">3. Auxiliary Information</span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-muted-foreground font-semibold">Mock Evidence File name</label>
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

                      {/* Section 4: Declaration */}
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
                          I hereby declare that the information provided is true to the best of my knowledge. Under IT-Act Section 66A, filing fraudulent E-FIR claims is a punishable offense.
                        </label>
                      </div>

                      <div className="flex justify-end pt-2">
                        <Button
                          type="submit"
                          disabled={!declared || isSubmitting}
                          className="h-9 px-6 font-bold text-xs gap-1.5"
                        >
                          <Send className="h-3.5 w-3.5" />
                          <span>Submit Legal E-FIR</span>
                        </Button>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>
            ) : (
              /* Tracker Sub-view */
              <div className="max-w-2xl mx-auto space-y-6">
                <Card className="border border-border bg-card shadow-lg">
                  <CardContent className="p-5 space-y-4">
                    <Typography variant="body-sm" className="font-bold text-foreground">
                      Track Incident Status & Upload Evidence
                    </Typography>
                    <form onSubmit={handleTrackEfir} className="flex gap-2 text-xs">
                      <Input
                        value={trackId}
                        onChange={(e) => setTrackId(e.target.value)}
                        placeholder="Enter Legal E-FIR ID (e.g. EFIR-2026-0001)"
                        className="text-xs h-9 font-data font-semibold focus:ring-1 focus:ring-primary"
                        required
                      />
                      <Button type="submit" className="h-9 font-bold text-xs gap-1.5">
                        <Search className="h-3.5 w-3.5" />
                        <span>Track</span>
                      </Button>
                    </form>
                    {trackError && (
                      <div className="flex items-center gap-2 p-2.5 rounded bg-danger/10 border border-danger/20 text-danger text-[11px] font-semibold">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span>{trackError}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Display Tracked EFIR Details */}
                {trackedEfir && (
                  <Card className="border border-border bg-card shadow-lg text-xs animate-in slide-in-from-top duration-200">
                    <div className="p-4 border-b border-border/60 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Digital Case Dossier</span>
                        <Typography variant="heading-sm" className="font-data font-bold text-foreground mt-0.5">{trackedEfir.firId}</Typography>
                      </div>
                      <Badge variant={
                        trackedEfir.status === 'submitted' ? 'secondary' :
                        trackedEfir.status === 'under_review' ? 'warning' :
                        trackedEfir.status === 'rejected' ? 'risk-critical' : 'success'
                      } size="sm" className="uppercase tracking-wider">
                        {trackedEfir.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <CardContent className="p-5 space-y-5">
                      
                      {/* Summary details */}
                      <div className="grid grid-cols-2 gap-4 leading-relaxed text-[11px] bg-muted/10 p-3 rounded-lg border border-border/30">
                        <div>
                          <span className="text-muted-foreground font-semibold block mb-0.5">Complainant</span>
                          <strong className="text-foreground">{trackedEfir.complainantName}</strong>
                        </div>
                        <div>
                          <span className="text-muted-foreground font-semibold block mb-0.5">Contact phone</span>
                          <strong className="text-foreground font-data">{trackedEfir.phone}</strong>
                        </div>
                        <div>
                          <span className="text-muted-foreground font-semibold block mb-0.5">District Area</span>
                          <strong className="text-foreground capitalize">{trackedEfir.district}</strong>
                        </div>
                        <div>
                          <span className="text-muted-foreground font-semibold block mb-0.5">Police Station Jurisdiction</span>
                          <strong className="text-foreground">{trackedEfir.policeStation}</strong>
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground font-semibold block mb-0.5">Incident details</span>
                          <p className="text-muted-foreground text-[10px] leading-relaxed mt-0.5">{trackedEfir.description}</p>
                        </div>
                      </div>

                      {/* Evidence List */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest block">Linked Evidence Assets</span>
                        {trackedEfir.evidenceUrls.length === 0 ? (
                          <div className="text-[10px] text-muted-foreground italic">No evidence files linked to this case yet.</div>
                        ) : (
                          <ul className="space-y-1.5">
                            {trackedEfir.evidenceUrls.map((url, idx) => (
                              <li key={idx} className="flex items-center gap-2 p-1.5 border border-border/35 rounded bg-muted/5 font-semibold text-[10px] text-foreground">
                                <FileCheck className="h-4 w-4 text-primary shrink-0" />
                                <span className="truncate">{url}</span>
                              </li>
                            ))}
                          </ul>
                        )}

                        {/* Upload Additional Evidence Form */}
                        <form onSubmit={handleUploadAdditionalEvidence} className="flex items-center gap-2 pt-2">
                          <Input
                            value={newEvidenceFile}
                            onChange={(e) => setNewEvidenceFile(e.target.value)}
                            placeholder="Add evidence filename (e.g. proof_receipt.pdf)"
                            className="text-[10px] h-8 bg-background focus:ring-1 focus:ring-primary"
                            required
                          />
                          <Button type="submit" size="sm" className="h-8 text-[10px] font-bold gap-1 shrink-0">
                            <Upload className="h-3.5 w-3.5" />
                            <span>Upload File</span>
                          </Button>
                        </form>
                      </div>

                      {/* Status Visual Timeline */}
                      <div className="space-y-3 border-t border-border/30 pt-4">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest block flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          Ledger Audit Timeline
                        </span>
                        <div className="relative border-l border-border pl-3.5 space-y-4 text-[10px]">
                          {trackedEfir.timeline.map((item, idx) => (
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
                )}
              </div>
            )}
          </div>
        )}

        {/* ── OFFICER REVIEW QUEUE WORKSPACE ── */}
        {activeTab === 'officer' && (
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
                        <span className="text-muted-foreground font-semibold block">Citizen Name</span>
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
                        <span className="text-muted-foreground font-semibold block mb-1">Citizen Narrative Description</span>
                        <p className="text-muted-foreground leading-relaxed bg-muted/15 border border-border/35 p-3 rounded-md">
                          {selectedOfficerEfir.description}
                        </p>
                      </div>
                    </div>

                    {/* Evidence List */}
                    <div className="space-y-2 border-t border-border/30 pt-4">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-widest block">Complainant Uploaded Evidence</span>
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
                  <div className="p-4 border-b border-border/60">
                    <Typography variant="heading-sm" className="font-bold text-foreground">
                      E-FIR Ingestion Review Queue
                    </Typography>
                    <Typography variant="caption" color="muted">
                      Patrol division workflow for verifying citizen submissions.
                    </Typography>
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
        )}

      </div>
    </DashboardLayout>
  );
}

export default EfirPage;
