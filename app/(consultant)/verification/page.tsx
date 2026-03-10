// Verification Workspace — Server Component
// Split-screen: signed PDF URL on the left, extracted data fields on the right.

import { notFound } from "next/navigation";
import { Box, Text } from "@mantine/core";
import { getUserDb } from "@/lib/db";
import { getSignedReadUrl } from "@/lib/gcs";
import { extractionSchema } from "@/lib/validators/extraction";
import { VerificationView } from "./_components/verification-view";

type Props = {
  searchParams: Promise<{ documentId?: string }>;
};

export default async function VerificationPage({ searchParams }: Props) {
  const { documentId } = await searchParams;

  if (!documentId) {
    return (
      <Box style={{ padding: "80px 24px", textAlign: "center" }}>
        <Text c="dimmed" size="sm">
          Select a document from the dashboard to review.
        </Text>
      </Box>
    );
  }

  const db = await getUserDb();

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
