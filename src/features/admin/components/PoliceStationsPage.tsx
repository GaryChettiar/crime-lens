import * as React from 'react';
import { AdminLayout } from '@/components/templates/AdminLayout/AdminLayout';
import {
  useGetStationsQuery,
  useCreateStationMutation,
  useUpdateStationMutation,
  useDeleteStationMutation,
  useBootstrapStationGeoJsonMutation,
} from '@/services/policeStationsApi';
import { useGetDistrictsQuery } from '@/services/districtsApi';
import { useGetStationTypesQuery } from '@/services/stationTypesApi';
import { TableSkeleton, EmptyState, ErrorState } from '@/components/molecules/DataStates';
import { Plus, Trash2, Edit2, Shield, Upload, FileJson, Loader2, Phone, Building2, Check } from 'lucide-react';

export function PoliceStationsPage() {
  // Queries
  const { data: districts } = useGetDistrictsQuery();
  const { data: stationTypes } = useGetStationTypesQuery();
  
  const [selectedDistrictFilter, setSelectedDistrictFilter] = React.useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = React.useState('');
  const [searchQuery, setSearchQuery] = React.useState('');

  const { data: stations, isLoading, isError, refetch } = useGetStationsQuery({
    districtId: selectedDistrictFilter || undefined,
    typeId: selectedTypeFilter || undefined,
  });

  const [createStation, { isLoading: isCreating }] = useCreateStationMutation();
  const [updateStation, { isLoading: isUpdating }] = useUpdateStationMutation();
  const [deleteStation] = useDeleteStationMutation();
  const [bootstrapGeoJson, { isLoading: isBootstrapping }] = useBootstrapStationGeoJsonMutation();

  // Component Modals / Form State
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [editingStation, setEditingStation] = React.useState<any | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = React.useState(false);

  // Form Fields
  const [name, setName] = React.useState('');
  const [code, setCode] = React.useState('');
  const [districtId, setDistrictId] = React.useState('');
  const [typeId, setTypeId] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [lat, setLat] = React.useState('');
  const [lng, setLng] = React.useState('');
  const [geojsonContent, setGeojsonContent] = React.useState('');

  // Hydrate fields on Edit
  React.useEffect(() => {
    if (editingStation) {
      setName(editingStation.name || '');
      setCode(editingStation.code || '');
      setDistrictId(editingStation.districtId || '');
      setTypeId(editingStation.typeId || '');
      setAddress(editingStation.address || '');
      setPhone(editingStation.phone || '');
      setLat(editingStation.latitude?.toString() || '');
      setLng(editingStation.longitude?.toString() || '');
    } else {
      setName('');
      setCode('');
      setDistrictId('');
      setTypeId('');
      setAddress('');
      setPhone('');
      setLat('');
      setLng('');
    }
  }, [editingStation]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await createStation({
        name: name.trim(),
        code: code.trim() || undefined,
        districtId: districtId || undefined,
        typeId: typeId || undefined,
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        latitude: lat ? parseFloat(lat) : undefined,
        longitude: lng ? parseFloat(lng) : undefined,
      }).unwrap();
      setShowCreateModal(false);
      resetForm();
    } catch (e) { console.error(e); }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStation) return;
    try {
      await updateStation({
        id: editingStation.id,
        body: {
          name: name.trim(),
          code: code.trim() || undefined,
          districtId: districtId || undefined,
          typeId: typeId || undefined,
          address: address.trim() || undefined,
          phone: phone.trim() || undefined,
          latitude: lat ? parseFloat(lat) : undefined,
          longitude: lng ? parseFloat(lng) : undefined,
        },
      }).unwrap();
      setEditingStation(null);
      resetForm();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteStation(id).unwrap();
      setConfirmDeleteId(null);
    } catch (e) { console.error(e); }
  };

  const handleBootstrap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!geojsonContent.trim()) return;
    try {
      const parsed = JSON.parse(geojsonContent);
      await bootstrapGeoJson({ geojson: parsed }).unwrap();
      setGeojsonContent('');
      setShowUploadModal(false);
      alert('GeoJSON uploaded and bootstrapped successfully!');
    } catch (e: any) {
      console.error(e);
      alert('Failed to bootstrap GeoJSON: ' + (e.message || 'Invalid JSON format'));
    }
  };

  const resetForm = () => {
    setName('');
    setCode('');
    setDistrictId('');
    setTypeId('');
    setAddress('');
    setPhone('');
    setLat('');
    setLng('');
  };

  const filteredStations = React.useMemo(() => {
    if (!stations) return [];
    return stations.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.districtName?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    });
  }, [stations, searchQuery]);

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">Police Stations</h1>
            <p className="text-sm mt-0.5 text-muted-foreground">Manage and georeference jurisdiction zones and stations.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="admin-btn admin-btn-secondary" onClick={() => setShowUploadModal(true)}>
              <Upload className="h-4 w-4 mr-1.5" /> Bootstrap GeoJSON
            </button>
            <button className="admin-btn admin-btn-primary" onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> Add Station
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            className="admin-input"
            placeholder="Search stations, codes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            className="admin-input"
            value={selectedDistrictFilter}
            onChange={(e) => setSelectedDistrictFilter(e.target.value)}
          >
            <option value="">All Districts</option>
            {districts?.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
          <select
            className="admin-input"
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
          >
            <option value="">All Station Types</option>
            {stationTypes?.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {isLoading && <TableSkeleton columns={6} rows={6} />}
        {isError && <ErrorState title="Failed to load police stations" onRetry={refetch} />}
        {!isLoading && !isError && filteredStations.length === 0 && (
          <EmptyState icon={Shield} title="No stations found" description="No police stations match current search parameters." />
        )}
        {!isLoading && !isError && filteredStations.length > 0 && (
          <div className="admin-card overflow-hidden">
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Station Name</th>
                    <th>Code</th>
                    <th>District</th>
                    <th>Type</th>
                    <th>Contact Info</th>
                    <th className="w-[120px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStations.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-primary/15 shrink-0">
                            <Shield className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <span className="font-semibold text-sm text-foreground block">{s.name}</span>
                            <span className="text-[11px] text-muted-foreground font-mono">{s.latitude && s.longitude ? `${s.latitude}, ${s.longitude}` : 'No Coordinates'}</span>
                          </div>
                        </div>
                      </td>
                      <td><span className="text-sm font-mono text-muted-foreground">{s.code || '—'}</span></td>
                      <td>
                        <div className="flex items-center gap-1.5 text-sm text-foreground">
                          <Building2 className="h-3.5 w-3.5 text-slate-400" />
                          {s.districtName || '—'}
                        </div>
                      </td>
                      <td><span className="admin-badge admin-badge-role">{s.typeName || '—'}</span></td>
                      <td>
                        <div className="text-xs space-y-0.5">
                          {s.phone && <div className="flex items-center gap-1 text-muted-foreground"><Phone className="h-3 w-3" /> {s.phone}</div>}
                          {s.address && <div className="max-w-[180px] truncate text-slate-400" title={s.address}>{s.address}</div>}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button className="p-1.5 rounded-md hover:bg-primary/10 text-primary" onClick={() => setEditingStation(s)} title="Edit">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button className="p-1.5 rounded-md hover:bg-danger/10 text-danger" onClick={() => setConfirmDeleteId(s.id)} title="Delete">
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
      {(showCreateModal || editingStation) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4 text-foreground">{editingStation ? 'Edit Police Station' : 'Add Police Station'}</h2>
            <form onSubmit={editingStation ? handleUpdate : handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">Station Name *</label>
                  <input className="admin-input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. HAL Police Station" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">Station Code</label>
                  <input className="admin-input font-mono" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. BLR-HAL" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">District *</label>
                  <select className="admin-input" required value={districtId} onChange={(e) => setDistrictId(e.target.value)}>
                    <option value="">Select District</option>
                    {districts?.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">Station Type *</label>
                  <select className="admin-input" required value={typeId} onChange={(e) => setTypeId(e.target.value)}>
                    <option value="">Select Type</option>
                    {stationTypes?.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">Latitude</label>
                  <input type="number" step="any" className="admin-input" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="e.g. 12.9562" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">Longitude</label>
                  <input type="number" step="any" className="admin-input" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="e.g. 77.6498" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">Phone Number</label>
                <input className="admin-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. +91 80 2294 2200" />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5 text-muted-foreground">Address</label>
                <textarea className="admin-input min-h-[60px] py-1.5" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter full address..." />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => { setShowCreateModal(false); setEditingStation(null); resetForm(); }}>Cancel</button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={isCreating || isUpdating}>
                  {(isCreating || isUpdating) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                  {editingStation ? 'Save Changes' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload GeoJSON Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-3">
              <FileJson className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Bootstrap Stations via GeoJSON</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Paste Karnataka Police Station boundaries / marker FeatureCollection GeoJSON to bootstrap datastore records.</p>
            <form onSubmit={handleBootstrap} className="space-y-4">
              <div>
                <textarea
                  className="admin-input min-h-[220px] font-mono text-xs py-2.5"
                  required
                  value={geojsonContent}
                  onChange={(e) => setGeojsonContent(e.target.value)}
                  placeholder='{ "type": "FeatureCollection", ... }'
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => { setShowUploadModal(false); setGeojsonContent(''); }}>Cancel</button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={isBootstrapping}>
                  {isBootstrapping ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Upload className="h-4 w-4 mr-1.5" />}
                  Bootstrap Import
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
            <h2 className="text-lg font-bold mb-2 text-foreground">Delete Station</h2>
            <p className="text-sm text-muted-foreground mb-5">Are you sure? All related officer assignments and crime logs referencing this station will lose station linkages.</p>
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
