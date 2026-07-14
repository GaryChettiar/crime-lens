import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/templates/AdminLayout/AdminLayout';
import { crimeApi, useGetCrimesQuery, useCreateCrimeMutation, useDeleteCrimeMutation } from '@/services/crimeApi';
import { useAppSelector } from '@/store/hooks';
import { useTableQueryState } from '@/hooks/useTableQueryState';
import { buildCrimeQuery, haveCrimeFiltersChanged } from '@/utils/buildQueryParams';
import {
  DataTable,
  DataTablePagination,
  DataTableToolbar,
  type DataTableColumn,
} from '@/components/common/DataTable';
import { CRIME_STATUS_COLORS, CRIME_STATUS_STEPS } from '../types';
import { Plus, FolderOpen, Eye, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useGetDistrictsQuery } from '@/services/districtsApi';
import type { CreateCrimePayload, CrimeRecord } from '@/services/crimeApi';
import type { GlobalFiltersState } from '@/store/slices/globalFiltersSlice';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TABLE_ID = 'crimes';

const CRIME_CATEGORIES = [
  'Theft', 'Robbery', 'Assault', 'Murder', 'Kidnapping', 'Fraud',
  'Cyber Crime', 'Narcotics', 'Vehicle Theft', 'Burglary',
  'Sexual Assault', 'Terrorism', 'Money Laundering', 'Extortion', 'Arson', 'Other',
];

// ---------------------------------------------------------------------------
// Column definitions — the only Crimes-specific part of this file
// ---------------------------------------------------------------------------

