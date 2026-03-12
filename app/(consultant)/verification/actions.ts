"use server";

import { getUserDb, db } from "@/lib/db";
import { inngest } from "@/inngest/client";
import { revalidatePath } from "next/cache";
import type { ExtractionData } from "@/lib/validators/extraction";

export async function approveDocument(documentId: string) {
  const db = await getUserDb();

  try {
    await db.document.update({
      where: { id: documentId },
      data: { status: "approved" },
    });
    revalidatePath("/dashboard");
    revalidatePath("/verification");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to approve document";
    return { success: false, error: message };
  }
}

export async function rejectDocument(documentId: string) {
  const userDb = await getUserDb();

  try {
    await userDb.document.update({
      where: { id: documentId },
      data: { status: "rejected" },
    });
    revalidatePath("/dashboard");
    revalidatePath("/verification");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to reject document";
    return { success: false, error: message };
  }
}

/**
 * Persist human-edited extraction data back to ExtractionResult.
 * Uses getUserDb() to verify access, then raw db to bypass write policies
 * (same pattern as retryExtraction — ExtractionResult denies all app writes).
 */
export async function updateExtractionData(
  documentId: string,
  data: ExtractionData
): Promise<{ success: true } | { success: false; error: string }> {
  const userDb = await getUserDb();

  const doc = await userDb.document.findFirst({ where: { id: documentId } });
  if (!doc) return { success: false, error: "Document not found or access denied" };

  try {
    await db.extractionResult.update({
      where: { documentId },
      data: { data: JSON.stringify(data) },
    });
    revalidatePath("/verification");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save edits";
    return { success: false, error: message };
  }
}

/**
 * Reset a stuck/failed document and re-fire the extraction pipeline.
 * Uses getUserDb() to verify access, then raw db to bypass ExtractionResult write policies.
 */
export async function retryExtraction(documentId: string) {
  const userDb = await getUserDb();

  // Verify the caller has access to this document
  const doc = await userDb.document.findFirst({ where: { id: documentId } });
  if (!doc) {
    return { success: false, error: "Document not found or access denied" };
  }

  try {
    // Delete any partial extraction result (raw db — policies deny app-code writes)
    await db.extractionResult.deleteMany({ where: { documentId } });

    // Reset status to pending
    await db.document.update({
      where: { id: documentId },
      data: { status: "pending" },
    });

    // Re-fire the Inngest pipeline
    await inngest.send({
      name: "elmi/document.uploaded",
      data: {
        documentId: doc.id,
        orgId: doc.organizationId,
        projectId: doc.projectId,
        gcsPath: doc.gcsPath,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/verification");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to retry extraction";
    return { success: false, error: message };
  }
}
