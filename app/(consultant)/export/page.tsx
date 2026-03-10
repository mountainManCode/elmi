// Export Manager — Server Component
// Lists all approved documents across the org. Client handles selection + CSV download.

import { Box, Text } from "@mantine/core";
import { getUserDb } from "@/lib/db";
import { extractionSchema, computeOverallConfidence } from "@/lib/validators/extraction";
import { ExportView } from "./_components/export-view";

export type ApprovedDocument = {
  id: string;
  fileName: string;
  projectId: string;
  projectName: string;
  supplierId: string;
  approvedAt: Date;
  overallConfidence: number | null;
};

export default async function ExportPage() {
  const db = await getUserDb();

  const org = await db.organization.findFirst();
  if (!org) {
    return (
      <Box style={{ padding: "80px 24px", textAlign: "center" }}>
        <Text c="dimmed" size="sm">
          No organization found.
        </Text>
      </Box>
    );
  }

  const [projects, documents, extractionResults] = await Promise.all([
    db.project.findMany({ where: { organizationId: org.id } }),
    db.document.findMany({
      where: { organizationId: org.id, status: "approved" },
      orderBy: { updatedAt: "desc" },
    }),
    db.extractionResult.findMany({
      where: {
        document: { organizationId: org.id },
      },
    }),
  ]);

  const projectMap = new Map(projects.map((p) => [p.id, p.name]));
  const resultMap = new Map(extractionResults.map((r) => [r.documentId, r]));

  const approvedDocuments: ApprovedDocument[] = documents.map((doc) => {
    let overallConfidence: number | null = null;

    const result = resultMap.get(doc.id);
    if (result) {
      try {
        const raw = JSON.parse(result.data);
        const parsed = extractionSchema.safeParse(raw);
        if (parsed.success) {
          overallConfidence = computeOverallConfidence(parsed.data);
        }
      } catch {
        // no confidence data
      }
    }

    return {
      id: doc.id,
      fileName: doc.fileName,
      projectId: doc.projectId,
      projectName: projectMap.get(doc.projectId) ?? "Unknown project",
      supplierId: doc.supplierId,
      approvedAt: doc.updatedAt,
      overallConfidence,
    };
  });

  return <ExportView documents={approvedDocuments} />;
}
