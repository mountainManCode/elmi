import { generateText, Output } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { inngest } from "../client";
import { db } from "@/lib/db";
import { downloadFile } from "@/lib/gcs";
import { validationOutputSchema } from "@/lib/validators/validation";
import type { ExtractionData } from "@/lib/validators/extraction";

/**
 * validate-extraction — Cross-checks Gemini's extraction using Claude Sonnet.
 *
 * Triggered by elmi/extraction.completed. Only runs when VALIDATION_MODEL is set.
 *
 * Pipeline steps:
 *   1. fetch-data      — Load document + ExtractionResult, set status to "validating"
 *   2. download-pdf    — Download PDF bytes from GCS (base64)
 *   3. validate        — Claude Sonnet compares its own extraction against Gemini's
 *   4. save-validation — Persist ValidationResult, set status to "needs_review"
 *   5. emit-completion — Fire elmi/validation.completed event
 */
export const validateExtraction = inngest.createFunction(
  {
    id: "validate-extraction",
    retries: 2,
  },
  { event: "elmi/extraction.completed" },
  async ({ event, step }) => {
    const modelId = process.env.VALIDATION_MODEL;

    // Skip validation if no model is configured — zero behavior change for existing deploys.
    if (!modelId) {
      return { skipped: true, reason: "VALIDATION_MODEL not set" };
    }

    // Step 1: Load document + extraction result, set status to "validating"
    const { document, extractionData, extractionResultId } = await step.run(
      "fetch-data",
      async () => {
        const doc = await db.document.findUnique({
          where: { id: event.data.documentId },
          include: { extractionResult: true },
        });

        if (!doc) {
          throw new Error(`Document not found: ${event.data.documentId}`);
        }

        if (!doc.extractionResult) {
          throw new Error(
            `No extraction result for document: ${event.data.documentId}`
          );
        }

        await db.document.update({
          where: { id: doc.id },
          data: { status: "validating" },
        });

        return {
          document: {
            id: doc.id,
            organizationId: doc.organizationId,
            projectId: doc.projectId,
            gcsPath: doc.gcsPath,
            fileName: doc.fileName,
          },
          extractionData: JSON.parse(doc.extractionResult.data) as ExtractionData,
          extractionResultId: doc.extractionResult.id,
        };
      }
    );

    // Step 2: Download PDF from GCS (base64 for JSON serialization between steps)
    const pdfBase64 = await step.run("download-pdf", async () => {
      const buffer = await downloadFile(document.gcsPath);
      return buffer.toString("base64");
    });

    // Step 3: Validate with Claude Sonnet
    const validation = await step.run("validate", async () => {
      // Build a flat summary of Gemini's values for the prompt
      const geminiSummary = Object.entries(extractionData)
        .map(([key, field]) => {
          const val = field.value;
          if (val === null) return null;
          if (Array.isArray(val)) return `${key}: [${val.length} items]`;
          return `${key}: ${JSON.stringify(val)}`;
        })
        .filter(Boolean)
        .join("\n");

      const result = await generateText({
        model: anthropic(modelId),
        output: Output.object({ schema: validationOutputSchema }),
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `You are a document validation AI. Another AI (Gemini) has already extracted data from the attached document. Your job is to independently verify the extraction by reading the source document yourself.

Here is what Gemini extracted:
${geminiSummary}

For each key field listed above, check whether Gemini's value matches what you see in the document.
Return a JSON object with:
- "fields": an object keyed by field name. For each field include:
  - "agrees": true if Gemini's value matches the document, false if it disagrees or the value is missing/wrong
  - "geminiValue": the value Gemini provided (as a string, or null)
  - "claudeValue": the value YOU read from the document (as a string, or null if not found)
  - "note": (optional) brief explanation if you disagree
- "overallAgreement": a number from 0 to 1 representing the fraction of fields where you agree with Gemini
- "summary": a 1-2 sentence plain-language summary of the validation (e.g. "Most fields match. The total cost differs: Gemini says $120.50, document shows $112.50.")

Be precise and focus only on fields where you can verify the value from the document.`,
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
        throw new Error("Claude validation returned no structured output");
      }

      return result.output;
    });

    // Step 4: Save validation result and set document status to needs_review
    await step.run("save-validation", async () => {
      await db.validationResult.create({
        data: {
          documentId: document.id,
          extractionResultId,
          data: JSON.stringify(validation.fields),
          overallAgreement: validation.overallAgreement,
          modelId,
          validatedAt: new Date(),
        },
      });

      await db.document.update({
        where: { id: document.id },
        data: { status: "needs_review" },
      });
    });

    // Step 5: Emit completion event for downstream consumers
    await step.sendEvent("emit-completion", {
      name: "elmi/validation.completed",
      data: {
        documentId: document.id,
        orgId: document.organizationId,
        projectId: document.projectId,
        success: true,
        overallAgreement: validation.overallAgreement,
      },
    });

    return {
      documentId: document.id,
      overallAgreement: validation.overallAgreement,
      summary: validation.summary,
    };
  }
);
