import * as React from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/templates/AdminLayout/AdminLayout";
import {
  crimeApi,
  useGetCrimesQuery,
  useGetCrimeByIdQuery,
  useCreateCrimeMutation,
  useDeleteCrimeMutation,
  useGetCrimesByEvidencePathsQuery,
  useUploadCrimeEvidenceMutation,
  uploadEvidenceFileToStorage,
} from "@/services/crimeApi";
import { useGetEvidenceBlobQuery } from "@/services/storageApi";
import { useAppSelector } from "@/store/hooks";
import { useAnalyticsFilters } from "@/hooks/useAnalyticsFilters";
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
  ChevronLeft,
  Image as ImageIcon,
  ScanLine,
  MapPin,
  CalendarDays,
  Download,
  FileSpreadsheet,
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
import type { ImportedCrimeFormData } from "@/utils/importCrimeExcel";
import type { GlobalFiltersState } from "@/store/slices/globalFiltersSlice";
import { useGetCurrentUserQuery } from "@/services/authApi";
import { useGetEfirsQuery } from "@/services/efirApi"; // ⚠️ confirm this matches your actual FIR service
import { LocationPickerMap } from "@/components/common/LocationPickerMap";
import { parseImportedCrimeExcel } from "@/utils/importCrimeExcel";
// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TABLE_ID = "crimes";

// Browsers can't decode TIFF (or a handful of other raw/raster formats) in an
// <img> tag, so we fall back to a file-style chip instead of a broken image.
const UNRENDERABLE_IMAGE_EXTENSIONS = [".tif", ".tiff", ".heic", ".heif", ".raw", ".dng", ".bmp"];

function isBrowserRenderableImage(nameOrUrl?: string) {
  if (!nameOrUrl) return true;
  const clean = nameOrUrl.split("?")[0].toLowerCase();
  return !UNRENDERABLE_IMAGE_EXTENSIONS.some((ext) => clean.endsWith(ext));
}

function evidenceFileName(url?: string, fallback?: string) {
  if (fallback) return fallback;
  if (!url) return "evidence file";
  try {
    const clean = url.split("?")[0];
    return decodeURIComponent(clean.substring(clean.lastIndexOf("/") + 1)) || "evidence file";
  } catch {
    return "evidence file";
  }
}

// Just the filename portion of a path/URL, used to line up a match's gallery
// path (e.g. "face_default_001093.jpg") with the evidence record it came from
// (e.g. "face/crime_12_face_default_001093.jpg"), regardless of prefix.
function pathBaseName(path?: string) {
  if (!path) return undefined;
  const clean = path.split("?")[0];
  return clean.substring(clean.lastIndexOf("/") + 1).toLowerCase();
}

// A freshly-picked, not-yet-uploaded file lives in state as a data:/blob: URI
// and can be rendered directly. Anything else is treated as a Stratus object
// path and fetched through the authenticated /storage/blob route.
function isStoredObjectPath(path?: string) {
  if (!path) return false;
  return !path.startsWith("data:") && !path.startsWith("blob:");
}

/**
 * Renders a single evidence file, whether it's a local unsaved preview
 * (data:/blob: URI) or a persisted Stratus object path. Persisted paths are
 * fetched via the authenticated storage proxy rather than hitting the bucket
 * URL directly. Optionally shows a download button.
 */
