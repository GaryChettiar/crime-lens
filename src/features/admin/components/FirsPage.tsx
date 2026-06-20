import * as React from 'react';
import { AdminLayout } from '@/components/templates/AdminLayout/AdminLayout';
import {
  useGetFirsQuery,
  useUpdateFirMutation,
  useDeleteFirMutation,
} from '@/services/firsApi';
import { useGetOfficersQuery } from '@/services/policeOfficersApi';
import { useGetStationsQuery } from '@/services/policeStationsApi';
import { useGetAllUsersQuery } from '@/services/usersApi';
import { TableSkeleton, EmptyState, ErrorState } from '@/components/molecules/DataStates';
import { Trash2, Edit2, FileText, Search, Eye, Check, Loader2, Calendar, Phone, Landmark, User } from 'lucide-react';

export function FirsPage() {
  const { data: stations } = useGetStationsQuery();
  const { data: officers } = useGetOfficersQuery();
  const { data: usersData } = useGetAllUsersQuery({ limit: 1000 });

  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');

  const { data: firs, isLoading, isError, refetch } = useGetFirsQuery({
    status: statusFilter || undefined,
  });

  const [updateFir, { isLoading: isUpdating }] = useUpdateFirMutation();
  const [deleteFir] = useDeleteFirMutation();

  const [editingFir, setEditingFir] = React.useState<any | null>(null);
  const [viewingFir, setViewingFir] = React.useState<any | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);

  // Form Fields
  const [status, setStatus] = React.useState<'submitted' | 'under_review' | 'approved' | 'rejected' | 'assigned' | 'closed'>('submitted');
  const [assignedOfficerId, setAssignedOfficerId] = React.useState('');
  const [officerNotes, setOfficerNotes] = React.useState('');

  // Hydrate edit form
  React.useEffect(() => {
    if (editingFir) {
      setStatus(editingFir.status || 'submitted');
      setAssignedOfficerId(editingFir.assignedOfficerId || '');
      setOfficerNotes(editingFir.officerNotes || '');
    } else {
      setStatus('submitted');
      setAssignedOfficerId('');
      setOfficerNotes('');
    }
  }, [editingFir]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFir) return;
    try {
      await updateFir({
        id: editingFir.id,
        body: {
          status,
          assignedOfficerId: assignedOfficerId || undefined,
          officerNotes: officerNotes.trim() || undefined,
        },
      }).unwrap();
      setEditingFir(null);
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteFir(id).unwrap();
      setConfirmDeleteId(null);
    } catch (e) { console.error(e); }
  };

  const officersWithNames = React.useMemo(() => {
    if (!officers) return [];
    return officers.map((o) => {
      const u = usersData?.users?.find((user) => user.id === o.userId);
      return {
        id: o.id,
        name: u?.userInfo?.name || `Badge ${o.badgeNumber || o.id}`,
      };
    });
  }, [officers, usersData]);

  const filteredFirs = React.useMemo(() => {
    if (!firs) return [];
    return firs.filter((f) => {
      const matchSearch =
        f.firNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.complainantName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    });
  }, [firs, searchQuery]);

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">E-FIR Records</h1>
            <p className="text-sm mt-0.5 text-muted-foreground">Monitor citizen filed online digital complaint logs, assign cases, and update review status.</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              className="admin-input pl-10"
              placeholder="Search E-FIR number, complainant name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            className="admin-input"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="assigned">Assigned</option>
            <option value="closed">Closed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        {isLoading && <TableSkeleton columns={6} rows={6} />}
        {isError && <ErrorState title="Failed to load FIR records" onRetry={refetch} />}
        {!isLoading && !isError && filteredFirs.length === 0 && (
          <EmptyState icon={FileText} title="No E-FIR logs" description="No online complaint logs matched search parameters." />
        )}
        {!isLoading && !isError && filteredFirs.length > 0 && (
          <div className="admin-card overflow-hidden">
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>FIR Case</th>
                    <th>Complainant</th>
                    <th>District Juris.</th>
                    <th>Station Assigned</th>
                    <th>Status</th>
                    <th className="w-[120px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFirs.map((f) => (
                    <tr key={f.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-primary/15 shrink-0">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <span className="font-semibold text-sm text-foreground block font-data">{f.firNumber}</span>
                            <span className="text-[11px] text-muted-foreground uppercase">{f.incidentType || 'General'}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="text-xs">
                          <span className="font-semibold text-foreground block">{f.complainantName}</span>
                          <span className="text-muted-foreground font-mono">{f.complainantPhone || '—'}</span>
                        </div>
                      </td>
                      <td>
                        <span className="text-xs text-muted-foreground">{f.district || '—'}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 text-xs text-foreground">
                          <Landmark className="h-3.5 w-3.5 text-slate-400" />
                          {stations?.find((s) => s.id === f.policeStationId)?.name || 'Unassigned'}
                        </div>
                      </td>
                      <td>
                        <span className={`admin-badge uppercase text-[9px] font-bold ${
                          f.status === 'submitted' ? 'bg-slate-500/15 text-slate-400' :
                          f.status === 'under_review' ? 'bg-warning/15 text-warning' :
                          f.status === 'rejected' ? 'bg-danger/15 text-danger' : 'bg-success/15 text-success'
                        }`}>
                          {f.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button className="p-1.5 rounded-md hover:bg-primary/10 text-primary" onClick={() => setViewingFir(f)} title="Details">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button className="p-1.5 rounded-md hover:bg-primary/10 text-primary" onClick={() => setEditingFir(f)} title="Edit">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button className="p-1.5 rounded-md hover:bg-danger/10 text-danger" onClick={() => setConfirmDeleteId(f.id)} title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Edit Status / Assignment Modal */}
      {editingFir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4 text-foreground">Manage E-FIR Ingestion</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">Action Status</label>
                  <select className="admin-input text-xs" value={status} onChange={(e: any) => setStatus(e.target.value)}>
                    <option value="submitted">Submitted</option>
                    <option value="under_review">Under Review</option>
                    <option value="approved">Approved (Verified)</option>
                    <option value="assigned">Assigned to Patrol</option>
                    <option value="rejected">Rejected (False alarm)</option>
                    <option value="closed">Closed File</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">Assign Investigator</label>
                  <select className="admin-input text-xs font-semibold" value={assignedOfficerId} onChange={(e) => setAssignedOfficerId(e.target.value)}>
                    <option value="">-- Assign Investigator --</option>
                    {officersWithNames.map((o) => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">Officer Decision Notes</label>
                <textarea className="admin-input min-h-[90px] py-1.5 text-xs" value={officerNotes} onChange={(e) => setOfficerNotes(e.target.value)} placeholder="Decision reasoning or notes..." />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => { setEditingFir(null); }}>Cancel</button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={isUpdating}>
                  {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View FIR Details Modal */}
      {viewingFir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start border-b border-border pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg flex items-center justify-center bg-primary/10 border border-primary/25 shrink-0 animate-pulse">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">Complaint Dossier Details</h2>
                  <p className="text-xs text-muted-foreground font-mono">{viewingFir.firNumber}</p>
                </div>
              </div>
              <span className={`admin-badge uppercase text-[10px] ${
                viewingFir.status === 'submitted' ? 'bg-slate-500/15 text-slate-400' :
                viewingFir.status === 'under_review' ? 'bg-warning/15 text-warning' :
                viewingFir.status === 'rejected' ? 'bg-danger/15 text-danger' : 'bg-success/15 text-success'
              }`}>
                {viewingFir.status}
              </span>
            </div>

            <div className="space-y-4 text-xs max-h-[380px] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-muted/20 p-4 rounded-xl border border-border/40 leading-normal">
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Complainant</span>
                  <span className="text-foreground font-semibold flex items-center gap-1"><User className="h-3 w-3" /> {viewingFir.complainantName}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Contact Phone</span>
                  <span className="text-foreground font-semibold font-mono flex items-center gap-1"><Phone className="h-3 w-3" /> {viewingFir.complainantPhone || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Category</span>
                  <span className="text-foreground font-semibold uppercase">{viewingFir.incidentType || 'General'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">District Zone</span>
                  <span className="text-foreground font-semibold">{viewingFir.district || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Nearest Station</span>
                  <span className="text-foreground font-semibold">
                    {stations?.find((s) => s.id === viewingFir.policeStationId)?.name || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Assigned Investigator</span>
                  <span className="text-foreground font-semibold">
                    {officersWithNames.find((o) => o.id === viewingFir.assignedOfficerId)?.name || 'Unassigned'}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs uppercase font-bold text-muted-foreground mb-1.5">Citizen Incident Narrative</h4>
                <p className="text-slate-300 bg-muted/10 p-3 rounded-lg border border-border/40 leading-relaxed whitespace-pre-line">
                  {viewingFir.description || 'No descriptive incident log details recorded.'}
                </p>
              </div>

              {viewingFir.officerNotes && (
                <div>
                  <h4 className="text-xs uppercase font-bold text-muted-foreground mb-1.5">Officer Decision Notes</h4>
                  <p className="text-slate-300 bg-warning/5 p-3 rounded-lg border border-warning/20 leading-relaxed whitespace-pre-line">
                    {viewingFir.officerNotes}
                  </p>
                </div>
              )}

              {viewingFir.evidenceUrls && viewingFir.evidenceUrls.length > 0 && (
                <div>
                  <h4 className="text-xs uppercase font-bold text-muted-foreground mb-1.5">Linked Evidence Files</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {viewingFir.evidenceUrls.map((url: string, idx: number) => (
                      <div key={idx} className="p-2 border border-border rounded bg-muted/10 font-semibold truncate max-w-[200px]">
                        {url}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ingestion Visual Timeline */}
              {viewingFir.timeline && viewingFir.timeline.length > 0 && (
                <div className="space-y-3 border-t border-border/30 pt-4">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest block flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Ledger Audit Timeline
                  </span>
                  <div className="relative border-l border-border pl-3.5 space-y-4 text-[10px]">
                    {viewingFir.timeline.map((item: any, idx: number) => (
                      <div key={idx} className="relative space-y-0.5">
                        <div className="absolute -left-[20.5px] top-1 size-2 rounded-full border border-border bg-card flex items-center justify-center">
                          <div className="size-1.5 bg-primary rounded-full" />
                        </div>
                        <div className="text-[9px] font-bold text-muted-foreground">{item.date}</div>
                        <div className="font-bold text-foreground">{item.event}</div>
                        <p className="text-muted-foreground leading-relaxed">{item.details}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-border mt-5">
              <button className="admin-btn admin-btn-secondary" onClick={() => setViewingFir(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold mb-2 text-foreground">Delete FIR Log</h2>
            <p className="text-sm text-muted-foreground mb-5">Are you sure? This permanently deletes the citizen complaint log from DB databases.</p>
            <div className="flex justify-end gap-2">
              <button className="admin-btn admin-btn-secondary" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
              <button className="admin-btn admin-btn-danger" onClick={() => handleDelete(confirmDeleteId)}>
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
