"use client";

import { useState } from "react";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Collapse,
  Group,
  ScrollArea,
  Stack,
  Table,
  Text,
  Tooltip,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconChevronDown,
  IconChevronRight,
  IconCopy,
  IconLink,
  IconPlus,
} from "@tabler/icons-react";
import { CreateSupplierLinkModal } from "./create-supplier-link-modal";

// ─── Types ────────────────────────────────────────────────────────────────────

type DocumentRow = {
  id: string;
  fileName: string;
  status: string;
  supplierId: string;
  projectId: string;
  createdAt: Date;
};

type SupplierLinkRow = {
  id: string;
  token: string;
  supplierId: string;
  projectId: string;
  expiresAt: Date;
  isActive: boolean;
  uploadCount: number;
  maxUploads: number;
  createdAt: Date;
};

type ProjectRow = {
  id: string;
  name: string;
  description: string | null;
  organizationId: string;
  createdAt: Date;
};

type Props = {
  project: ProjectRow;
  supplierLinks: SupplierLinkRow[];
  documents: DocumentRow[];
};

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "gray" },
  extracting: { label: "Extracting", color: "blue" },
  needs_review: { label: "Review", color: "orange" },
  approved: { label: "Approved", color: "teal" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: "gray" };
  return (
    <Badge size="xs" color={cfg.color} variant="light">
      {cfg.label}
    </Badge>
  );
}

// ─── Document status summary ──────────────────────────────────────────────────

