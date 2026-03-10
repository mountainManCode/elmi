"use server";

import { getUserDb } from "@/lib/db";
import { extractionSchema } from "@/lib/validators/extraction";

export type ExportFormat = "cyf" | "aclymate" | "persefoni";

type CsvRow = Record<string, string | number | null>;

// ─── Format column mappers ────────────────────────────────────────────────────

function toCyfRow(
  fileName: string,
  data: ReturnType<typeof extractionSchema.parse>
): CsvRow {
  return {
    document_name: fileName,
    facility_name: data.facilityName.value ?? "",
    facility_address: data.facilityAddress.value ?? "",
    permit_number: data.permitNumber.value ?? "",
    account_number: data.accountNumber.value ?? "",
    utility_type: data.utilityType.value ?? "",
    consumption: data.consumption.value ?? "",
    consumption_unit: data.consumptionUnit.value ?? "",
    billing_period_start: data.billingPeriodStart.value ?? "",
    billing_period_end: data.billingPeriodEnd.value ?? "",
    total_cost: data.totalCost.value ?? "",
    currency: data.currency.value ?? "",
    issuing_authority: data.issuingAuthority.value ?? "",
    issue_date: data.issueDate.value ?? "",
    expiration_date: data.expirationDate.value ?? "",
    extraction_confidence: data.pageCount.confidence,
  };
}

function toAclymateRow(
  fileName: string,
  data: ReturnType<typeof extractionSchema.parse>
): CsvRow {
  return {
    "Document Name": fileName,
    "Entity Name": data.facilityName.value ?? "",
    Location: data.facilityAddress.value ?? "",
    "Activity Type": data.utilityType.value ?? "",
    Quantity: data.consumption.value ?? "",
    Unit: data.consumptionUnit.value ?? "",
    "Start Date": data.billingPeriodStart.value ?? data.issueDate.value ?? "",
    "End Date": data.billingPeriodEnd.value ?? data.expirationDate.value ?? "",
    Cost: data.totalCost.value ?? "",
    Currency: data.currency.value ?? "",
    "Data Source": data.issuingAuthority.value ?? "",
    Notes: data.extractionNotes.value ?? "",
  };
}

function toPersefoniRow(
  fileName: string,
  data: ReturnType<typeof extractionSchema.parse>
): CsvRow {
  return {
    document_name: fileName,
    facility: data.facilityName.value ?? "",
    address: data.facilityAddress.value ?? "",
    scope: "",
    activity: data.utilityType.value ?? "",
    amount: data.consumption.value ?? "",
    unit: data.consumptionUnit.value ?? "",
    period_start: data.billingPeriodStart.value ?? data.issueDate.value ?? "",
    period_end: data.billingPeriodEnd.value ?? data.expirationDate.value ?? "",
    spend: data.totalCost.value ?? "",
    currency: data.currency.value ?? "",
    data_source: data.issuingAuthority.value ?? "",
    permit_number: data.permitNumber.value ?? "",
  };
}

// ─── CSV serializer ───────────────────────────────────────────────────────────

function toCsv(rows: CsvRow[]): string {
  if (rows.length === 0) return "";

  const headers = Object.keys(rows[0]);
  const escape = (v: string | number | null) => {
    const s = v === null || v === undefined ? "" : String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => escape(row[h] ?? null)).join(",")),
  ];
  return lines.join("\n");
}

// ─── Main export action ───────────────────────────────────────────────────────

export async function generateCsv(
  documentIds: string[],
  format: ExportFormat
): Promise<{ success: true; csv: string; filename: string } | { success: false; error: string }> {
  if (documentIds.length === 0) {
    return { success: false, error: "No documents selected" };
  }

  const db = await getUserDb();

  // Load all selected documents + their extraction results
  const documents = await db.document.findMany({
    where: { id: { in: documentIds }, status: "approved" },
  });

  if (documents.length === 0) {
    return { success: false, error: "No approved documents found" };
  }

  const extractionResults = await db.extractionResult.findMany({
    where: { documentId: { in: documents.map((d) => d.id) } },
  });

  const resultMap = new Map(extractionResults.map((r) => [r.documentId, r]));

  const rows: CsvRow[] = [];

  for (const doc of documents) {
    const result = resultMap.get(doc.id);
    if (!result) continue;

    try {
      const raw = JSON.parse(result.data);
      const parsed = extractionSchema.safeParse(raw);
      if (!parsed.success) continue;

      const row =
        format === "cyf"
          ? toCyfRow(doc.fileName, parsed.data)
          : format === "aclymate"
            ? toAclymateRow(doc.fileName, parsed.data)
            : toPersefoniRow(doc.fileName, parsed.data);

      rows.push(row);
    } catch {
      continue;
    }
  }

  if (rows.length === 0) {
    return { success: false, error: "No extraction data available for selected documents" };
  }

  const date = new Date().toISOString().slice(0, 10);
  const filename = `elmi-export-${format}-${date}.csv`;

  return { success: true, csv: toCsv(rows), filename };
}
