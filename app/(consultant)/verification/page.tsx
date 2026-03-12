// Verification Workspace — Server Component
// No documentId → shows document review queue.
// With documentId → shows split-screen PDF + extraction review.

import { notFound, redirect } from "next/navigation";
import { getUserDb } from "@/lib/db";
import { getSignedReadUrl } from "@/lib/gcs";
import { extractionSchema } from "@/lib/validators/extraction";
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

  const extractionResult = await db.extractionResult.findFirst({
    where: { documentId },
    orderBy: { createdAt: "desc" },
  });

  // Generate a short-lived signed URL for reading the PDF (15 min TTL)
  const pdfUrl = await getSignedReadUrl(document.gcsPath);

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

  return (
    <VerificationView
      documentId={document.id}
      fileName={document.fileName}
      status={document.status}
      pdfUrl={pdfUrl}
      extractionData={extractionData}
    />
  );
}
