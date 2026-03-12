// Verification Workspace — Server Component
// No documentId → shows document review queue.
// With documentId → shows split-screen PDF + extraction review.

import { notFound, redirect } from "next/navigation";
import { getUserDb } from "@/lib/db";
import { getSignedReadUrl } from "@/lib/gcs";
import { extractionSchema } from "@/lib/validators/extraction";
import { fieldComparisonSchema } from "@/lib/validators/validation";
import { z } from "zod";
import { VerificationView } from "./_components/verification-view";
import { DocumentQueue } from "./_components/document-queue";

type Props = {
  searchParams: Promise<{ documentId?: string }>;
};

export default async function VerificationPage({ searchParams }: Props) {
  const { documentId } = await searchParams;
  const db = await getUserDb();

  const org = await db.organization.findFirst();
  if (!org) redirect("/dashboard");

  // ── No documentId: show the review queue ──────────────────────────────────

  if (!documentId) {
    const [documents, projects] = await Promise.all([
      db.document.findMany({
        where: { organizationId: org.id },
        orderBy: { createdAt: "desc" },
      }),
      db.project.findMany({
        where: { organizationId: org.id },
      }),
    ]);

    const projectMap = Object.fromEntries(projects.map((p) => [p.id, p.name]));

    return <DocumentQueue documents={documents} projectMap={projectMap} />;
  }

  // ── documentId provided: show verification workspace ─────────────────────

  const document = await db.document.findFirst({
    where: { id: documentId },
  });

  if (!document) notFound();

  const [extractionResult, validationResult, pdfUrl] = await Promise.all([
    db.extractionResult.findFirst({
      where: { documentId },
      orderBy: { createdAt: "desc" },
    }),
    db.validationResult.findFirst({
      where: { documentId },
    }),
    getSignedReadUrl(document.gcsPath),
  ]);

  // Parse extraction data — may be null if pipeline hasn't completed yet
  let extractionData = null;
  if (extractionResult?.data) {
    try {
      const raw = JSON.parse(extractionResult.data);
      const parsed = extractionSchema.safeParse(raw);
      if (parsed.success) extractionData = parsed.data;
    } catch {
      // malformed JSON — treat as no extraction data
    }
  }

  // Parse per-field validation comparisons — null if validation hasn't run
  let validationFields = null;
  if (validationResult?.data) {
    try {
      const raw = JSON.parse(validationResult.data);
      const parsed = z.record(z.string(), fieldComparisonSchema).safeParse(raw);
      if (parsed.success) validationFields = parsed.data;
    } catch {
      // malformed JSON — skip validation flags
    }
  }

  return (
    <VerificationView
      documentId={document.id}
      fileName={document.fileName}
      status={document.status}
      pdfUrl={pdfUrl}
      extractionData={extractionData}
      validationFields={validationFields}
    />
  );
}
