import { describe, expect, it } from "vitest";

import { parseImportedCrimeExcel } from "./importCrimeExcel";

describe("parseImportedCrimeExcel", () => {
  it("maps multiple spreadsheet rows into multiple crime payloads", async () => {
    const csv = [
      [
        "title",
        "crime_category",
        "date",
        "district",
        "station",
        "address",
        "description",
        "weapon",
        "fir_id",
        "severity",
      ],
      [
        "Burglary at Market Road",
        "Theft",
        "2025-05-12T10:30",
        "Bengaluru Urban",
        "Yelahanka Police Station",
        "Market Road",
        "Goods stolen from shop",
        "Knife",
        "FIR-2045",
        "high",
      ],
      [
        "Vehicle Theft",
        "Theft",
        "2025-05-14T09:00",
        "Bengaluru Urban",
        "Yelahanka Police Station",
        "Airport Road",
        "Scooter stolen",
        "Hammer",
        "FIR-2046",
        "medium",
      ],
    ]
      .map((row) => row.join(","))
      .join("\n");

    const file = new File([csv], "crime-import.csv", { type: "text/csv" });

    const result = await parseImportedCrimeExcel(file, {
      categories: [
        { id: "cat-1", ROWID: "cat-1", crime_category_name: "Theft" },
      ],
      districts: [{ id: "dist-1", name: "Bengaluru Urban" }],
      stations: [{ id: "stn-1", name: "Yelahanka Police Station" }],
    });

    expect(result).toHaveLength(2);
    expect(result[0].title).toBe("Burglary at Market Road");
    expect(result[0].crimeCategory).toBe("cat-1");
    expect(result[0].district).toBe("dist-1");
    expect(result[0].assignedStationId).toBe("stn-1");
    expect(result[0].weaponUsed).toBe("Knife");
    expect(result[0].firId).toBe("FIR-2045");
    expect(result[0].severity).toBe("high");
    expect(result[0].incidentDate).toContain("2025-05-12T10:30");

    expect(result[1].title).toBe("Vehicle Theft");
    expect(result[1].severity).toBe("medium");
    expect(result[1].weaponUsed).toBe("Hammer");
  });
});
