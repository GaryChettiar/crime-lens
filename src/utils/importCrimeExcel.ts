export type CrimeImportOptions = {
  categories?: Array<{
    id?: string;
    ROWID?: string;
    name?: string;
    crime_category_name?: string;
  }>;
  districts?: Array<{ id?: string; name?: string }>;
  stations?: Array<{ id?: string; name?: string }>;
};

export type ImportedCrimeFormData = {
  title?: string;
  crimeCategory?: string;
  incidentDate?: string;
  crimeLocation?: string;
  description?: string;
  district?: string;
  assignedStationId?: string;
  weaponUsed?: string;
  firId?: string;
  severity?: "low" | "medium" | "high" | "critical";
};

const normalizeSheetRow = (row: Record<string, unknown>) => {
  const normalized: Record<string, unknown> = {};
  Object.entries(row).forEach(([key, value]) => {
    normalized[key.trim().toLowerCase()] = value;
  });
  return normalized;
};

const norm = (value: unknown) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const excelDateToIso = (value: unknown) => {
  const raw = norm(value);
  if (!raw) return "";

  if (/^\d+(\.\d+)?$/.test(raw)) {
    const numeric = Number(raw);
    if (!Number.isFinite(numeric)) return "";
    const date = new Date(Math.round((numeric - 25569) * 86400 * 1000));
    if (!Number.isNaN(date.getTime())) {
      const iso = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      return iso;
    }
  }

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  }

  return "";
};

const pickFirst = (...values: unknown[]) => {
  for (const value of values) {
    const normalized = norm(value);
    if (normalized) return normalized;
  }
  return "";
};

const matchesValue = (candidate: unknown, target: unknown) => {
  const left = norm(candidate).toLowerCase();
  const right = norm(target).toLowerCase();
  return left === right || left === right.replace(/\s+/g, " ");
};

export async function parseImportedCrimeExcel(
  file: File,
  options: CrimeImportOptions = {},
): Promise<ImportedCrimeFormData[]> {
  if (!file) {
    throw new Error("No file selected.");
  }

  const { categories = [], districts = [], stations = [] } = options;

  const payload = await file.arrayBuffer();
  const workbook = await import("xlsx").then((XLSX) =>
    XLSX.read(payload, { type: "array" }),
  );

  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!firstSheet) {
    throw new Error("The selected file does not contain any sheet.");
  }

  const rows = await import("xlsx").then((XLSX) =>
    XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, {
      defval: "",
      raw: false,
    }),
  );

  if (!rows.length) {
    throw new Error("The selected file is empty.");
  }

  const parsedRows = rows
    .map((row) => normalizeSheetRow((row ?? {}) as Record<string, unknown>))
    .filter((row) =>
      Object.values(row).some((value) => norm(value).length > 0),
    );

  if (!parsedRows.length) {
    throw new Error(
      "The selected file does not contain any valid crime records.",
    );
  }

  const mappedRows = parsedRows.map((row) => {
    const categoryValue = pickFirst(
      row.title,
      row.crimecategory,
      row.crime_category,
      row.category,
      row.crime_category_name,
      row.category_name,
      row.categorytype,
      row["crime category"],
    );

    const districtValue = pickFirst(
      row.district,
      row.district_name,
      row.location_district,
      row.zone,
      row["district name"],
    );

    const stationValue = pickFirst(
      row.station,
      row.police_station,
      row.police_station_name,
      row.assigned_station,
      row.station_name,
      row["police station"],
    );

    const categoryId =
      categories.find((category) => {
        const name =
          category.crime_category_name ??
          category.name ??
          category.ROWID ??
          category.id;
        return (
          matchesValue(categoryValue, name) ||
          matchesValue(categoryValue, category.id) ||
          matchesValue(categoryValue, category.ROWID)
        );
      })?.id ??
      categories.find((category) =>
        matchesValue(
          categoryValue,
          category.crime_category_name ??
            category.name ??
            category.ROWID ??
            category.id,
        ),
      )?.ROWID ??
      categories.find((category) => matchesValue(categoryValue, category.id))
        ?.id ??
      "";

    const districtId =
      districts.find(
        (district) =>
          matchesValue(districtValue, district.name) ||
          matchesValue(districtValue, district.id),
      )?.id ?? "";

    const stationId =
      stations.find(
        (station) =>
          matchesValue(stationValue, station.name) ||
          matchesValue(stationValue, station.id),
      )?.id ?? "";

    const title = pickFirst(
      row.title,
      row.incident_title,
      row.case_title,
      row.crime_title,
      row.name,
      row.incidentname,
      row["case title"],
    );

    const description = pickFirst(
      row.description,
      row.details,
      row.case_details,
      row.notes,
      row.summary,
      row["case details"],
    );

    const crimeLocation = pickFirst(
      row.crimelocation,
      row.location,
      row.address,
      row.crime_location,
      row.location_address,
      row.place,
      row["crime location"],
    );

    const weaponUsed = pickFirst(
      row.weaponused,
      row.weapon,
      row.weapon_used,
      row.weapon_used_name,
      row["weapon used"],
    );

    const firId = pickFirst(
      row.firid,
      row.fir_id,
      row.fir,
      row.fir_number,
      row["fir id"],
    );

    const severity = pickFirst(
      row.severity,
      row.crime_severity,
      row.level,
      row.priority,
      row["crime severity"],
    );

    const incidentDate = excelDateToIso(
      pickFirst(
        row.incidentdate,
        row.date,
        row.occurred_at,
        row.incident_date,
        row.date_time,
        row.occurredat,
        row["incident date"],
      ),
    );

    return {
      title: title || undefined,
      crimeCategory: categoryId || undefined,
      incidentDate: incidentDate || undefined,
      crimeLocation: crimeLocation || undefined,
      description: description || undefined,
      district: districtId || undefined,
      assignedStationId: stationId || undefined,
      weaponUsed: weaponUsed || undefined,
      firId: firId || undefined,
      severity: ["low", "medium", "high", "critical"].includes(
        norm(severity).toLowerCase(),
      )
        ? (norm(severity).toLowerCase() as ImportedCrimeFormData["severity"])
        : undefined,
    };
  });

  return mappedRows.filter(
    (row) => Boolean(row.title) || Boolean(row.crimeCategory),
  );
}
