import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/templates/AdminLayout/AdminLayout';
import {
  useGetCriminalsQuery,
  useCreateCriminalMutation,
  useUpdateCriminalMutation,
  useDeleteCriminalMutation,
} from '@/services/criminalsApi';
import { TableSkeleton, EmptyState, ErrorState } from '@/components/molecules/DataStates';
import { Plus, Trash2, Edit2, User, Search, Eye, AlertOctagon, Check, Loader2 } from 'lucide-react';

export function CriminalsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');

  // debounce search or use directly (since local search is fast, we'll do search params)
  const { data: criminals, isLoading, isError, refetch } = useGetCriminalsQuery({
    search: searchQuery || undefined,
    status: statusFilter || undefined,
  });

  const [createCriminal, { isLoading: isCreating }] = useCreateCriminalMutation();
  const [updateCriminal, { isLoading: isUpdating }] = useUpdateCriminalMutation();
  const [deleteCriminal] = useDeleteCriminalMutation();

  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [editingCriminal, setEditingCriminal] = React.useState<any | null>(null);
  const [viewingCriminal, setViewingCriminal] = React.useState<any | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);

  // Form Fields
  const [name, setName] = React.useState('');
  const [alias, setAlias] = React.useState('');
  const [age, setAge] = React.useState('');
  const [gender, setGender] = React.useState('Male');
  const [phone, setPhone] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [marks, setMarks] = React.useState('');
  const [desc, setDesc] = React.useState('');

  // Hydrate edit form
  React.useEffect(() => {
    if (editingCriminal) {
      setName(editingCriminal.name || '');
      setAlias(editingCriminal.alias || '');
      setAge(editingCriminal.age?.toString() || '');
      setGender(editingCriminal.gender || 'Male');
      setPhone(editingCriminal.phone || '');
      setAddress(editingCriminal.address || '');
      setMarks(editingCriminal.identificationMarks || '');
      setDesc(editingCriminal.description || '');
    } else {
      resetForm();
    }
  }, [editingCriminal]);

  const resetForm = () => {
    setName('');
    setAlias('');
    setAge('');
    setGender('Male');
    setPhone('');
    setAddress('');
    setMarks('');
    setDesc('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await createCriminal({
        name: name.trim(),
        alias: alias.trim() || undefined,
        age: age ? parseInt(age, 10) : undefined,
        gender,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        identificationMarks: marks.trim() || undefined,
        description: desc.trim() || undefined,
      }).unwrap();
      setShowCreateModal(false);
      resetForm();
    } catch (e) { console.error(e); }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCriminal) return;
    try {
      await updateCriminal({
        id: editingCriminal.id,
        body: {
          name: name.trim(),
          alias: alias.trim() || undefined,
          age: age ? parseInt(age, 10) : undefined,
          gender,
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
          identificationMarks: marks.trim() || undefined,
          description: desc.trim() || undefined,
        },
      }).unwrap();
      setEditingCriminal(null);
      resetForm();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCriminal(id).unwrap();
      setConfirmDeleteId(null);
    } catch (e) { console.error(e); }
  };

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">Criminal Registry</h1>
            <p className="text-sm mt-0.5 text-muted-foreground">Manage files, records, and profiles of suspected or convicted offenders.</p>
          </div>
          <button className="admin-btn admin-btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Add Criminal Record
          </button>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              className="admin-input pl-10"
              placeholder="Search by name, alias, identification marks..."
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
            <option value="active">Active Wanted</option>
            <option value="in_custody">In Custody</option>
            <option value="released">Released</option>
          </select>
        </div>

        {isLoading && <TableSkeleton columns={5} rows={5} />}
        {isError && <ErrorState title="Failed to load criminal records" onRetry={refetch} />}
        {!isLoading && !isError && criminals && criminals.length === 0 && (
          <EmptyState icon={AlertOctagon} title="No profiles found" description="No criminal profiles matched search criteria." />
        )}
        {!isLoading && !isError && criminals && criminals.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {criminals.map((c) => (
              <div key={c.id} className="admin-card p-5 flex flex-col justify-between hover:border-primary/30 transition-all">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-lg flex items-center justify-center bg-primary/10 shrink-0 border border-primary/20">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-foreground leading-snug">{c.name}</h3>
                        {c.alias && <p className="text-xs text-muted-foreground">Alias: "{c.alias}"</p>}
                      </div>
                    </div>
                    <span className="admin-badge admin-badge-role uppercase text-[10px]">
                      {c.status || 'Active'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs border-t border-border pt-3">
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Age / Gender</span>
                      <span className="text-foreground font-medium">{c.age ? `${c.age} yrs` : '—'} / {c.gender || '—'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Phone</span>
                      <span className="text-foreground font-medium">{c.phone || '—'}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Distinguishing Marks</span>
                      <span className="text-foreground font-medium block truncate" title={c.identificationMarks}>{c.identificationMarks || 'None'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
                  <button className="admin-btn admin-btn-secondary text-xs flex-1" onClick={() => navigate(`/criminals/${c.id}`)}>
                    <Eye className="h-3.5 w-3.5 mr-1" /> View Profile
                  </button>
                  <button className="p-2 rounded-md border border-border hover:bg-primary/10 text-primary" onClick={() => setEditingCriminal(c)} title="Edit">
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button className="p-2 rounded-md border border-border hover:bg-danger/10 text-danger" onClick={() => setConfirmDeleteId(c.id)} title="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {(showCreateModal || editingCriminal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4 text-foreground">{editingCriminal ? 'Edit Criminal Record' : 'Add Criminal Record'}</h2>
            <form onSubmit={editingCriminal ? handleUpdate : handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">Full Name *</label>
                  <input className="admin-input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">Alias / Moniker</label>
                  <input className="admin-input" value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="e.g. Robinhood" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">Age</label>
                  <input type="number" min="1" className="admin-input" value={age} onChange={(e) => setAge(e.target.value)} placeholder="Age" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">Gender</label>
                  <select className="admin-input" value={gender} onChange={(e) => setGender(e.target.value)}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">Phone Number</label>
                  <input className="admin-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">Identification Marks</label>
                  <input className="admin-input" value={marks} onChange={(e) => setMarks(e.target.value)} placeholder="e.g. Scar on left wrist" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">Address / Known Hideouts</label>
                <input className="admin-input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address details" />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">Offender Profile Description</label>
                <textarea className="admin-input min-h-[70px] py-1.5" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Profile summary, history, MO..." />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => { setShowCreateModal(false); setEditingCriminal(null); resetForm(); }}>Cancel</button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={isCreating || isUpdating}>
                  {(isCreating || isUpdating) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                  {editingCriminal ? 'Save Changes' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Criminal Details Modal */}
      {viewingCriminal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start border-b border-border pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-xl flex items-center justify-center bg-primary/10 border border-primary/20 shrink-0">
                  <User className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">{viewingCriminal.name}</h2>
                  {viewingCriminal.alias && <p className="text-xs text-muted-foreground">Also known as: <span className="font-semibold text-slate-300">"{viewingCriminal.alias}"</span></p>}
                </div>
              </div>
              <span className="admin-badge admin-badge-role uppercase text-xs">
                {viewingCriminal.status || 'Active'}
              </span>
            </div>

            <div className="space-y-4 text-sm max-h-[400px] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-muted/20 p-4 rounded-xl border border-border/60">
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Age</span>
                  <span className="text-foreground font-semibold">{viewingCriminal.age ? `${viewingCriminal.age} yrs` : '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Gender</span>
                  <span className="text-foreground font-semibold">{viewingCriminal.gender || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Phone</span>
                  <span className="text-foreground font-semibold font-mono">{viewingCriminal.phone || '—'}</span>
                </div>
                <div className="col-span-2 md:col-span-3">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Distinguishing Marks</span>
                  <span className="text-foreground font-semibold">{viewingCriminal.identificationMarks || 'None recorded'}</span>
                </div>
                <div className="col-span-2 md:col-span-3">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Last Known Hideout / Address</span>
                  <span className="text-foreground font-semibold">{viewingCriminal.address || '—'}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs uppercase font-bold text-muted-foreground mb-1.5">Profile Summary & History</h4>
                <p className="text-xs text-slate-300 leading-relaxed bg-muted/10 p-3 rounded-lg border border-border/40 whitespace-pre-line">
                  {viewingCriminal.description || 'No descriptive overview details recorded.'}
                </p>
              </div>

              <div>
                <h4 className="text-xs uppercase font-bold text-muted-foreground mb-2">Linked Offenses / Crime History</h4>
                {viewingCriminal.crimes && viewingCriminal.crimes.length > 0 ? (
                  <div className="space-y-2">
                    {viewingCriminal.crimes.map((c: any) => (
                      <div key={c.id} className="p-2.5 rounded-lg border border-border bg-card flex justify-between items-center text-xs">
                        <div>
                          <p className="font-semibold text-foreground">{c.title || 'Incident Log'}</p>
                          <p className="text-muted-foreground text-[10px] mt-0.5">{c.type || 'General Offense'}</p>
                        </div>
                        <span className="text-muted-foreground font-mono text-[10px]">{c.id}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No current active incident links mapped to this record.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border mt-5">
              <button className="admin-btn admin-btn-secondary" onClick={() => setViewingCriminal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold mb-2 text-foreground">Delete Criminal Profile</h2>
            <p className="text-sm text-muted-foreground mb-5">Are you sure? Mapped linkages to incident records and FIR logs might lose offender profiling connections.</p>
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
