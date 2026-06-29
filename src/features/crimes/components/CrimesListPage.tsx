import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/templates/AdminLayout/AdminLayout';
import { useGetCrimesQuery, useCreateCrimeMutation, useDeleteCrimeMutation } from '@/services/crimeApi';
import { useGetDistrictsQuery } from '@/services/districtsApi';
import { TableSkeleton, EmptyState, ErrorState } from '@/components/molecules/DataStates';
import { useAppSelector } from '@/store/hooks';
import { CRIME_STATUS_COLORS, CRIME_STATUS_STEPS } from '../types';
import {
  Plus, Search, Trash2, Eye, FolderOpen, RefreshCw, ChevronUp, ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import type { CreateCrimePayload, CrimeStatus } from '@/services/crimeApi';

const CRIME_CATEGORIES = [
  'Theft', 'Robbery', 'Assault', 'Murder', 'Kidnapping', 'Fraud', 'Cyber Crime',
  'Narcotics', 'Vehicle Theft', 'Burglary', 'Sexual Assault', 'Terrorism',
  'Money Laundering', 'Extortion', 'Arson', 'Other',
];

type SortKey = 'crimeNumber' | 'crimeCategory' | 'status' | 'incidentDate' | 'district';
type SortDir = 'asc' | 'desc';

export function CrimesListPage() {
  const navigate = useNavigate();
  const { data: districts } = useGetDistrictsQuery();
  const globalFilters = useAppSelector((s) => s.globalFilters);

  // --- Filters ---
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('');
  const [districtFilter, setDistrictFilter] = React.useState('');

  // --- Sorting ---
  const [sortKey, setSortKey] = React.useState<SortKey>('crimeNumber');
  const [sortDir, setSortDir] = React.useState<SortDir>('desc');

  // --- Pagination ---
  const [page, setPage] = React.useState(1);
  const PAGE_SIZE = 15;

  // --- Modals ---
  const [showCreate, setShowCreate] = React.useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);

  // Sync from global filters
  React.useEffect(() => {
    if (globalFilters.district) setDistrictFilter(globalFilters.district);
    if (globalFilters.crimeCategory) setCategoryFilter(globalFilters.crimeCategory);
    if (globalFilters.status) setStatusFilter(globalFilters.status);
  }, [globalFilters.district, globalFilters.crimeCategory, globalFilters.status]);

  const { data: crimes, isLoading, isError, refetch } = useGetCrimesQuery({
    status: statusFilter || undefined,
    district: districtFilter || undefined,
    crimeCategory: categoryFilter || undefined,
  });

  const [createCrime, { isLoading: isCreating }] = useCreateCrimeMutation();
  const [deleteCrime] = useDeleteCrimeMutation();

  // --- Form state ---
  const [form, setForm] = React.useState<Partial<CreateCrimePayload>>({
    crimeCategory: '',
  });

  const resetForm = () => setForm({ crimeCategory: '' });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title?.trim() || !form.crimeCategory) return;
    try {
      const result = await createCrime(form as CreateCrimePayload).unwrap();
      const newId = result.data?.id;
      setShowCreate(false);
      resetForm();
      if (newId) navigate(`/crimes/${newId}`);
    } catch (err) {
      console.error('Create crime failed:', err);
    }
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await deleteCrime(confirmDeleteId).unwrap();
      setConfirmDeleteId(null);
    } catch (err) {
      console.error('Delete crime failed:', err);
    }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  // --- Derived / filtered list ---
  const filtered = React.useMemo(() => {
    let list = crimes ?? [];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.crimeNumber.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.crimeCategory.toLowerCase().includes(q) ||
          (c.district ?? '').toLowerCase().includes(q)
      );
    }
    list = [...list].sort((a, b) => {
      const aVal = String((a as any)[sortKey] ?? '');
      const bVal = String((b as any)[sortKey] ?? '');
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
    return list;
  }, [crimes, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k ? (
      sortDir === 'asc' ? <ChevronUp className="h-3 w-3 inline ml-0.5" /> : <ChevronDown className="h-3 w-3 inline ml-0.5" />
    ) : null;

  const hasActiveFilters = search || statusFilter || categoryFilter || districtFilter;

  return (
    <AdminLayout>
      <div className="space-y-5 max-w-[1400px] mx-auto pb-10">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-primary" />
              Crimes
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {filtered.length} crime{filtered.length !== 1 ? 's' : ''} found
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} className="h-8 px-3 text-xs gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setShowCreate(true)} className="h-8 px-3 text-xs gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              New Crime
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card/60 border border-border/60 rounded-xl p-3 flex flex-wrap items-center gap-2.5 backdrop-blur-sm">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search crimes..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="h-8 pl-8 pr-3 text-xs bg-background/60"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="h-8 px-3 text-xs rounded-lg border border-border bg-background/60 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          >
            <option value="">All Statuses</option>
            {CRIME_STATUS_STEPS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className="h-8 px-3 text-xs rounded-lg border border-border bg-background/60 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          >
            <option value="">All Categories</option>
            {CRIME_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            value={districtFilter}
            onChange={(e) => { setDistrictFilter(e.target.value); setPage(1); }}
            className="h-8 px-3 text-xs rounded-lg border border-border bg-background/60 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
          >
            <option value="">All Districts</option>
            {(districts ?? []).map((d: any) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                setCategoryFilter('');
                setDistrictFilter('');
                setPage(1);
              }}
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* List State Handling */}
        {isLoading && <TableSkeleton columns={6} rows={8} />}
        {isError && (
          <ErrorState
            title="Failed to load crime incidents"
            onRetry={() => { refetch(); }}
            message="Could not connect to the intel database. Please try again."
          />
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <EmptyState
            icon={FolderOpen}
            title="No Crimes Found"
            description={hasActiveFilters ? 'No logged crime incidents matched your filters.' : 'Click "New Crime" to log an incident.'}
          />
        )}

        {!isLoading && !isError && filtered.length > 0 && (
          <div className="bg-card/40 border border-border/60 rounded-xl overflow-hidden backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/20 text-left">
                    <th className="px-4 py-3 font-semibold text-muted-foreground cursor-pointer select-none" onClick={() => handleSort('crimeNumber')}>
                      Crime ID <SortIcon k="crimeNumber" />
                    </th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Title</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground cursor-pointer select-none" onClick={() => handleSort('crimeCategory')}>
                      Category <SortIcon k="crimeCategory" />
                    </th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground cursor-pointer select-none" onClick={() => handleSort('district')}>
                      District <SortIcon k="district" />
                    </th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground cursor-pointer select-none" onClick={() => handleSort('status')}>
                      Status <SortIcon k="status" />
                    </th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.map((c) => {
                    const statusConfig = CRIME_STATUS_STEPS.find((s) => s.value === c.status);
                    const statusLabel = statusConfig?.label ?? c.status;
                    return (
                      <tr key={c.id} className="border-b border-border/40 hover:bg-muted/10 transition-colors">
                        <td className="px-4 py-3 font-mono font-medium text-foreground">{c.crimeNumber}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-foreground">{c.title}</div>
                          {c.description && <div className="text-[10px] text-muted-foreground truncate max-w-xs">{c.description}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary">
                            {c.crimeCategory}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {districts?.find((d) => d.id === c.district)?.name || c.district || '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${CRIME_STATUS_COLORS[c.status] || 'bg-muted/50 text-muted-foreground'}`}>
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link to={`/crimes/${c.id}`}>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-primary/15" title="Workspace Details">
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setConfirmDeleteId(c.id)}
                              className="h-7 w-7 text-destructive hover:bg-destructive/15"
                              title="Delete Record"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 bg-muted/10">
                <span className="text-[10px] text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                    Prev
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Create Dialog */}
        {showCreate && (
          <Dialog open onOpenChange={(o) => !o && setShowCreate(false)}>
            <DialogContent className="sm:max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-sm font-semibold flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-primary" />
                  Log New Crime Incident
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleCreate} className="space-y-4 pt-1">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase text-muted-foreground">Incident Title *</label>
                  <Input required placeholder="e.g. Break-in at Sector 4 Commercial Complex" value={form.title || ''} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="h-8.5 text-xs" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase text-muted-foreground">Crime Category *</label>
                    <select required value={form.crimeCategory || ''} onChange={(e) => setForm((f) => ({ ...f, crimeCategory: e.target.value }))} className="w-full h-8.5 px-3 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50">
                      <option value="">Select Category</option>
                      {CRIME_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase text-muted-foreground">Incident Date/Time *</label>
                    <Input type="datetime-local" required value={form.incidentDate || ''} onChange={(e) => setForm((f) => ({ ...f, incidentDate: e.target.value }))} className="h-8.5 text-xs" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase text-muted-foreground">District Zone *</label>
                    <select required value={form.district || ''} onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))} className="w-full h-8.5 px-3 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50">
                      <option value="">Select District</option>
                      {(districts ?? []).map((d: any) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase text-muted-foreground">Weapon (Optional)</label>
                    <Input placeholder="e.g. Firearm, Knife, None" value={form.weaponUsed || ''} onChange={(e) => setForm((f) => ({ ...f, weaponUsed: e.target.value }))} className="h-8.5 text-xs" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase text-muted-foreground">Crime Location Address</label>
                  <Input placeholder="e.g. 42 Park Road, Indiranagar" value={form.crimeLocation || ''} onChange={(e) => setForm((f) => ({ ...f, crimeLocation: e.target.value }))} className="h-8.5 text-xs" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase text-muted-foreground">Description / Case Details</label>
                  <textarea placeholder="Provide detailed operational details..." value={form.description || ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full h-20 p-2.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none" />
                </div>

                <DialogFooter className="gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => { setShowCreate(false); resetForm(); }} disabled={isCreating}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={isCreating}>
                    {isCreating ? 'Creating...' : 'Log Incident'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* Delete Dialog */}
        {confirmDeleteId && (
          <Dialog open onOpenChange={(o) => !o && setConfirmDeleteId(null)}>
            <DialogContent className="sm:max-w-sm bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-sm font-semibold">Delete Incident Record</DialogTitle>
              </DialogHeader>
              <div className="py-2 text-xs text-muted-foreground">
                Are you sure you want to permanently delete this crime incident? This action is irreversible.
              </div>
              <DialogFooter className="gap-2">
                <Button size="sm" variant="outline" onClick={() => setConfirmDeleteId(null)}>
                  Cancel
                </Button>
                <Button size="sm" variant="destructive" onClick={handleDelete}>
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AdminLayout>
  );
}
