"use server";

import { getUserDb } from "@/lib/db";
import { extractionSchema, type LineItem } from "@/lib/validators/extraction";

export type ExportFormat = "cyf" | "aclymate" | "persefoni";

type ExData = ReturnType<typeof extractionSchema.parse>;
type CsvRow = Record<string, string | number | null>;

// ─── Shared context extracted once per document ───────────────────────────────

function docContext(fileName: string, data: ExData) {
  return {
    fileName,
    customerName: data.customerName.value ?? "",
    facilityName: data.facilityName.value ?? "",
    serviceAddress: data.serviceAddress.value ?? "",
    accountNumber: data.accountNumber.value ?? "",
    permitNumber: data.permitNumber.value ?? "",
    issuingAuthority: data.issuingAuthority.value ?? "",
    issueDate: data.issueDate.value ?? "",
    dueDate: data.dueDate.value ?? "",
    billingPeriodStart: data.billingPeriodStart.value ?? "",
    billingPeriodEnd: data.billingPeriodEnd.value ?? "",
    billingDays: data.billingDays.value,
    totalCost: data.totalCost.value,
    currency: data.currency.value ?? "",
  };
}

type DocCtx = ReturnType<typeof docContext>;

// ─── Format column mappers (one row per line item) ────────────────────────────

function toCyfRows(ctx: DocCtx, lineItems: LineItem[]): CsvRow[] {
  return lineItems.map((item) => ({
    document_name: ctx.fileName,
    customer_name: ctx.customerName,
    facility_name: ctx.facilityName,
    service_address: ctx.serviceAddress,
    account_number: ctx.accountNumber,
    permit_number: ctx.permitNumber,
    utility_type: item.utilityType,
    consumption: item.consumption ?? "",
    consumption_unit: item.consumptionUnit ?? "",
    cost: item.cost ?? "",
    meter_number: item.meterNumber ?? "",
    billing_period_start: ctx.billingPeriodStart,
    billing_period_end: ctx.billingPeriodEnd,
    billing_days: ctx.billingDays ?? "",
    bill_total: ctx.totalCost ?? "",
    currency: ctx.currency,
    issuing_authority: ctx.issuingAuthority,
    issue_date: ctx.issueDate,
    due_date: ctx.dueDate,
  }));
}

function toAclymateRows(ctx: DocCtx, lineItems: LineItem[]): CsvRow[] {
  return lineItems.map((item) => ({
    "Document Name": ctx.fileName,
    "Entity Name": ctx.customerName || ctx.facilityName,
    Location: ctx.serviceAddress,
    "Activity Type": item.utilityType,
    Quantity: item.consumption ?? "",
    Unit: item.consumptionUnit ?? "",
    Cost: item.cost ?? "",
    "Start Date": ctx.billingPeriodStart || ctx.issueDate,
    "End Date": ctx.billingPeriodEnd || ctx.dueDate,
    Currency: ctx.currency,
    "Data Source": ctx.issuingAuthority,
    "Account Number": ctx.accountNumber,
    Notes: "",
  }));
}

function toPersefoniRows(ctx: DocCtx, lineItems: LineItem[]): CsvRow[] {
  return lineItems.map((item) => ({
    document_name: ctx.fileName,
    facility: ctx.facilityName || ctx.customerName,
    address: ctx.serviceAddress,
    scope: "",
    activity: item.utilityType,
    amount: item.consumption ?? "",
    unit: item.consumptionUnit ?? "",
    spend: item.cost ?? "",
    period_start: ctx.billingPeriodStart || ctx.issueDate,
    period_end: ctx.billingPeriodEnd || ctx.dueDate,
    currency: ctx.currency,
    data_source: ctx.issuingAuthority,
    permit_number: ctx.permitNumber,
    meter_number: item.meterNumber ?? "",
  }));
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

      const ctx = docContext(doc.fileName, parsed.data);
      const lineItems = parsed.data.lineItems.value;

      // If no line items, still produce one row with document-level data
      const items = lineItems.length > 0
        ? lineItems
        : [{ utilityType: "", consumption: null, consumptionUnit: null, cost: null, rate: null, meterNumber: null }];

      const docRows =
        format === "cyf"
          ? toCyfRows(ctx, items)
          : format === "aclymate"
            ? toAclymateRows(ctx, items)
            : toPersefoniRows(ctx, items);

      rows.push(...docRows);
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