function EvidenceVisual({
  path,
  fileName,
  className,
  showDownload,
}: {
  path?: string;
  fileName: string;
  className?: string;
  showDownload?: boolean;
}) {
  const isStored = isStoredObjectPath(path);
  const { data, isFetching, isError } = useGetEvidenceBlobQuery(path ?? "", {
    skip: !isStored || !path,
  });

  const resolvedUrl = !path ? undefined : isStored ? data?.url : path;
  const loading = isStored && isFetching;
  const failed = isStored && isError;
  const renderable = isBrowserRenderableImage(fileName);

  const handleDownload = () => {
    if (!resolvedUrl) return;
    const a = document.createElement("a");
    a.href = resolvedUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className={`relative flex items-center justify-center bg-muted/10 ${className ?? ""}`}>
      {!path && <ImageIcon className="h-6 w-6 text-muted-foreground opacity-40" />}

      {path && loading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}

      {path && !loading && failed && (
        <div className="flex flex-col items-center gap-1 text-muted-foreground">
          <ImageIcon className="h-6 w-6 opacity-40" />
          <span className="text-[9px]">Failed to load</span>
        </div>
      )}

      {path && !loading && !failed && resolvedUrl && renderable && (
        <img src={resolvedUrl} alt={fileName} className="h-full w-full object-contain" />
      )}

      {path && !loading && !failed && resolvedUrl && !renderable && (
        <a
          href={resolvedUrl}
          download={fileName}
          className="flex h-full w-full flex-col items-center justify-center gap-1 px-2 text-center hover:bg-muted/20"
        >
          <ImageIcon className="h-6 w-6 text-muted-foreground opacity-50" />
          <span className="max-w-full truncate text-[10px] font-medium text-foreground">
            {fileName}
          </span>
          <span className="text-[9px] text-muted-foreground">
            Preview unavailable — click to open
          </span>
        </a>
      )}

      {showDownload && resolvedUrl && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="absolute bottom-2 right-2 h-6 px-2 text-[10px] gap-1 bg-background/90"
          onClick={handleDownload}
        >
          <Download className="h-3 w-3" />
          Download
        </Button>
      )}
    </div>
  );
}

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
  const { districtId: contextDistrictId, stationId: contextStationId } =
    useAnalyticsFilters();
  const prevFiltersRef = React.useRef<GlobalFiltersState | null>(null);
  const prevLocationRef = React.useRef({
    districtId: contextDistrictId,
    stationId: contextStationId,
  });

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
  const [excelImportError, setExcelImportError] = React.useState<string | null>(
    null,
  );
  const [isImportingExcel, setIsImportingExcel] = React.useState(false);
  const [bulkImportedCrimes, setBulkImportedCrimes] = React.useState<
    ImportedCrimeFormData[]
  >([]);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(
    null,
  );
  const [selectedEvidenceId, setSelectedEvidenceId] = React.useState<string | null>(null);
  const [selectedEvidenceImage, setSelectedEvidenceImage] = React.useState(0);
  const [selectedRelatedCrimeId, setSelectedRelatedCrimeId] = React.useState<string | null>(null);
  type AfisMatch = {
    criminal_id?: string;
    name?: string;
    score: number;
    metadata?: { original_path?: string; filename?: string };
  };
  type EvidenceItem = {
    id: string;
    evidence_type: string;
    file?: File;
    file_url?: string;
    ROWID?: string;
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
    "https://crimelens-60074096850.development.catalystserverless.in/server/fingerprintafis/execute";
  const MODEL_URL =
    "https://models-50043087097.development.catalystappsail.in/identify";
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

  React.useEffect(() => {
    if (
      prevLocationRef.current.districtId !== contextDistrictId ||
      prevLocationRef.current.stationId !== contextStationId
    ) {
      resetPage();
      prevLocationRef.current = {
        districtId: contextDistrictId,
        stationId: contextStationId,
      };
    }
  }, [contextDistrictId, contextStationId, resetPage]);

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

  const locationScope = React.useMemo(
    () => ({
      districtId: contextDistrictId,
      stationId: contextStationId,
    }),
    [contextDistrictId, contextStationId],
  );

  const crimeQuery = React.useMemo(
    () =>
      buildCrimeQuery(
        { page, pageSize, sortBy, sortOrder },
        effectiveFilters,
        debouncedSearch,
        locationScope,
      ),
    [
      page,
      pageSize,
      sortBy,
      sortOrder,
      effectiveFilters,
      debouncedSearch,
      locationScope,
    ],
  );

  const {
    data: result,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetCrimesQuery(crimeQuery);
  const { data: currentUser } = useGetCurrentUserQuery();
  const isOfficer = Boolean(currentUser?.isOfficer);
  const canViewDistrictFilter =
    !isOfficer || hasPermission("view_district_filter");

  const { data: firs } = useGetEfirsQuery();
  // ---------------------------------------------------------------------------
  // Evidence Analysis
  // ---------------------------------------------------------------------------
  // Collect all paths from confirmed evidences to check for related crimes
  const matchedPathsToAnalyze = React.useMemo(() => {
    const paths = new Set<string>();
    form.evidences?.forEach((ev) => {
      if (ev.isConfirmed && ev.afisResult) {
        ev.afisResult.forEach((match) => {
          if (match.metadata?.original_path)
            paths.add(match.metadata.original_path);
          else if (match.name) paths.add(match.name);
          else if (match.criminal_id) paths.add(match.criminal_id);
        });
      }
    });
    return Array.from(paths);
  }, [form.evidences]);

  const { data: analysisData } = useGetCrimesByEvidencePathsQuery(
    matchedPathsToAnalyze,
    {
      skip: matchedPathsToAnalyze.length === 0,
    },
  );

  const filesWithRelatedCrimes = React.useMemo(() => {
    if (!analysisData?.success || !analysisData.data) return [];

    return (
      form.evidences
        ?.filter((ev) => {
          if (!ev.isConfirmed || !ev.afisResult) return false;
          const pathsForThisFile = ev.afisResult.map(
            (m) => m.metadata?.original_path || m.name || m.criminal_id,
          );

          const fileMatchesWithCrimes = analysisData.data.filter((d) =>
            pathsForThisFile.includes(d.path),
          );
          return fileMatchesWithCrimes.length > 0;
        })
        .map((ev) => ({
          evidenceId: ev.id,
          fileName: ev.file?.name || `${ev.evidence_type} uploaded`,
          matches: analysisData.data
            .filter((d) =>
              ev
                .afisResult!.map(
                  (m) => m.metadata?.original_path || m.name || m.criminal_id,
                )
                .includes(d.path),
            )
            .flatMap((d) => {
              const matchingAfis = ev.afisResult?.find(
                (m) => (m.metadata?.original_path || m.name || m.criminal_id) === d.path,
              );
              return d.crimes.map((crime) => ({
                ...crime,
                id: crime.ROWID,
                path: d.path,
                score: matchingAfis?.score ?? d.score ?? 0,
              }));
            }),
        })) || []
    );
  }, [analysisData, form.evidences]);

  const selectedRelatedCrime = React.useMemo(
    () => filesWithRelatedCrimes
      .flatMap((item) => item.matches)
      .find((match: any) => String(match.id) === selectedRelatedCrimeId),
    [filesWithRelatedCrimes, selectedRelatedCrimeId],
  );
  const { data: relatedCrime } = useGetCrimeByIdQuery(selectedRelatedCrimeId || "", {
    skip: !selectedRelatedCrimeId,
  });

  // The specific evidence file that actually matched — not just "the first
  // file on this crime record". Falls back to the first available file only
  // if the matched filename can't be lined up with anything on the record.
  const matchedRelatedEvidence = React.useMemo(() => {
    const evidences = relatedCrime?.evidences;
    if (!evidences || evidences.length === 0) return undefined;

    const targetName = pathBaseName(selectedRelatedCrime?.path);
    const exact = targetName
      ? evidences.find((e) => e.fileUrl && pathBaseName(e.fileUrl) === targetName)
      : undefined;

    return exact ?? evidences.find((e) => e.fileUrl);
  }, [relatedCrime, selectedRelatedCrime]);

  const uploadedEvidences = React.useMemo(
    () => (form.evidences || []).filter((e) => e.file_url),
    [form.evidences],
  );
  const selectedEvidence = uploadedEvidences.find((e) => e.id === selectedEvidenceId) || uploadedEvidences[0];
  const selectedEvidenceMatches = filesWithRelatedCrimes.find(
    (item) => item.evidenceId === selectedEvidence?.id,
  )?.matches || [];

  const [uploadEvidence] = useUploadCrimeEvidenceMutation();

  const handleEvidenceUploadForPersistedCrime = React.useCallback(async (ev: EvidenceItem) => {
    if (!ev.file || ev.ROWID) return;

    const matchedCrimeId =
      (form as any)?.id ||
      (typeof window !== "undefined"
        ? window.location.pathname.match(/\/entities\/crimes\/([^/]+)/)?.[1]
        : undefined);

    if (!matchedCrimeId) {
      console.warn("No persisted crime id available for evidence upload.");
      return;
    }

    try {
      const storagePath = await uploadEvidenceFileToStorage(ev.file, matchedCrimeId);
      const response = await uploadEvidence({
        crimeId: matchedCrimeId,
        body: {
          evidenceType: ev.evidence_type as any,
          description: `Uploaded from evidence repeater: ${ev.file.name}`,
          collectedBy: "Officer",
          collectedDate: new Date().toISOString(),
          collectionLocation: "",
          remarks: "Uploaded during confirmation",
          storagePath,
        },
        file: ev.file,
      }).unwrap();

      const persistedEvidence = (response as any)?.data ?? response;
      const persistedId = String(persistedEvidence?.ROWID ?? persistedEvidence?.id ?? "");
      if (persistedId) {
        setForm((f) => ({
          ...f,
          evidences: f.evidences?.map((item) =>
            item.id === ev.id ? { ...item, ROWID: persistedId, file_url: storagePath } : item,
          ),
        }));
      }
    } catch (error) {
      console.error("Evidence upload failed from repeater tick:", error);
    }
  }, [form, uploadEvidence]);

  React.useEffect(() => {
    if (!selectedEvidenceId || !uploadedEvidences.some((e) => e.id === selectedEvidenceId)) {
      setSelectedEvidenceId(uploadedEvidences[0]?.id || null);
      setSelectedEvidenceImage(0);
    }
  }, [selectedEvidenceId, uploadedEvidences]);

  // const handleOpenAnalysis = () => {
  //   localStorage.setItem(
  //     "currentEvidenceAnalysis",
  //     JSON.stringify(filesWithRelatedCrimes),
  //   );
  //   window.open("/entities/evidence-matches", "_blank");
  // };

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
        locationScope,
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
    locationScope,
    prefetchCrimes,
  ]);
  React.useEffect(() => {
    if (showCreate && !canViewDistrictFilter) {
      setForm((f) => ({
        ...f,
        district: contextDistrictId || f.district,
        assignedStationId: contextStationId || f.assignedStationId,
      }));
    }
  }, [showCreate, canViewDistrictFilter, contextDistrictId, contextStationId]);
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
  const formatDateTimeForBackend = (isoLocal: string): string => {
    // isoLocal is like "2026-07-24T08:25" (or "2026-07-24T08:25:00")
    if (!isoLocal) return "";
    const [datePart, timePart] = isoLocal.split("T");
    const time = timePart?.length === 5 ? `${timePart}:00` : timePart;
    return `${datePart} ${time}`;
  };
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    const recordsToCreate =
      bulkImportedCrimes.length > 0 && bulkImportedCrimes.length > 1
        ? bulkImportedCrimes
        : [
            {
              title: form.title,
              crimeCategory: form.crimeCategory,
              description: form.description,
              incidentDate: form.incidentDate,
              crimeLocation: form.crimeLocation,
              district: form.district,
              weaponUsed: form.weaponUsed,
              assignedStationId: form.assignedStationId,
              firId: form.firId,
              severity: form.severity,
            } as ImportedCrimeFormData,
          ];

    if (recordsToCreate.length === 0) return;
    const invalidRecord = recordsToCreate.find(
      (record) => !record.title?.trim() || !record.crimeCategory,
    );
    if (invalidRecord) return;

    try {
      const createdIds: string[] = [];

      for (const record of recordsToCreate) {
        const payload = {
          ...(record as unknown as CreateCrimePayload),
          title: record.title || "",
          crimeCategory: record.crimeCategory || "",
          description: record.description || "",
          district: record.district || "",
          assignedStationId: record.assignedStationId || "",
          weaponUsed: record.weaponUsed || "",
          firId: record.firId || "",
          severity: record.severity,
          createdBy: currentUser?.sysUserId,
          incidentDate: formatDateTimeForBackend(record.incidentDate || ""),
          incidentRegisteredDate: formatDateTimeForBackend(record.incidentDate || ""),
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
        if (newId) createdIds.push(newId);
      }

      setShowCreate(false);
      setBulkImportedCrimes([]);
      setForm({ crimeCategory: "", evidences: [] });

      if (createdIds.length > 0) {
        const firstId = createdIds[0];
        if (recordsToCreate.length === 1 && firstId) navigate(`/entities/crimes/${firstId}`);
      }
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

  const handleExcelImport = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImportingExcel(true);
      setExcelImportError(null);
      const imported = await parseImportedCrimeExcel(file, {
        categories: categories ?? [],
        districts: districts ?? [],
        stations: stations ?? [],
      });

      if (imported.length === 0) {
        setExcelImportError("No valid crime records were found in the selected file.");
        return;
      }

      setBulkImportedCrimes(imported);
      const firstRecord = imported[0];
      setForm((prev) => ({
        ...prev,
        ...firstRecord,
        evidences: prev.evidences ?? [],
      }));
      setShowCreate(true);
    } catch (error) {
      setExcelImportError(
        error instanceof Error
          ? error.message
          : "Unable to import the selected file.",
      );
      setBulkImportedCrimes([]);
    } finally {
      setIsImportingExcel(false);
      event.target.value = "";
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
            {hasPermission("update_crime") && (
              <>
                <label className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground shadow-sm hover:bg-muted/20">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                    onChange={handleExcelImport}
                  />
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  {isImportingExcel ? "Importing..." : "Import Excel"}
                </label>
                <Button
                  size="sm"
                  onClick={() => setShowCreate(true)}
                  className="h-8 px-3 text-xs gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  New Crime
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Floating Evidence Match Card */}

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
            <DialogContent className="w-[80vw] sm:max-w-none max-h-[92vh] h-[92vh] bg-card border-border p-0 flex flex-col overflow-hidden">
              <DialogHeader className="shrink-0 px-5 pt-5 pb-3 border-b border-border">
                <div className="flex items-center justify-between gap-3">
                  <DialogTitle className="text-sm font-semibold flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-primary" />
                    Log New Crime Incident
                  </DialogTitle>
                  {hasPermission("update_crime") && (
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-foreground hover:bg-muted/20">
                      <input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        className="hidden"
                        onChange={handleExcelImport}
                      />
                      <FileSpreadsheet className="h-3.5 w-3.5" />
                      Import Excel
                    </label>
                  )}
                </div>
              </DialogHeader>
              {excelImportError && (
                <div className="mx-5 mt-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-[11px] text-destructive">
                  {excelImportError}
                </div>
              )}
              <div className="grid flex-1 min-h-0 grid-cols-1 gap-0 lg:grid-cols-2">
              <form onSubmit={handleCreate} className="flex min-h-0 flex-col overflow-y-auto border-r border-border p-5 space-y-4">
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
                {canViewDistrictFilter && (
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
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase text-muted-foreground">
                      FIR ID
                    </label>
                    <select
                      value={form.firId || ""}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, firId: e.target.value }))
                      }
                      className="w-full h-8.5 px-3 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                    >
                      <option value="">Select FIR</option>
                      {(firs ?? []).map((f) => (
                        <option key={f.firId} value={f.firId}>
                          {f.firId}
                        </option>
                      ))}
                    </select>
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
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase text-muted-foreground">
                    Crime Location (Map)
                  </label>
                  <LocationPickerMap
                    latitude={form.location?.coordinates?.[0] ?? null}
                    longitude={form.location?.coordinates?.[1] ?? null}
                    onChange={(lat, lng) =>
                      setForm((f) => ({
                        ...f,
                        location: { ...f.location, coordinates: [lat, lng] },
                      }))
                    }
                  />
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

                            if (ev.file && ev.file_url) {
                              await handleEvidenceUploadForPersistedCrime(ev);
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
                              // after
                            } else if (
                              ev.evidence_type === "footprint" &&
                              ev.file
                            ) {
                              // ── Footprint: FormData → AppSail model (base MODEL_URL) ──────────
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
                                const resp = await fetch(`${MODEL_URL}/footprint`, {
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
                                          afisError:
                                            "footprint model API call failed",
                                          isConfirmed: true,
                                        }
                                      : item,
                                  ),
                                }));
                              }
                            } else if (ev.evidence_type === "face" && ev.file) {
                              // ── Face: FormData → AppSail model (MODEL_URL/face) ───────────────
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
                                const resp = await fetch(`${MODEL_URL}/face`, {
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
                                          afisError:
                                            "face model API call failed",
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
                                      {match.metadata?.filename ||
                                        match.name ||
                                        match.criminal_id}
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
                <DialogFooter className="gap-2 pt-2 sticky bottom-0 -mx-5 -mb-5 mt-auto bg-card px-5 py-3 border-t border-border">
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
                    {isCreating
                      ? "Creating..."
                      : bulkImportedCrimes.length > 1
                        ? `Create ${bulkImportedCrimes.length} Crimes`
                        : "Log Incident"}
                  </Button>
                </DialogFooter>
              </form>
              <aside className="flex min-h-0 flex-col overflow-y-auto bg-muted/10 p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Evidence intelligence</p>
                    <p className="text-xs text-foreground">Review uploaded evidence and related cases</p>
                  </div>
                  <ImageIcon className="h-4 w-4 text-primary" />
                </div>
                {uploadedEvidences.length === 0 ? (
                  <div className="flex min-h-[360px] flex-col items-center justify-center rounded-lg border border-dashed border-border text-center text-xs text-muted-foreground">
                    <ImageIcon className="mb-2 h-8 w-8 opacity-40" />
                    Upload an image to inspect it here.
                  </div>
                ) : (
                  <>
                    <div className="relative overflow-hidden rounded-lg border border-border">
                      <EvidenceVisual
                        path={selectedEvidence?.file_url}
                        fileName={evidenceFileName(selectedEvidence?.file_url, selectedEvidence?.file?.name)}
                        className="h-52 w-full"
                        showDownload
                      />
                      {selectedEvidence?.afisLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 text-primary backdrop-blur-[2px]">
                          <ScanLine className="h-8 w-8 animate-pulse" />
                          <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">Scanning evidence</span>
                          <div className="absolute inset-x-0 top-1/2 h-px animate-[scan_1.8s_ease-in-out_infinite] bg-primary shadow-[0_0_12px_2px_hsl(var(--primary))]" />
                        </div>
                      )}
                      {uploadedEvidences.length > 1 && (
                        <>
                          <button type="button" aria-label="Previous evidence" onClick={() => { const index = (selectedEvidenceImage - 1 + uploadedEvidences.length) % uploadedEvidences.length; setSelectedEvidenceImage(index); setSelectedEvidenceId(uploadedEvidences[index].id); setSelectedRelatedCrimeId(null); }} className="absolute left-2 top-1/2 rounded-full bg-background/80 p-1 text-foreground"><ChevronLeft className="h-4 w-4" /></button>
                          <button type="button" aria-label="Next evidence" onClick={() => { const index = (selectedEvidenceImage + 1) % uploadedEvidences.length; setSelectedEvidenceImage(index); setSelectedEvidenceId(uploadedEvidences[index].id); setSelectedRelatedCrimeId(null); }} className="absolute right-2 top-1/2 rounded-full bg-background/80 p-1 text-foreground"><ChevronRight className="h-4 w-4" /></button>
                        </>
                      )}
                    </div>
                    <div className="mt-2 flex gap-1.5 overflow-x-auto">
                      {uploadedEvidences.map((ev, index) => (
                        <button type="button" key={ev.id} onClick={() => { setSelectedEvidenceId(ev.id); setSelectedEvidenceImage(index); setSelectedRelatedCrimeId(null); }} className={`h-12 w-12 shrink-0 overflow-hidden rounded border bg-background ${ev.id === selectedEvidence?.id ? "border-primary ring-1 ring-primary" : "border-border"}`}>
                          <EvidenceVisual
                            path={ev.file_url}
                            fileName={evidenceFileName(ev.file_url, ev.file?.name)}
                            className="h-full w-full"
                          />
                        </button>
                      ))}
                    </div>
                    <div className="mt-5 space-y-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Matched crimes ({selectedEvidenceMatches.length})</p>
                      {selectedEvidenceMatches.length === 0 ? <p className="rounded border border-border p-3 text-xs text-muted-foreground">Confirm this evidence to load related crimes.</p> : selectedEvidenceMatches.map((match: any) => {
                        const matchId = String(match.id ?? match.ROWID ?? match.crimeNumber ?? match.path ?? "");
                        const matchScore = typeof match.score === "number" ? match.score : Number(match.score ?? match.confidence ?? 0);

                        return (
                          <button
                            type="button"
                            key={matchId}
                            onClick={() => setSelectedRelatedCrimeId(matchId)}
                            className={`w-full rounded border p-2.5 text-left text-xs ${selectedRelatedCrimeId === matchId ? "border-primary bg-primary/10" : "border-border bg-background"}`}
                          >
                            <div className="flex w-full items-center justify-between">
                              <span className="truncate font-medium text-foreground">{match.crimeNumber || match.title || match.path}</span>
                              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            </div>
                            <div className="mt-2">
                              <span className="rounded bg-primary/10 px-1.5 py-0.5 font-medium text-primary">
                                Score: {isNaN(matchScore) ? "0.0000" : matchScore.toFixed(4)}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {selectedRelatedCrimeId && relatedCrime && (
                      <div className="mt-4 rounded-lg border border-primary/30 bg-background p-3">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-semibold text-foreground">{relatedCrime.title}</p>
                          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                            Match score: {(() => {
                              const selectedMatch = selectedEvidenceMatches.find((item) => String(item.id ?? item.ROWID) === selectedRelatedCrimeId);
                              const scoreValue = Number(selectedMatch?.score ?? 0);
                              return isNaN(scoreValue) ? "0.0000" : scoreValue.toFixed(4);
                            })()}
                          </span>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-[10px] text-muted-foreground"><span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{relatedCrime.incidentDate ? new Date(relatedCrime.incidentDate).toLocaleDateString("en-IN") : "Date unavailable"}</span><span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{relatedCrime.crimeLocation || relatedCrime.location?.address || "Location unavailable"}</span></div>
                        {matchedRelatedEvidence && (
                          <div className="mt-3 overflow-hidden rounded border border-border">
                            <EvidenceVisual
                              path={matchedRelatedEvidence.fileUrl}
                              fileName={evidenceFileName(matchedRelatedEvidence.fileUrl, matchedRelatedEvidence.fileName)}
                              className="h-32 w-full"
                            />
                          </div>
                        )}
                        <Link to={`/entities/crimes/${selectedRelatedCrimeId}`} target="_blank" className="mt-3 inline-flex items-center text-[10px] font-semibold text-primary">Open crime record <ChevronRight className="ml-1 h-3 w-3" /></Link>
                      </div>
                    )}
                  </>
                )}
              </aside>
              </div>
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