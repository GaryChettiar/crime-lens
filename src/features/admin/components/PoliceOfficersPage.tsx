import * as React from 'react';
import { AdminLayout } from '@/components/templates/AdminLayout/AdminLayout';
import {
  useGetOfficersQuery,
  useCreateOfficerMutation,
  useUpdateOfficerMutation,
  useDeleteOfficerMutation,
} from '@/services/policeOfficersApi';
import { useGetRanksQuery } from '@/services/policeRanksApi';
import { useGetStationsQuery } from '@/services/policeStationsApi';
import { useGetAllUsersQuery } from '@/services/usersApi';
import { TableSkeleton, EmptyState, ErrorState } from '@/components/molecules/DataStates';
import { Plus, Trash2, Edit2, User, Mail, Phone, Loader2, Check, Award, Landmark } from 'lucide-react';

export function PoliceOfficersPage() {
  const { data: ranks } = useGetRanksQuery();
  const { data: stations } = useGetStationsQuery();
  const { data: usersData } = useGetAllUsersQuery({ limit: 1000 });

  const [selectedRankFilter, setSelectedRankFilter] = React.useState('');
  const [selectedStationFilter, setSelectedStationFilter] = React.useState('');
  const [searchQuery, setSearchQuery] = React.useState('');

  const { data: officers, isLoading, isError, refetch } = useGetOfficersQuery({
    rankId: selectedRankFilter || undefined,
    stationId: selectedStationFilter || undefined,
  });

  const [createOfficer, { isLoading: isCreating }] = useCreateOfficerMutation();
  const [updateOfficer, { isLoading: isUpdating }] = useUpdateOfficerMutation();
  const [deleteOfficer] = useDeleteOfficerMutation();

  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [editingOfficer, setEditingOfficer] = React.useState<any | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);

  // Form Fields
  const [name, setName] = React.useState('');
  const [badgeNumber, setBadgeNumber] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [rankId, setRankId] = React.useState('');
  const [stationId, setStationId] = React.useState('');

  // Hydrate edit form
  React.useEffect(() => {
    if (editingOfficer) {
      // Find matching user for name and email
      const matchingUser = usersData?.users?.find((u) => u.id === editingOfficer.userId);
      setName(matchingUser?.userInfo?.name || '');
      setBadgeNumber(editingOfficer.badgeNumber || '');
      setEmail(matchingUser?.userInfo?.email || '');
      setPhone(editingOfficer.phone || matchingUser?.userInfo?.phone || '');
      setRankId(editingOfficer.rankId || '');
      setStationId(editingOfficer.stationId || '');
    } else {
      setName('');
      setBadgeNumber('');
      setEmail('');
      setPhone('');
      setRankId('');
      setStationId('');
    }
  }, [editingOfficer, usersData]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await createOfficer({
        name: name.trim(),
        badgeNumber: badgeNumber.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        rankId: rankId || undefined,
        stationId: stationId || undefined,
      }).unwrap();
      setShowCreateModal(false);
      resetForm();
    } catch (e) { console.error(e); }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOfficer) return;
    try {
      await updateOfficer({
        id: editingOfficer.id,
        body: {
          name: name.trim(),
          badgeNumber: badgeNumber.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          rankId: rankId || undefined,
          stationId: stationId || undefined,
        },
      }).unwrap();
      setEditingOfficer(null);
      resetForm();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteOfficer(id).unwrap();
      setConfirmDeleteId(null);
    } catch (e) { console.error(e); }
  };

  const resetForm = () => {
    setName('');
    setBadgeNumber('');
    setEmail('');
    setPhone('');
    setRankId('');
    setStationId('');
  };

  const mappedOfficers = React.useMemo(() => {
    if (!officers) return [];
    return officers.map((o) => {
      const matchingUser = usersData?.users?.find((u) => u.id === o.userId);
      const matchingRank = ranks?.find((r) => r.id === o.rankId);
      const matchingStation = stations?.find((s) => s.id === o.stationId);
      return {
        ...o,
        name: matchingUser?.userInfo?.name || 'Unknown Officer',
        email: matchingUser?.userInfo?.email || '—',
        phone: o.phone || matchingUser?.userInfo?.phone || '—',
        rankName: matchingRank?.name || 'No Rank',
        stationName: matchingStation?.name || 'Unassigned',
      };
    });
  }, [officers, usersData, ranks, stations]);

  const filteredOfficers = React.useMemo(() => {
    return mappedOfficers.filter((o) => {
      const matchSearch =
        o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.badgeNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.stationName?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    });
  }, [mappedOfficers, searchQuery]);

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">Police Officers</h1>
            <p className="text-sm mt-0.5 text-muted-foreground">Manage active duty officers, ranks, and station assignments.</p>
          </div>
          <button className="admin-btn admin-btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Add Officer
          </button>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            className="admin-input"
            placeholder="Search name, badge..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            className="admin-input"
            value={selectedRankFilter}
            onChange={(e) => setSelectedRankFilter(e.target.value)}
          >
            <option value="">All Ranks</option>
            {ranks?.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <select
            className="admin-input"
            value={selectedStationFilter}
            onChange={(e) => setSelectedStationFilter(e.target.value)}
          >
            <option value="">All Stations</option>
            {stations?.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {isLoading && <TableSkeleton columns={5} rows={6} />}
        {isError && <ErrorState title="Failed to load officers" onRetry={refetch} />}
        {!isLoading && !isError && filteredOfficers.length === 0 && (
          <EmptyState icon={User} title="No officers found" description="No active duty officers matched your search parameters." />
        )}
        {!isLoading && !isError && filteredOfficers.length > 0 && (
          <div className="admin-card overflow-hidden">
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Officer Details</th>
                    <th>Badge / Rank</th>
                    <th>Station Assignment</th>
                    <th>Contact</th>
                    <th className="w-[120px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOfficers.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full flex items-center justify-center bg-primary/15 shrink-0">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <span className="font-semibold text-sm text-foreground block">{o.name}</span>
                            <span className="text-[11px] text-muted-foreground">{o.status || 'Active'}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-sm font-semibold text-foreground">
                            <Award className="h-3.5 w-3.5 text-slate-400" />
                            {o.rankName}
                          </div>
                          <span className="text-xs text-muted-foreground font-mono">Badge: {o.badgeNumber || '—'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5 text-sm text-foreground">
                          <Landmark className="h-3.5 w-3.5 text-slate-400" />
                          {o.stationName}
                        </div>
                      </td>
                      <td>
                        <div className="text-xs space-y-0.5">
                          {o.email !== '—' && <div className="flex items-center gap-1 text-muted-foreground"><Mail className="h-3 w-3" /> {o.email}</div>}
                          {o.phone !== '—' && <div className="flex items-center gap-1 text-muted-foreground"><Phone className="h-3 w-3" /> {o.phone}</div>}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button className="p-1.5 rounded-md hover:bg-primary/10 text-primary" onClick={() => setEditingOfficer(o)} title="Edit">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button className="p-1.5 rounded-md hover:bg-danger/10 text-danger" onClick={() => setConfirmDeleteId(o.id)} title="Delete">
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

      {/* Create / Edit Modals */}
      {(showCreateModal || editingOfficer) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4 text-foreground">{editingOfficer ? 'Edit Officer Profile' : 'Add Officer Profile'}</h2>
            <form onSubmit={editingOfficer ? handleUpdate : handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">Officer Name *</label>
                <input className="admin-input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ramesh Kumar" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">Badge Number *</label>
                  <input className="admin-input font-mono" required value={badgeNumber} onChange={(e) => setBadgeNumber(e.target.value)} placeholder="e.g. P-8821" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">Rank</label>
                  <select className="admin-input" value={rankId} onChange={(e) => setRankId(e.target.value)}>
                    <option value="">Select Rank</option>
                    {ranks?.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">Station Assignment</label>
                <select className="admin-input" value={stationId} onChange={(e) => setStationId(e.target.value)}>
                  <option value="">Unassigned / Select Station</option>
                  {stations?.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">Email Address *</label>
                  <input type="email" className="admin-input" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. ramesh@ksp.gov.in" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">Phone Number</label>
                  <input className="admin-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. +91 94808 12345" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => { setShowCreateModal(false); setEditingOfficer(null); resetForm(); }}>Cancel</button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={isCreating || isUpdating}>
                  {(isCreating || isUpdating) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                  {editingOfficer ? 'Save Changes' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold mb-2 text-foreground">Delete Officer</h2>
            <p className="text-sm text-muted-foreground mb-5">Are you sure? Officer details and historical logs under this name will remain, but the profile will be archived.</p>
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