function StatusSummary({ documents }: { documents: DocumentRow[] }) {
  if (documents.length === 0) {
    return (
      <Text size="xs" c="dimmed">
        No documents yet
      </Text>
    );
  }

  const counts = documents.reduce<Record<string, number>>((acc, doc) => {
    acc[doc.status] = (acc[doc.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <Group gap={6} wrap="wrap">
      {Object.entries(counts).map(([status, count]) => {
        const cfg = STATUS_CONFIG[status] ?? { label: status, color: "gray" };
        return (
          <Badge key={status} size="xs" color={cfg.color} variant="light">
            {count} {cfg.label}
          </Badge>
        );
      })}
    </Group>
  );
}

// ─── Supplier link row ────────────────────────────────────────────────────────

function SupplierLinkRow({
  link,
  documents,
}: {
  link: SupplierLinkRow;
  documents: DocumentRow[];
}) {
  const expired = new Date() > link.expiresAt;
  const inactive = !link.isActive || expired;
  const uploadUrl = `${window.location.origin}/${link.token}`;

  const copyLink = () => {
    navigator.clipboard.writeText(uploadUrl).then(() => {
      notifications.show({
        title: "Copied",
        message: "Upload link copied to clipboard",
        color: "teal",
      });
    });
  };

  return (
    <Table.Tr>
      <Table.Td>
        <Text size="sm" fw={500}>
          {link.supplierId}
        </Text>
      </Table.Td>
      <Table.Td>
        <Badge
          size="xs"
          color={inactive ? "gray" : "teal"}
          variant="light"
        >
          {inactive ? (expired ? "Expired" : "Inactive") : "Active"}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Text size="xs" c="dimmed">
          {link.uploadCount} / {link.maxUploads}
        </Text>
      </Table.Td>
      <Table.Td>
        <Group gap={4} wrap="wrap">
          {documents.map((doc) => (
            <StatusBadge key={doc.id} status={doc.status} />
          ))}
          {documents.length === 0 && (
            <Text size="xs" c="dimmed">
              —
            </Text>
          )}
        </Group>
      </Table.Td>
      <Table.Td>
        <Text size="xs" c="dimmed">
          {link.expiresAt.toLocaleDateString()}
        </Text>
      </Table.Td>
      <Table.Td>
        <Tooltip label="Copy upload link" withArrow>
          <ActionIcon
            size="sm"
            variant="subtle"
            color="gray"
            onClick={copyLink}
            disabled={inactive}
          >
            <IconCopy size={14} />
          </ActionIcon>
        </Tooltip>
      </Table.Td>
    </Table.Tr>
  );
}

// ─── Project Card ─────────────────────────────────────────────────────────────

export function ProjectCard({ project, supplierLinks, documents }: Props) {
  const [linksOpen, { toggle }] = useDisclosure(false);
  const [modalOpen, { open: openModal, close: closeModal }] = useDisclosure(false);

  const totalDocs = documents.length;
  const approvedDocs = documents.filter((d) => d.status === "approved").length;

  return (
    <>
      <Card withBorder radius="md" padding="lg" style={{ background: "white" }}>
        <Stack gap="md">
          {/* Header */}
          <Group justify="space-between" align="flex-start" wrap="nowrap">
            <Box style={{ flex: 1, minWidth: 0 }}>
              <Text
                fw={600}
                size="sm"
                style={{
                  letterSpacing: "-0.2px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {project.name}
              </Text>
              {project.description && (
                <Text size="xs" c="dimmed" mt={2} lineClamp={1}>
                  {project.description}
                </Text>
              )}
            </Box>
            <Button
              size="xs"
              variant="light"
              color="teal"
              leftSection={<IconPlus size={12} />}
              onClick={openModal}
              style={{ flexShrink: 0 }}
            >
              Add link
            </Button>
          </Group>

          {/* Stats row */}
          <Group gap="xl">
            <Box>
              <Text size="xs" c="dimmed" mb={2}>
                Suppliers
              </Text>
              <Text size="sm" fw={600}>
                {supplierLinks.length}
              </Text>
            </Box>
            <Box>
              <Text size="xs" c="dimmed" mb={2}>
                Documents
              </Text>
              <Text size="sm" fw={600}>
                {totalDocs}
              </Text>
            </Box>
            <Box>
              <Text size="xs" c="dimmed" mb={2}>
                Approved
              </Text>
              <Text size="sm" fw={600} c="teal">
                {approvedDocs}
              </Text>
            </Box>
          </Group>

          {/* Status summary */}
          <StatusSummary documents={documents} />

          {/* Expand toggle */}
          {supplierLinks.length > 0 && (
            <>
              <Button
                variant="subtle"
                color="gray"
                size="xs"
                onClick={toggle}
                leftSection={
                  linksOpen ? (
                    <IconChevronDown size={14} />
                  ) : (
                    <IconChevronRight size={14} />
                  )
                }
                style={{ alignSelf: "flex-start", paddingLeft: 0 }}
              >
                {linksOpen ? "Hide" : "Show"} supplier links
              </Button>

              <Collapse in={linksOpen}>
                <Box
                  style={{
                    borderRadius: 8,
                    border: "1px solid var(--mantine-color-gray-2)",
                    overflow: "hidden",
                  }}
                >
                  <ScrollArea>
                  <Table
                    striped
                    highlightOnHover
                    withColumnBorders={false}
                    styles={{ th: { fontSize: 11, color: "var(--mantine-color-gray-6)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" } }}
                  >
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Supplier</Table.Th>
                        <Table.Th>Status</Table.Th>
                        <Table.Th>Uploads</Table.Th>
                        <Table.Th>Documents</Table.Th>
                        <Table.Th>Expires</Table.Th>
                        <Table.Th>
                          <IconLink size={12} />
                        </Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {supplierLinks.map((link) => (
                        <SupplierLinkRow
                          key={link.id}
                          link={link}
                          documents={documents.filter(
                            (d) => d.supplierId === link.supplierId
                          )}
                        />
                      ))}
                    </Table.Tbody>
                  </Table>
                  </ScrollArea>
                </Box>
              </Collapse>
            </>
          )}

          {supplierLinks.length === 0 && (
            <Text size="xs" c="dimmed">
              No supplier links yet. Add one to start collecting documents.
            </Text>
          )}
        </Stack>
      </Card>

      <CreateSupplierLinkModal
        projectId={project.id}
        projectName={project.name}
        opened={modalOpen}
        onClose={closeModal}
      />
    </>
  );
}
