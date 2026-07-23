import * as React from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/templates/AdminLayout/AdminLayout";
import {
  crimeApi,
  useGetCrimesQuery,
  useCreateCrimeMutation,
  useDeleteCrimeMutation,
  useGetCrimesByEvidencePathsQuery,
} from "@/services/crimeApi";
import { useAppSelector } from "@/store/hooks";
import { useTableQueryState } from "@/hooks/useTableQueryState";
import usePermissions from "@/hooks/usePermissions";
import {
  buildCrimeQuery,
  haveCrimeFiltersChanged,
} from "@/utils/buildQueryParams";
import {
  DataTable,
  DataTablePagination,
  DataTableToolbar,
  type DataTableColumn,
} from "@/components/common/DataTable";
import { CRIME_STATUS_COLORS, CRIME_STATUS_STEPS } from "../types";
import {
  Plus,
  FolderOpen,
  Eye,
  Trash2,
  RefreshCw,
  Check,
  X,
  Loader2,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useGetDistrictsQuery } from "@/services/districtsApi";
import { useGetStationsQuery } from "@/services/policeStationsApi";
import { useGetCrimeCategoriesQuery } from "@/services/crimeCategoryApi";
import type { CreateCrimePayload, CrimeRecord } from "@/services/crimeApi";
import type { GlobalFiltersState } from "@/store/slices/globalFiltersSlice";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TABLE_ID = "crimes";

// ---------------------------------------------------------------------------
// Column definitions — the only Crimes-specific part of this file
// ---------------------------------------------------------------------------

