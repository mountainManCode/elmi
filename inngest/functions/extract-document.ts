import { generateText, Output } from "ai";
import { google } from "@ai-sdk/google";
import { inngest } from "../client";
import { db } from "@/lib/db";
import { downloadFile } from "@/lib/gcs";
import {
  extractionSchema,
  computeOverallConfidence,
} from "@/lib/validators/extraction";

/**
 * extract-document — Multi-step pipeline triggered when a document is uploaded.
 *
 * Pipeline steps:
 *   1. fetch-document   — Load document metadata from DB, set status to "extracting"
 *   2. download-pdf     — Download PDF bytes from GCS (returned as base64)
 *   3. extract-data     — Run AI extraction (Gemini 2.5 Flash via Vercel AI SDK)
 *   4. save-results     — Persist structured results to DB, set status to "needs_review"
 *   5. emit-completion  — Fire elmi/extraction.completed event
 *
 * Uses the raw `db` client (no policies) — Inngest runs without a user session.
 */
export const extractDocument = inngest.createFunction(
  {
    id: "extract-document",
    retries: 3,
  },
  { event: "elmi/document.uploaded" },
  async ({ event, step }) => {
    // Step 1: Fetch document metadata from DB and mark as extracting
    const document = await step.run("fetch-document", async () => {
      const doc = await db.document.findUnique({
        where: { id: event.data.documentId },
      });

      if (!doc) {
        throw new Error(`Document not found: ${event.data.documentId}`);
      }

      await db.document.update({
        where: { id: doc.id },
        data: { status: "extracting" },
      });

      return {
        id: doc.id,
        organizationId: doc.organizationId,
        projectId: doc.projectId,
        gcsPath: doc.gcsPath,
        fileName: doc.fileName,
      };
    });

    // Step 2: Download PDF from GCS (base64 for JSON serialization between steps)
    const pdfBase64 = await step.run("download-pdf", async () => {
      const buffer = await downloadFile(document.gcsPath);
      return buffer.toString("base64");
    });

    // Step 3: Extract structured data using AI
    const extraction = await step.run("extract-data", async () => {
      const modelId = process.env.EXTRACTION_MODEL ?? "gemini-2.5-flash";

      const result = await generateText({
        model: google(modelId),
        output: Output.object({ schema: extractionSchema }),
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Extract all relevant data from this environmental permit or utility document.

For each field, provide the extracted value and a confidence score between 0 and 1.
If a field is not found in the document, set its value to null with confidence 0.

IMPORTANT for utility bills:
- Extract EVERY utility service as a separate line item in the lineItems array.
  e.g. a combined electric + gas bill should produce TWO line items.
- For each line item: utilityType (e.g. "Electric", "Natural Gas", "Water"),
  consumption (total for the period, not daily average), consumptionUnit (e.g. "kWh", "therms"),
  cost (charges for that service), rate (tariff/schedule if shown), meterNumber (if shown).
- customerName is the account holder (not "applicant").
- serviceAddress is where the service is delivered; mailingAddress is for correspondence.
- dueDate is the payment due date (NOT expiration date).
- billingDays is the number of days in the billing cycle.
- totalCost is the total amount due across all services.
- previousBalance, paymentsReceived, and amountDue track the account balance.

For environmental permits: extract conditions, emissionsLimits, permitNumber, issueDate, etc.

Be thorough — extract every field you can find in the document.`,
              },
              {
                type: "file",
                data: Buffer.from(pdfBase64, "base64"),
                mediaType: "application/pdf",
                filename: document.fileName,
              },
            ],
          },
        ],
      });

      if (!result.output) {
        throw new Error("AI extraction returned no structured output");
      }

      return result.output;
    });

    // Step 4: Save extraction results to database
    await step.run("save-results", async () => {
      const confidence = computeOverallConfidence(extraction);
      const now = new Date();

      await db.extractionResult.create({
        data: {
          documentId: document.id,
          data: JSON.stringify(extraction),
          confidence: JSON.stringify({
            overall: confidence,
            fields: Object.fromEntries(
              Object.entries(extraction).map(([key, val]) => [
                key,
                val.confidence,
              ])
            ),
          }),
          modelId: process.env.EXTRACTION_MODEL ?? "gemini-2.5-flash",
          extractedAt: now,
        },
      });

      await db.document.update({
        where: { id: document.id },
        data: { status: "needs_review" },
      });
    });

    // Step 5: Emit completion event for downstream consumers
    await step.sendEvent("emit-completion", {
      name: "elmi/extraction.completed",
      data: {
        documentId: document.id,
        orgId: document.organizationId,
        projectId: document.projectId,
        success: true,
      },
    });

    return { documentId: document.id, extraction };
  }
);