function buildColumns(
  districts: Array<{ id: string; name: string }> | undefined,
  onView: (c: CrimeRecord) => void,
  onDelete: (id: string) => void
): DataTableColumn<CrimeRecord>[] {
  return [
    {
      key: 'crimeNumber',
      header: 'Crime ID',
      sortKey: 'crime_number',
      headerClassName: 'w-32',
      cell: (c) => (
        <span className="font-mono font-medium text-foreground">{c.crimeNumber}</span>
      ),
    },
    {
      key: 'title',
      header: 'Title',
      cell: (c) => (
        <div>
          <div className="font-semibold text-foreground">{c.title}</div>
          {c.description && (
            <div className="text-[10px] text-muted-foreground truncate max-w-xs">{c.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'crimeCategory',
      header: 'Category',
      sortKey: undefined,
      cell: (c) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary">
          {c.crimeCategory}
        </span>
      ),
    },
    {
      key: 'district',
      header: 'District',
      cell: (c) => (
        <span className="text-muted-foreground">
          {districts?.find((d) => d.id === c.district)?.name || c.district || '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortKey: 'status',
      cell: (c) => {
        const label = CRIME_STATUS_STEPS.find((s) => s.value === c.status)?.label ?? c.status;
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${CRIME_STATUS_COLORS[c.status] || 'bg-muted/50 text-muted-foreground'}`}>
            {label}
          </span>
        );
      },
    },
    {
      key: 'incidentDate',
      header: 'Date',
      sortKey: 'crime_occured_date_time',
      cell: (c) => (
        <span className="text-muted-foreground tabular-nums">
          {c.incidentDate ? new Date(c.incidentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
        </span>
      ),
    },
    {
      key: '__actions__',
      header: 'Actions',
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      cell: (c) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link to={`/entities/crimes/${c.id}`} onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-primary/15" title="View Details">
              <Eye className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
            className="h-7 w-7 text-destructive hover:bg-destructive/15"
            title="Delete Record"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];
}

// ---------------------------------------------------------------------------
// CrimesListPage
// ---------------------------------------------------------------------------

export function CrimesListPage() {
  const navigate = useNavigate();
  const { data: districts } = useGetDistrictsQuery();
  const globalFilters = useAppSelector((s) => s.globalFilters);
  const prevFiltersRef = React.useRef<GlobalFiltersState | null>(null);

  // All pagination/sort/search/URL state from the generic hook
  const {
    page,
    pageSize,
    sortBy,
    sortOrder,
    searchInput,
    debouncedSearch,
    setPage,
    setPageSize,
    setSort,
    resetPage,
    setSearchInput,
  } = useTableQueryState(TABLE_ID);

  // Local UI state only
  const [statusFilter, setStatusFilter] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('');
  const [showCreate, setShowCreate] = React.useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<Partial<CreateCrimePayload>>({ crimeCategory: '' });

  // ---------------------------------------------------------------------------
  // Global filters → reset page if anything crime-relevant changed
  // ---------------------------------------------------------------------------
  React.useEffect(() => {
    if (haveCrimeFiltersChanged(prevFiltersRef.current, globalFilters)) {
      resetPage();
    }
    prevFiltersRef.current = globalFilters;
  }, [
    globalFilters.district,
    globalFilters.policeStation,
    globalFilters.crimeCategory,
    globalFilters.status,
    globalFilters.singleDate,
    globalFilters.dateRange.start,
    globalFilters.dateRange.end,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    resetPage,
  ]);

  // Sync status/category filter from global filters on mount
  React.useEffect(() => {
    if (globalFilters.status && !statusFilter) setStatusFilter(globalFilters.status);
    if (globalFilters.crimeCategory && !categoryFilter) setCategoryFilter(globalFilters.crimeCategory);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // Build the query
  // ---------------------------------------------------------------------------
  // Merge local inline filters into globalFilters-like shape for buildCrimeQuery
  const effectiveFilters = React.useMemo(() => ({
    ...globalFilters,
    status: statusFilter || globalFilters.status,
    crimeCategory: categoryFilter || globalFilters.crimeCategory,
  } as GlobalFiltersState), [globalFilters, statusFilter, categoryFilter]);

  const crimeQuery = React.useMemo(
    () => buildCrimeQuery({ page, pageSize, sortBy, sortOrder }, effectiveFilters, debouncedSearch),
    [page, pageSize, sortBy, sortOrder, effectiveFilters, debouncedSearch]
  );

  const { data: result, isLoading, isFetching, isError, refetch } = useGetCrimesQuery(crimeQuery);

  // ---------------------------------------------------------------------------
  // Prefetch next page after successful fetch (RTK Query cache warm-up)
  // ---------------------------------------------------------------------------
  const prefetchCrimes = crimeApi.usePrefetch('getCrimes');

  React.useEffect(() => {
    if (result?.pagination.hasNext) {
      const nextQuery = buildCrimeQuery(
        { page: page + 1, pageSize, sortBy, sortOrder },
        effectiveFilters,
        debouncedSearch
      );
      prefetchCrimes(nextQuery);
    }
  }, [result, page, pageSize, sortBy, sortOrder, effectiveFilters, debouncedSearch, prefetchCrimes]);

  // ---------------------------------------------------------------------------
  // Column definitions
  // ---------------------------------------------------------------------------
  const columns = React.useMemo(
    () => buildColumns(districts, (c) => navigate(`/entities/crimes/${c.id}`), setConfirmDeleteId),
    [districts, navigate]
  );

  // ---------------------------------------------------------------------------
  // CRUD handlers
  // ---------------------------------------------------------------------------
  const [createCrime, { isLoading: isCreating }] = useCreateCrimeMutation();
  const [deleteCrime] = useDeleteCrimeMutation();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title?.trim() || !form.crimeCategory) return;
    try {
      const result = await createCrime(form as CreateCrimePayload).unwrap();
      const newId = result.data?.id;
      setShowCreate(false);
      setForm({ crimeCategory: '' });
      if (newId) navigate(`/entities/crimes/${newId}`);
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

  // ---------------------------------------------------------------------------
  // Filter reset
  // ---------------------------------------------------------------------------
  const hasActiveFilters = searchInput || statusFilter || categoryFilter;

  const clearFilters = () => {
    setSearchInput('');
    setStatusFilter('');
    setCategoryFilter('');
    resetPage();
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  const pagination = result?.pagination;
  const crimes = result?.data ?? [];

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
              {pagination ? `${pagination.totalRecords.toLocaleString()} crime${pagination.totalRecords !== 1 ? 's' : ''} found` : 'Loading...'}
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

        {/* Toolbar */}
        <DataTableToolbar
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search crimes... (min 2 chars)"
          actions={
            hasActiveFilters ? (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs text-muted-foreground hover:text-foreground">
                Clear Filters
              </Button>
            ) : undefined
          }
        >
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); resetPage(); }}
            className="h-8 px-3 text-xs rounded-lg border border-border bg-background/60 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            aria-label="Filter by status"
          >
            <option value="">All Statuses</option>
            {CRIME_STATUS_STEPS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); resetPage(); }}
            className="h-8 px-3 text-xs rounded-lg border border-border bg-background/60 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            aria-label="Filter by category"
          >
            <option value="">All Categories</option>
            {CRIME_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </DataTableToolbar>

        {/* Table */}
        <DataTable<CrimeRecord>
          columns={columns}
          data={crimes}
          isLoading={isLoading}
          isFetching={isFetching && !isLoading}
          isError={isError}
          onRetry={refetch}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={(key, order) => setSort(key, order)}
          rowKey={(c) => c.id}
          emptyIcon={FolderOpen}
          emptyTitle="No Crimes Found"
          emptyDescription={hasActiveFilters ? 'No crime incidents matched your filters.' : 'Click "New Crime" to log an incident.'}
          errorTitle="Failed to load crime incidents"
          errorMessage="Could not connect to the intel database. Please try again."
        />

        {/* Pagination */}
        {pagination && pagination.totalPages > 0 && (
          <DataTablePagination
            pagination={pagination}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
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
                      {(districts ?? []).map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
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
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowCreate(false)} disabled={isCreating}>Cancel</Button>
                  <Button type="submit" size="sm" disabled={isCreating}>{isCreating ? 'Creating...' : 'Log Incident'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* Delete Confirmation */}
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
                <Button size="sm" variant="outline" onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
                <Button size="sm" variant="destructive" onClick={handleDelete}>Delete</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

      </div>
    </AdminLayout>
  );
}
