// Google Cloud Storage utilities
// File path convention: {orgId}/{projectId}/{supplierId}/{documentId}/{filename}
// Always use signed URLs — never proxy files through the app server.

import { Storage } from "@google-cloud/storage";

const storage = new Storage({ projectId: process.env.GOOGLE_CLOUD_PROJECT });
const bucket = storage.bucket(process.env.GCS_BUCKET_NAME!);

type GcsPath = {
  orgId: string;
  projectId: string;
  supplierId: string;
  documentId: string;
  filename: string;
};

export function buildGcsPath(p: GcsPath) {
  return `${p.orgId}/${p.projectId}/${p.supplierId}/${p.documentId}/${p.filename}`;
}

/** Generate a short-lived signed URL for read access (verification workspace). */
export async function getSignedReadUrl(gcsPath: string, ttlMinutes = 15) {
  const [url] = await bucket.file(gcsPath).getSignedUrl({
    action: "read",
    expires: Date.now() + ttlMinutes * 60 * 1000,
  });
  return url;
}

/** Generate a signed URL for direct browser-to-GCS upload (supplier dropzone). */
export async function getSignedUploadUrl(gcsPath: string, contentType: string, ttlMinutes = 10) {
  const [url] = await bucket.file(gcsPath).getSignedUrl({
    action: "write",
    expires: Date.now() + ttlMinutes * 60 * 1000,
    contentType,
  });
  return url;
}
