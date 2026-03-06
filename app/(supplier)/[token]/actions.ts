"use server";

import { db } from "@/lib/db";
import { buildGcsPath, getSignedUploadUrl } from "@/lib/gcs";
import { inngest } from "@/inngest/client";
import { createId } from "@paralleldrive/cuid2";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TokenValidation =
  | { valid: true; supplierId: string; orgId: string; projectId: string; uploadCount: number; maxUploads: number }
  | { valid: false; reason: string };

type UploadUrlResult =
  | { success: true; uploadUrl: string; documentId: string; gcsPath: string }
  | { success: false; error: string };

type ConfirmResult =
  | { success: true }
  | { success: false; error: string };

// ---------------------------------------------------------------------------
// Shared token validation (not exported — internal helper)
// ---------------------------------------------------------------------------

async function checkToken(token: string): Promise<TokenValidation> {
  const link = await db.supplierLink.findFirst({
    where: { token, isActive: true },
  });

  if (!link) {
    return { valid: false, reason: "Invalid or deactivated link." };
  }

  if (new Date() > link.expiresAt) {
    return { valid: false, reason: "This upload link has expired." };
  }

  if (link.uploadCount >= link.maxUploads) {
    return { valid: false, reason: "Upload limit reached for this link." };
  }

  return {
    valid: true,
    supplierId: link.supplierId,
    orgId: link.organizationId,
    projectId: link.projectId,
    uploadCount: link.uploadCount,
    maxUploads: link.maxUploads,
  };
}

// ---------------------------------------------------------------------------
// Server Actions
// ---------------------------------------------------------------------------

/** Validate a supplier upload token. Called on page load. */
export async function validateToken(token: string): Promise<TokenValidation> {
  return checkToken(token);
}

/** Generate a signed GCS upload URL for direct browser-to-GCS PUT. */
export async function getUploadUrl(
  token: string,
  fileName: string,
): Promise<UploadUrlResult> {
  const validation = await checkToken(token);
  if (!validation.valid) {
    return { success: false, error: validation.reason };
  }

  const documentId = createId();
  const gcsPath = buildGcsPath({
    orgId: validation.orgId,
    projectId: validation.projectId,
    supplierId: validation.supplierId,
    documentId,
    filename: fileName,
  });

  const uploadUrl = await getSignedUploadUrl(gcsPath, "application/pdf");

  return { success: true, uploadUrl, documentId, gcsPath };
}

/** Confirm a completed upload: create Document record and fire Inngest event. */
export async function confirmUpload(
  token: string,
  documentId: string,
  gcsPath: string,
  fileName: string,
): Promise<ConfirmResult> {
  const validation = await checkToken(token);
  if (!validation.valid) {
    return { success: false, error: validation.reason };
  }

  // Create document record and increment upload count in a transaction-like flow.
  // Using raw db client since suppliers are unauthenticated.
  await db.document.create({
    data: {
      id: documentId,
      fileName,
      gcsPath,
      status: "pending",
      supplierId: validation.supplierId,
      projectId: validation.projectId,
      organizationId: validation.orgId,
    },
  });

  await db.supplierLink.updateMany({
    where: { token },
    data: { uploadCount: { increment: 1 } },
  });

  // Fire the Inngest event to kick off the extraction pipeline
  await inngest.send({
    name: "elmi/document.uploaded",
    data: {
      documentId,
      orgId: validation.orgId,
      projectId: validation.projectId,
      gcsPath,
    },
  });

  return { success: true };
}
