// Consultant Dashboard — Server Component
// Shows supplier status table for the org's active projects.

import { Box, Grid, Group, Text, Title } from "@mantine/core";
import { getUserDb } from "@/lib/db";
import { CreateOrgPrompt } from "./_components/create-org-prompt";
import { ProjectCard } from "./_components/project-card";
import { CreateProjectButton } from "./_components/create-project-button";

export default async function DashboardPage() {
  const db = await getUserDb();

  // Org membership is enforced by ZenStack policies — returns null if user has none
  const org = await db.organization.findFirst();

  if (!org) {
    return <CreateOrgPrompt />;
  }

  // Flat parallel queries — no nested includes needed
  const [projects, supplierLinks, documents] = await Promise.all([
    db.project.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: "desc" },
    }),
    db.supplierLink.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: "desc" },
    }),
    db.document.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <Box style={{ padding: "24px 16px" }} p={{ sm: "32px 40px" }}>
      {/* Page header */}
      <Group justify="space-between" align="center" mb="xl">
        <Box>
          <Title
            order={2}
            style={{ fontWeight: 600, letterSpacing: "-0.4px", fontSize: 22 }}
          >
            {org.name}
          </Title>
          <Text size="sm" c="dimmed" mt={2}>
            {projects.length} project{projects.length !== 1 ? "s" : ""} ·{" "}
            {supplierLinks.length} supplier link
            {supplierLinks.length !== 1 ? "s" : ""}
          </Text>
        </Box>
        <CreateProjectButton orgId={org.id} />
      </Group>

      {/* Projects grid */}
      {projects.length === 0 ? (
        <Box style={{ textAlign: "center", padding: "80px 24px" }}>
          <Text size="sm" c="dimmed">
            No projects yet. Create your first project to get started.
          </Text>
        </Box>
      ) : (
        <Grid gutter="md">
          {projects.map((project) => (
            <Grid.Col key={project.id} span={{ base: 12, md: 6, xl: 4 }}>
              <ProjectCard
                project={project}
                supplierLinks={supplierLinks.filter(
                  (l) => l.projectId === project.id
                )}
                documents={documents.filter((d) => d.projectId === project.id)}
              />
            </Grid.Col>
          ))}
        </Grid>
      )}
    </Box>
  );
}
