import * as React from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/templates/AdminLayout/AdminLayout';
import {
  useGetCrimesQuery,
  useCreateCrimeMutation,
  useUpdateCrimeMutation,
  useDeleteCrimeMutation,
  type CrimeStatus,
} from '@/services/crimeApi';
import { useGetDistrictsQuery } from '@/services/districtsApi';
import { useGetStationsQuery } from '@/services/policeStationsApi';
import { useGetCriminalsQuery } from '@/services/criminalsApi';
import { TableSkeleton, EmptyState, ErrorState } from '@/components/molecules/DataStates';
import { Plus, Trash2, Edit2, AlertOctagon, Check, Loader2, Eye } from 'lucide-react';

export function CrimesPage() {
  const { data: districts } = useGetDistrictsQuery();
  const { data: stations } = useGetStationsQuery();
  const { data: criminals } = useGetCriminalsQuery();

  const [categoryFilter, setCategoryFilter] = React.useState('');
  const [districtFilter, setDistrictFilter] = React.useState('');
  const [searchQuery, setSearchQuery] = React.useState('');

  const { data: crimes, isLoading, isError, refetch } = useGetCrimesQuery({
    category: categoryFilter || undefined,
    district: districtFilter || undefined,
  });

  const [createCrime, { isLoading: isCreating }] = useCreateCrimeMutation();
  const [updateCrime, { isLoading: isUpdating }] = useUpdateCrimeMutation();
  const [deleteCrime] = useDeleteCrimeMutation();

  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [editingCrime, setEditingCrime] = React.useState<any | null>(null);
  const [viewingCrime, setViewingCrime] = React.useState<any | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [policeStationId, setPoliceStationId] = React.useState('');
  const [districtId, setDistrictId] = React.useState('');
  const [lat, setLat] = React.useState('');
  const [lng, setLng] = React.useState('');
  const [selectedCriminalIds, setSelectedCriminalIds] = React.useState<string[]>([]);
  const [status, setStatus] = React.useState<CrimeStatus>('under_investigation');

  // Hydrate edit form
  React.useEffect(() => {
    if (editingCrime) {
      setTitle(editingCrime.title || '');
      setDescription(editingCrime.description || '');
      setCategory(editingCrime.crimeCategory || editingCrime.category || '');
      setPoliceStationId(editingCrime.policeStationId || '');
      setDistrictId(editingCrime.location?.district || '');
      setLat(editingCrime.location?.coordinates?.[0]?.toString() || '');
      setLng(editingCrime.location?.coordinates?.[1]?.toString() || '');
      setSelectedCriminalIds(editingCrime.criminalIds || []);
      setStatus((editingCrime.status as CrimeStatus) || 'under_investigation');
    } else {
      resetForm();
    }
  }, [editingCrime]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('');
    setPoliceStationId('');
    setDistrictId('');
    setLat('');
    setLng('');
    setSelectedCriminalIds([]);
    setStatus('under_investigation');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !category) return;
    try {
      await createCrime({
        title: title.trim(),
        description: description.trim() || undefined,
        crimeCategory: category,
        category,
        policeStationId: policeStationId || undefined,
        location: {
          district: districtId || undefined,
          coordinates: lat && lng ? [parseFloat(lat), parseFloat(lng)] : undefined,
        },
        criminalIds: selectedCriminalIds,
      }).unwrap();
      setShowCreateModal(false);
      resetForm();
    } catch (e) { console.error(e); }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCrime) return;
    try {
      await updateCrime({
        id: editingCrime.id,
        body: {
          title: title.trim(),
          description: description.trim() || undefined,
          crimeCategory: category,
          category,
          policeStationId: policeStationId || undefined,
          location: {
            district: districtId || undefined,
            coordinates: lat && lng ? [parseFloat(lat), parseFloat(lng)] : undefined,
          },
          status,
          criminalIds: selectedCriminalIds,
        },
      }).unwrap();
      setEditingCrime(null);
      resetForm();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCrime(id).unwrap();
      setConfirmDeleteId(null);
    } catch (e) { console.error(e); }
  };

  const handleCriminalCheckboxChange = (id: string) => {
    setSelectedCriminalIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredCrimes = React.useMemo(() => {
    if (!crimes) return [];
    return crimes.filter((c) => {
      const matchSearch =
        c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.caseNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    });
  }, [crimes, searchQuery]);

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">Crime Incidents</h1>
            <p className="text-sm mt-0.5 text-muted-foreground">Manage logged incident profiles, status updates, and links to offenders.</p>
          </div>
          <button className="admin-btn admin-btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Log Incident
          </button>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            className="admin-input"
            placeholder="Search incident case, title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            className="admin-input"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="Theft">Theft</option>
            <option value="Cybercrime">Cybercrime</option>
            <option value="Assault">Assault</option>
            <option value="Burglary">Burglary</option>
            <option value="Narcotics">Narcotics</option>
            <option value="Homicide">Homicide</option>
          </select>
          <select
            className="admin-input"
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
          >
            <option value="">All Districts</option>
            {districts?.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        {isLoading && <TableSkeleton columns={5} rows={6} />}
        {isError && <ErrorState title="Failed to load incidents" onRetry={refetch} />}
        {!isLoading && !isError && filteredCrimes.length === 0 && (
          <EmptyState icon={AlertOctagon} title="No incidents logged" description="No incident logs matched search criteria." />
        )}
        {!isLoading && !isError && filteredCrimes.length > 0 && (
          <div className="admin-card overflow-hidden">
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Case Details</th>
                    <th>Category</th>
                    <th>District Juris.</th>
                    <th>Status</th>
                    <th className="w-[120px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCrimes.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-danger/15 shrink-0">
                            <AlertOctagon className="h-4 w-4 text-danger" />
                          </div>
                          <div>
                            <span className="font-semibold text-sm text-foreground block">{c.title}</span>
                            <span className="text-xs text-muted-foreground font-mono">{c.caseNumber}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="admin-badge admin-badge-role">{c.crimeCategory}</span>
                      </td>
                      <td>
                        <span className="text-sm text-muted-foreground">
                          {districts?.find((d) => d.id === c.location?.district)?.name || '—'}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-badge uppercase text-[10px] ${c.status === 'closed' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'}`}>
                          {c.status}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <Link to={`/crimes/${c.id}`} className="p-1.5 rounded-md hover:bg-primary/10 text-primary block" title="Workspace Details">
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button className="p-1.5 rounded-md hover:bg-primary/10 text-primary" onClick={() => setEditingCrime(c)} title="Edit">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button className="p-1.5 rounded-md hover:bg-danger/10 text-danger" onClick={() => setConfirmDeleteId(c.id)} title="Delete">
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
      {(showCreateModal || editingCrime) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4 text-foreground">{editingCrime ? 'Edit Incident Record' : 'Log Incident Record'}</h2>
            <form onSubmit={editingCrime ? handleUpdate : handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">Incident Title *</label>
                <input className="admin-input" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title Summary" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">Category *</label>
                  <select className="admin-input" required value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="">Select Category</option>
                    <option value="Theft">Theft</option>
                    <option value="Cybercrime">Cybercrime</option>
                    <option value="Assault">Assault</option>
                    <option value="Burglary">Burglary</option>
                    <option value="Narcotics">Narcotics</option>
                    <option value="Homicide">Homicide</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">Status</label>
                  <select className="admin-input" value={status} onChange={(e: any) => setStatus(e.target.value)}>
                    <option value="reported">Reported</option>
                    <option value="under_investigation">Under Investigation</option>
                    <option value="suspects_identified">Suspects Identified</option>
                    <option value="evidence_collected">Evidence Collected</option>
                    <option value="charge_sheet_filed">Charge Sheet Filed</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">District Zone *</label>
                  <select className="admin-input" required value={districtId} onChange={(e) => setDistrictId(e.target.value)}>
                    <option value="">Select District</option>
                    {districts?.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">Police Station</label>
                  <select className="admin-input" value={policeStationId} onChange={(e) => setPoliceStationId(e.target.value)}>
                    <option value="">Select Station</option>
                    {stations?.filter(s => !districtId || s.districtId === districtId).map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">Latitude</label>
                  <input type="number" step="any" className="admin-input" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="e.g. 12.9" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">Longitude</label>
                  <input type="number" step="any" className="admin-input" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="e.g. 77.6" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">Narrative Description</label>
                <textarea className="admin-input min-h-[80px] py-1.5" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Incident description..." />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-2 text-muted-foreground">Link Involved Criminal Suspects</label>
                <div className="max-h-[120px] overflow-y-auto border border-border rounded-lg p-3 bg-muted/10 space-y-1.5">
                  {criminals?.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded border-border accent-primary"
                        checked={selectedCriminalIds.includes(c.id)}
                        onChange={() => handleCriminalCheckboxChange(c.id)}
                      />
                      {c.name} {c.alias && `("${c.alias}")`}
                    </label>
                  ))}
                  {(!criminals || criminals.length === 0) && (
                    <p className="text-xs text-muted-foreground italic">No criminal profiles located.</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => { setShowCreateModal(false); setEditingCrime(null); resetForm(); }}>Cancel</button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={isCreating || isUpdating}>
                  {(isCreating || isUpdating) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                  {editingCrime ? 'Save Changes' : 'Create'}
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
            <h2 className="text-lg font-bold mb-2 text-foreground">Delete Incident Record</h2>
            <p className="text-sm text-muted-foreground mb-5">Are you sure? This permanently deletes the logged incident from datastore databases.</p>
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