function buildColumns(
  districts: Array<{ id: string; name: string }> | undefined,
  categories: Array<{ ROWID: string; crime_category_name: string }> | undefined,
  onView: (c: CrimeRecord) => void,
  onDelete: (id: string) => void,
): DataTableColumn<CrimeRecord>[] {
  return [
    {
      key: "crimeNumber",
      header: "Crime ID",
      sortKey: "crime_number",
      headerClassName: "w-32",
      cell: (c) => (
        <span className="font-mono font-medium text-foreground">
          {c.crimeNumber}
        </span>
      ),
    },
    {
      key: "title",
      header: "Title",
      cell: (c) => (
        <div>
          <div className="font-semibold text-foreground">{c.title}</div>
          {c.description && (
            <div className="text-[10px] text-muted-foreground truncate max-w-xs">
              {c.description}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "crimeCategory",
      header: "Category",
      sortKey: undefined,
      cell: (c) => (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary">
          {categories?.find((cat) => cat.ROWID === c.crimeCategory)
            ?.crime_category_name || c.crimeCategory}
        </span>
      ),
    },
    {
      key: "district",
      header: "District",
      cell: (c) => (
        <span className="text-muted-foreground">
          {districts?.find((d) => d.id === c.district)?.name ||
            c.district ||
            "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortKey: "status",
      cell: (c) => {
        const label =
          CRIME_STATUS_STEPS.find((s) => s.value === c.status)?.label ??
          c.status;
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${CRIME_STATUS_COLORS[c.status] || "bg-muted/50 text-muted-foreground"}`}
          >
            {label}
          </span>
        );
      },
    },
    {
      key: "incidentDate",
      header: "Date",
      sortKey: "crime_occured_date_time",
      cell: (c) => (
        <span className="text-muted-foreground tabular-nums">
          {c.incidentDate
            ? new Date(c.incidentDate).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "—"}
        </span>
      ),
    },
    {
      key: "__actions__",
      header: "Actions",
      headerClassName: "text-right",
      cellClassName: "text-right",
      cell: (c) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link
            to={`/entities/crimes/${c.id}`}
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-primary hover:bg-primary/15"
              title="View Details"
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(c.id);
            }}
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
  const { hasPermission } = usePermissions();
  const { data: districts } = useGetDistrictsQuery();
  const { data: stations } = useGetStationsQuery();
  const { data: categories } = useGetCrimeCategoriesQuery();
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
  const [statusFilter, setStatusFilter] = React.useState("");
  const [showCreate, setShowCreate] = React.useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(
    null,
  );
  type AfisMatch = { criminal_id?: string; name?: string; score: number; metadata?: { original_path?: string, filename?: string } };
  type EvidenceItem = {
    id: string;
    evidence_type: string;
    file?: File;
    file_url?: string;
    isConfirmed?: boolean;
    afisLoading?: boolean;
    afisResult?: AfisMatch[] | null;
    afisError?: string;
  };
  const [form, setForm] = React.useState<
    Omit<Partial<CreateCrimePayload>, "evidences"> & {
      evidences?: EvidenceItem[];
    }
  >({ crimeCategory: "", evidences: [] });

  const AFIS_URL =
    "https://crimelens-60074096850.development.catalystserverless.in/server/Fingerprint-AFIS/execute";
  const MODEL_URL = (model: string) =>
    `https://models-50043087097.development.catalystappsail.in/identify/${model}`;
  const MODEL_ADMIN_KEY = "7f1d6e82d9b149f5a1c0f3c87b92e4d61f8e3c5a9b7d2e1f";

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
    globalFilters.crimeTypes,
    globalFilters.status,
    globalFilters.singleDate,
    globalFilters.dateRange.start,
    globalFilters.dateRange.end,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    resetPage,
  ]);

  // Sync status filter from global filters on mount
  React.useEffect(() => {
    if (globalFilters.status && !statusFilter)
      setStatusFilter(globalFilters.status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // Build the query
  // ---------------------------------------------------------------------------
  // Merge local inline filters into globalFilters-like shape for buildCrimeQuery
  const effectiveFilters = React.useMemo(
    () =>
      ({
        ...globalFilters,
        status: statusFilter || globalFilters.status,
      }) as GlobalFiltersState,
    [globalFilters, statusFilter],
  );

  const crimeQuery = React.useMemo(
    () =>
      buildCrimeQuery(
        { page, pageSize, sortBy, sortOrder },
        effectiveFilters,
        debouncedSearch,
      ),
    [page, pageSize, sortBy, sortOrder, effectiveFilters, debouncedSearch],
  );

  const {
    data: result,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetCrimesQuery(crimeQuery);

  // ---------------------------------------------------------------------------
  // Evidence Analysis
  // ---------------------------------------------------------------------------
  // Collect all paths from confirmed evidences to check for related crimes
  const matchedPathsToAnalyze = React.useMemo(() => {
    const paths = new Set<string>();
    form.evidences?.forEach(ev => {
      if (ev.isConfirmed && ev.afisResult) {
        ev.afisResult.forEach(match => {
          if (match.metadata?.original_path) paths.add(match.metadata.original_path);
          else if (match.name) paths.add(match.name);
          else if (match.criminal_id) paths.add(match.criminal_id);
        });
      }
    });
    return Array.from(paths);
  }, [form.evidences]);

  const { data: analysisData } = useGetCrimesByEvidencePathsQuery(matchedPathsToAnalyze, {
    skip: matchedPathsToAnalyze.length === 0,
  });

  const filesWithRelatedCrimes = React.useMemo(() => {
    if (!analysisData?.success || !analysisData.data) return [];
    
    return form.evidences?.filter(ev => {
      if (!ev.isConfirmed || !ev.afisResult) return false;
      const pathsForThisFile = ev.afisResult.map(m => m.metadata?.original_path || m.name || m.criminal_id);
      
      const fileMatchesWithCrimes = analysisData.data.filter(
        d => pathsForThisFile.includes(d.path)
      );
      return fileMatchesWithCrimes.length > 0;
    }).map(ev => ({
      evidenceId: ev.id,
      fileName: ev.file?.name || `${ev.evidence_type} uploaded`,
      matches: analysisData.data.filter(
        d => ev.afisResult!.map(m => m.metadata?.original_path || m.name || m.criminal_id).includes(d.path)
      )
    })) || [];
  }, [analysisData, form.evidences]);

  const handleOpenAnalysis = () => {
    localStorage.setItem("currentEvidenceAnalysis", JSON.stringify(filesWithRelatedCrimes));
    window.open("/entities/evidence-matches", "_blank");
  };

  // ---------------------------------------------------------------------------
  // Prefetch next page after successful fetch (RTK Query cache warm-up)
  // ---------------------------------------------------------------------------
  const prefetchCrimes = crimeApi.usePrefetch("getCrimes");

  React.useEffect(() => {
    if (result?.pagination.hasNext) {
      const nextQuery = buildCrimeQuery(
        { page: page + 1, pageSize, sortBy, sortOrder },
        effectiveFilters,
        debouncedSearch,
      );
      prefetchCrimes(nextQuery);
    }
  }, [
    result,
    page,
    pageSize,
    sortBy,
    sortOrder,
    effectiveFilters,
    debouncedSearch,
    prefetchCrimes,
  ]);

  // ---------------------------------------------------------------------------
  // Column definitions
  // ---------------------------------------------------------------------------
  const columns = React.useMemo(
    () =>
      buildColumns(
        districts,
        categories,
        (c) => navigate(`/entities/crimes/${c.id}`),
        setConfirmDeleteId,
      ),
    [districts, categories, navigate],
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
      const payload = {
        ...(form as CreateCrimePayload),
        evidences: form.evidences
          ?.filter((e) => e.isConfirmed)
          .map((e) => ({
            evidence_type: e.evidence_type,
            file_url: e.file_url,
            description: "Added from incident form",
          })),
      };
      const result = await createCrime(payload).unwrap();
      const newId = result.data?.id;
      setShowCreate(false);
      setForm({ crimeCategory: "", evidences: [] });
      if (newId) navigate(`/entities/crimes/${newId}`);
    } catch (err) {
      console.error("Create crime failed:", err);
    }
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await deleteCrime(confirmDeleteId).unwrap();
      setConfirmDeleteId(null);
    } catch (err) {
      console.error("Delete crime failed:", err);
    }
  };

  // ---------------------------------------------------------------------------
  // Filter reset
  // ---------------------------------------------------------------------------
  const hasActiveFilters = searchInput || statusFilter;

  const clearFilters = () => {
    setSearchInput("");
    setStatusFilter("");
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
              {pagination
                ? `${pagination.totalRecords.toLocaleString()} crime${pagination.totalRecords !== 1 ? "s" : ""} found`
                : "Loading..."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="h-8 px-3 text-xs gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
            {hasPermission('update_crime') && (
              <Button
                size="sm"
                onClick={() => setShowCreate(true)}
                className="h-8 px-3 text-xs gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                New Crime
              </Button>
            )}
          </div>
        </div>

        {/* Floating Evidence Match Card */}
        {filesWithRelatedCrimes.length > 0 && showCreate && (
          <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-bottom-5">
            <div className="bg-card border-2 border-primary/40 shadow-xl rounded-xl p-4 flex flex-col gap-3 w-80">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full mt-0.5 shrink-0">
                  <FolderOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm leading-tight text-foreground">Evidence Matches Found</h3>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {filesWithRelatedCrimes.length} uploaded file(s) have matches in the database.
                  </p>
                </div>
              </div>
              <Button size="sm" onClick={handleOpenAnalysis} className="w-full text-xs h-8">
                View Related Crimes <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <DataTableToolbar
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="Search crimes... (min 2 chars)"
          actions={
            hasActiveFilters ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
              >
                Clear Filters
              </Button>
            ) : undefined
          }
        >
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              resetPage();
            }}
            className="h-8 px-3 text-xs rounded-lg border border-border bg-background/60 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
            aria-label="Filter by status"
          >
            <option value="">All Statuses</option>
            {CRIME_STATUS_STEPS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
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
          emptyDescription={
            hasActiveFilters
              ? "No crime incidents matched your filters."
              : 'Click "New Crime" to log an incident.'
          }
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
                  <label className="text-[10px] font-semibold uppercase text-muted-foreground">
                    Incident Title *
                  </label>
                  <Input
                    required
                    placeholder="e.g. Break-in at Sector 4 Commercial Complex"
                    value={form.title || ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, title: e.target.value }))
                    }
                    className="h-8.5 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase text-muted-foreground">
                      Crime Category *
                    </label>
                    <select
                      required
                      value={form.crimeCategory || ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          crimeCategory: e.target.value,
                        }))
                      }
                      className="w-full h-8.5 px-3 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                    >
                      <option value="">Select Category</option>
                      {(categories ?? []).map((c: any) => (
                        <option key={c.ROWID} value={c.ROWID}>
                          {c.crime_category_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase text-muted-foreground">
                      Incident Date/Time *
                    </label>
                    <Input
                      type="datetime-local"
                      required
                      value={form.incidentDate || ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, incidentDate: e.target.value }))
                      }
                      className="h-8.5 text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase text-muted-foreground">
                      District Zone *
                    </label>
                    <select
                      required
                      value={form.district || ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, district: e.target.value }))
                      }
                      className="w-full h-8.5 px-3 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                    >
                      <option value="">Select District</option>
                      {(districts ?? []).map((d: any) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase text-muted-foreground">
                      Police Station *
                    </label>
                    <select
                      required
                      value={form.assignedStationId || ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          assignedStationId: e.target.value,
                        }))
                      }
                      className="w-full h-8.5 px-3 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                    >
                      <option value="">Select Station</option>
                      {(stations ?? []).map((s: any) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase text-muted-foreground">
                      FIR ID
                    </label>
                    <Input
                      placeholder="e.g. FIR/2023/1234"
                      value={form.firId || ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, firId: e.target.value }))
                      }
                      className="h-8.5 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase text-muted-foreground">
                      Weapon (Optional)
                    </label>
                    <Input
                      placeholder="e.g. Firearm, Knife, None"
                      value={form.weaponUsed || ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, weaponUsed: e.target.value }))
                      }
                      className="h-8.5 text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase text-muted-foreground">
                      Latitude
                    </label>
                    <Input
                      type="number"
                      step="any"
                      placeholder="e.g. 12.9716"
                      value={form.location?.coordinates?.[0] ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          location: {
                            ...f.location,
                            coordinates: [
                              parseFloat(e.target.value) || 0,
                              f.location?.coordinates?.[1] || 0,
                            ],
                          },
                        }))
                      }
                      className="h-8.5 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase text-muted-foreground">
                      Longitude
                    </label>
                    <Input
                      type="number"
                      step="any"
                      placeholder="e.g. 77.5946"
                      value={form.location?.coordinates?.[1] ?? ""}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          location: {
                            ...f.location,
                            coordinates: [
                              f.location?.coordinates?.[0] || 0,
                              parseFloat(e.target.value) || 0,
                            ],
                          },
                        }))
                      }
                      className="h-8.5 text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase text-muted-foreground">
                    Crime Location Address
                  </label>
                  <Input
                    placeholder="e.g. 42 Park Road, Indiranagar"
                    value={form.crimeLocation || ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, crimeLocation: e.target.value }))
                    }
                    className="h-8.5 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase text-muted-foreground">
                    Description / Case Details
                  </label>
                  <textarea
                    placeholder="Provide detailed operational details..."
                    value={form.description || ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                    className="w-full h-20 p-2.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
                  />
                </div>

                {/* Evidence Repeater Section */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-semibold uppercase text-muted-foreground">
                      Evidences
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 text-[10px] px-2 py-0 gap-1"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          evidences: [
                            ...(f.evidences || []),
                            {
                              id: Date.now().toString(),
                              evidence_type: "fingerprint",
                            },
                          ],
                        }))
                      }
                    >
                      <Plus className="h-3 w-3" /> Add Evidence
                    </Button>
                  </div>
                  {(form.evidences || []).map((ev, index) => (
                    <div
                      key={ev.id}
                      className={`grid grid-cols-[100px_1fr_auto] gap-2 items-center p-2 rounded-lg border ${ev.isConfirmed ? "border-primary/40 bg-primary/5" : "border-border"}`}
                    >
                      <select
                        value={ev.evidence_type}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            evidences: f.evidences?.map((item) =>
                              item.id === ev.id
                                ? { ...item, evidence_type: e.target.value }
                                : item,
                            ),
                          }))
                        }
                        className="h-7 px-2 text-xs rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                        disabled={ev.isConfirmed}
                      >
                        <option value="fingerprint">Fingerprint</option>
                        <option value="face">Face</option>
                        <option value="footprint">Footprint</option>
                      </select>

                      <div className="flex items-center gap-2">
                        {ev.file_url ? (
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-background border border-border rounded px-2 h-7 flex-1">
                            <span className="truncate flex-1">
                              Image uploaded
                            </span>
                            {!ev.isConfirmed && (
                              <button
                                type="button"
                                className="text-destructive hover:bg-destructive/10 p-0.5 rounded"
                                onClick={() =>
                                  setForm((f) => ({
                                    ...f,
                                    evidences: f.evidences?.map((item) =>
                                      item.id === ev.id
                                        ? { ...item, file_url: undefined }
                                        : item,
                                    ),
                                  }))
                                }
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <input
                            type="file"
                            accept="image/*"
                            disabled={ev.isConfirmed}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setForm((f) => ({
                                    ...f,
                                    evidences: f.evidences?.map((item) =>
                                      item.id === ev.id
                                        ? {
                                            ...item,
                                            file,
                                            file_url: reader.result as string,
                                          }
                                        : item,
                                    ),
                                  }));
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="block w-full text-xs text-muted-foreground
                              file:mr-2 file:py-1 file:px-2 file:h-7
                              file:rounded-md file:border-0
                              file:text-[10px] file:font-semibold
                              file:bg-primary/10 file:text-primary
                              hover:file:bg-primary/20
                              cursor-pointer bg-background border border-border rounded-md h-7 items-center flex"
                          />
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={`h-7 w-7 ${ev.isConfirmed ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
                          disabled={ev.afisLoading}
                          onClick={async () => {
                            // If already confirmed, toggle back to editable
                            if (ev.isConfirmed) {
                              setForm((f) => ({
                                ...f,
                                evidences: f.evidences?.map((item) =>
                                  item.id === ev.id
                                    ? {
                                        ...item,
                                        isConfirmed: false,
                                        afisResult: undefined,
                                        afisError: undefined,
                                      }
                                    : item,
                                ),
                              }));
                              return;
                            }

                            if (
                              ev.evidence_type === "fingerprint" &&
                              ev.file_url
                            ) {
                              // ── Fingerprint: base64 JSON → AFIS ──────────────────────────────
                              const base64 = ev.file_url.replace(
                                /^data:[^;]+;base64,/,
                                "",
                              );
                              const filename = `evidence_${ev.id}.jpg`;
                              setForm((f) => ({
                                ...f,
                                evidences: f.evidences?.map((item) =>
                                  item.id === ev.id
                                    ? {
                                        ...item,
                                        afisLoading: true,
                                        afisError: undefined,
                                      }
                                    : item,
                                ),
                              }));
                              try {
                                const resp = await fetch(AFIS_URL, {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    action: "identify",
                                    filename,
                                    topN: 5,
                                    image: base64,
                                  }),
                                });
                                const data = await resp.json();
                                const matches: AfisMatch[] =
                                  data?.matches ?? data?.results ?? [];
                                setForm((f) => ({
                                  ...f,
                                  evidences: f.evidences?.map((item) =>
                                    item.id === ev.id
                                      ? {
                                          ...item,
                                          afisLoading: false,
                                          afisResult: matches,
                                          isConfirmed: true,
                                        }
                                      : item,
                                  ),
                                }));
                              } catch {
                                setForm((f) => ({
                                  ...f,
                                  evidences: f.evidences?.map((item) =>
                                    item.id === ev.id
                                      ? {
                                          ...item,
                                          afisLoading: false,
                                          afisError: "AFIS API call failed",
                                          isConfirmed: true,
                                        }
                                      : item,
                                  ),
                                }));
                              }
                            } else if (
                              (ev.evidence_type === "face" ||
                                ev.evidence_type === "footprint") &&
                              ev.file
                            ) {
                              // ── Face / Footprint: FormData → AppSail model ────────────────────
                              const model = ev.evidence_type; // 'face' | 'footprint'
                              setForm((f) => ({
                                ...f,
                                evidences: f.evidences?.map((item) =>
                                  item.id === ev.id
                                    ? {
                                        ...item,
                                        afisLoading: true,
                                        afisError: undefined,
                                      }
                                    : item,
                                ),
                              }));
                              try {
                                const fd = new FormData();
                                fd.append("image", ev.file!);
                                const resp = await fetch(MODEL_URL(model), {
                                  method: "POST",
                                  headers: { "X-Admin-Key": MODEL_ADMIN_KEY },
                                  body: fd,
                                });
                                const data = await resp.json();
                                const matches: AfisMatch[] =
                                  data?.matches ?? data?.results ?? [];
                                setForm((f) => ({
                                  ...f,
                                  evidences: f.evidences?.map((item) =>
                                    item.id === ev.id
                                      ? {
                                          ...item,
                                          afisLoading: false,
                                          afisResult: matches,
                                          isConfirmed: true,
                                        }
                                      : item,
                                  ),
                                }));
                              } catch {
                                setForm((f) => ({
                                  ...f,
                                  evidences: f.evidences?.map((item) =>
                                    item.id === ev.id
                                      ? {
                                          ...item,
                                          afisLoading: false,
                                          afisError: `${model} model API call failed`,
                                          isConfirmed: true,
                                        }
                                      : item,
                                  ),
                                }));
                              }
                            } else {
                              // No file or unrecognised type → just confirm
                              setForm((f) => ({
                                ...f,
                                evidences: f.evidences?.map((item) =>
                                  item.id === ev.id
                                    ? { ...item, isConfirmed: true }
                                    : item,
                                ),
                              }));
                            }
                          }}
                          title={
                            ev.isConfirmed
                              ? "Edit Evidence"
                              : ev.file_url
                                ? `Identify ${ev.evidence_type.charAt(0).toUpperCase() + ev.evidence_type.slice(1)} & Confirm`
                                : "Confirm Evidence"
                          }
                        >
                          {ev.afisLoading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/15"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              evidences: f.evidences?.filter(
                                (item) => item.id !== ev.id,
                              ),
                            }))
                          }
                          title="Remove Evidence"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      {/* Identification Result Panel */}
                      {ev.isConfirmed &&
                        (ev.afisResult !== undefined || ev.afisError) && (
                          <div className="col-span-3 mt-1 rounded-md border border-primary/20 bg-primary/5 p-2 text-[10px] space-y-1">
                            {ev.afisError ? (
                              <span className="text-destructive font-medium">
                                {ev.afisError}
                              </span>
                            ) : ev.afisResult && ev.afisResult.length > 0 ? (
                              <>
                                <div className="font-semibold text-primary capitalize">
                                  {ev.evidence_type} Matches (Top{" "}
                                  {ev.afisResult.length})
                                </div>
                                {ev.afisResult.map((match, i) => (
                                  <div
                                    key={i}
                                    className="flex items-center justify-between text-muted-foreground"
                                  >
                                    <span className="font-medium text-foreground">
                                      {match.metadata?.filename || match.name || match.criminal_id}
                                    </span>
                                    <span className="tabular-nums">
                                      Score:{" "}
                                      {typeof match.score === "number"
                                        ? match.score.toFixed(4)
                                        : match.score}
                                    </span>
                                  </div>
                                ))}
                              </>
                            ) : (
                              <span className="text-muted-foreground">
                                No {ev.evidence_type} matches found in the
                                database.
                              </span>
                            )}
                          </div>
                        )}
                    </div>
                  ))}
                  {form.evidences &&
                    form.evidences.length > 0 &&
                    form.evidences.some((e) => !e.isConfirmed) && (
                      <div className="text-[10px] text-amber-500 font-medium">
                        Please confirm (tick) the evidence items before
                        submitting.
                      </div>
                    )}
                </div>
                <DialogFooter className="gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreate(false)}
                    disabled={isCreating}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={isCreating}>
                    {isCreating ? "Creating..." : "Log Incident"}
                  </Button>
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
                <DialogTitle className="text-sm font-semibold">
                  Delete Incident Record
                </DialogTitle>
              </DialogHeader>
              <div className="py-2 text-xs text-muted-foreground">
                Are you sure you want to permanently delete this crime incident?
                This action is irreversible.
              </div>
              <DialogFooter className="gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConfirmDeleteId(null)}
                >
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
