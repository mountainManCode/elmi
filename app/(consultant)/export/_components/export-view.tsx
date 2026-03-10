"use client";

import { useState, useTransition } from "react";
import {
  Badge,
  Box,
  Button,
  Checkbox,
  Group,
  ScrollArea,
  Stack,
  Table,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconDownload,
  IconFileSpreadsheet,
  IconCheck,
  IconLeaf,
} from "@tabler/icons-react";
import { generateCsv, type ExportFormat } from "../actions";
import type { ApprovedDocument } from "../page";

// ─── Format definitions ───────────────────────────────────────────────────────

const FORMATS: {
  id: ExportFormat;
  code: string;
  name: string;
  note: string;
}[] = [
  {
    id: "cyf",
    code: "CYF",
    name: "Carbon Your Footprint",
    note: "Facility + utility + billing fields",
  },
  {
    id: "aclymate",
    code: "ACL",
    name: "Aclymate",
    note: "Entity-level activity data",
  },
  {
    id: "persefoni",
    code: "PSF",
    name: "Persefoni",
    note: "Scope-tagged facility data",
  },
];

// ─── Confidence meter ─────────────────────────────────────────────────────────

function ConfidencePip({ confidence }: { confidence: number | null }) {
  if (confidence === null) return <Text size="xs" c="dimmed">—</Text>;
  const pct = Math.round(confidence * 100);
  const color = confidence >= 0.8 ? "teal" : confidence >= 0.5 ? "orange" : "red";
  return (
    <Group gap={4} align="center" wrap="nowrap">
      <Box
        style={{
          width: 32,
          height: 4,
          borderRadius: 2,
          background: "var(--mantine-color-gray-2)",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <Box
          style={{
            width: `${pct}%`,
            height: "100%",
            background: `var(--mantine-color-${color}-5)`,
            borderRadius: 2,
          }}
        />
      </Box>
      <Text size="xs" c="dimmed" style={{ fontVariantNumeric: "tabular-nums" }}>
        {pct}%
      </Text>
    </Group>
  );
}

// ─── Format card ──────────────────────────────────────────────────────────────

function FormatCard({
  format,
  selected,
  onSelect,
}: {
  format: (typeof FORMATS)[number];
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <UnstyledButton
      onClick={onSelect}
      style={{
        display: "block",
        width: "100%",
        padding: "14px 16px",
        borderRadius: 8,
        border: `1.5px solid ${selected ? "var(--mantine-color-teal-5)" : "var(--mantine-color-gray-2)"}`,
        background: selected ? "var(--mantine-color-teal-0)" : "white",
        transition: "all 120ms ease",
        cursor: "pointer",
      }}
    >
      <Group justify="space-between" wrap="nowrap" align="flex-start">
        <Box>
          <Group gap={8} align="center" mb={4}>
            <Text
              style={{
                fontFamily: "'Courier New', Courier, monospace",
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: "0.12em",
                color: selected
                  ? "var(--mantine-color-teal-7)"
                  : "var(--mantine-color-gray-7)",
              }}
            >
              {format.code}
            </Text>
            <Text
              size="sm"
              fw={500}
              c={selected ? "teal.7" : "dark"}
            >
              {format.name}
            </Text>
          </Group>
          <Text size="xs" c="dimmed">
            {format.note}
          </Text>
        </Box>
        {selected && (
          <Box
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: "var(--mantine-color-teal-5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <IconCheck size={10} color="white" strokeWidth={3} />
          </Box>
        )}
      </Group>
    </UnstyledButton>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ExportView({ documents }: { documents: ApprovedDocument[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [format, setFormat] = useState<ExportFormat>("cyf");
  const [isPending, startTransition] = useTransition();

  const allSelected = selected.size === documents.length && documents.length > 0;
  const someSelected = selected.size > 0 && !allSelected;

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(documents.map((d) => d.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExport = () => {
    startTransition(async () => {
      const result = await generateCsv(Array.from(selected), format);

      if (!result.success) {
        notifications.show({ title: "Export failed", message: result.error, color: "red" });
        return;
      }

      // Trigger browser download
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);

      notifications.show({
        title: "Export ready",
        message: `${result.filename} downloaded.`,
        color: "teal",
        icon: <IconCheck size={16} />,
      });
    });
  };

  return (
    <Box
      style={{ padding: "24px 16px", maxWidth: 1100, margin: "0 auto" }}
      p={{ sm: "32px 40px" }}
    >
      {/* Page header */}
      <Group align="flex-start" mb="xl" gap="sm">
        <Box
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background:
              "linear-gradient(135deg, var(--mantine-color-teal-5) 0%, var(--mantine-color-teal-7) 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <IconLeaf size={18} color="white" stroke={2} />
        </Box>
        <Box>
          <Text fw={600} size="lg" style={{ letterSpacing: "-0.3px", lineHeight: 1.2 }}>
            Export Manager
          </Text>
          <Text size="sm" c="dimmed" mt={2}>
            {documents.length} approved document{documents.length !== 1 ? "s" : ""} ready for
            export
          </Text>
        </Box>
      </Group>

      {documents.length === 0 ? (
        /* Empty state */
        <Box
          style={{
            padding: "80px 24px",
            textAlign: "center",
            border: "1.5px dashed var(--mantine-color-gray-3)",
            borderRadius: 12,
            background: "white",
          }}
        >
          <IconFileSpreadsheet size={40} color="var(--mantine-color-gray-4)" />
          <Text size="sm" c="dimmed" mt="sm">
            No approved documents yet.
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            Approve documents in the Verification Workspace to make them available for export.
          </Text>
        </Box>
      ) : (
        <Group align="flex-start" gap="lg" wrap="nowrap" style={{ alignItems: "stretch" }}>
          {/* ── Document manifest ── */}
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Box
              style={{
                background: "white",
                borderRadius: 10,
                border: "1px solid var(--mantine-color-gray-2)",
                overflow: "hidden",
              }}
            >
              {/* Manifest header */}
              <Box
                style={{
                  padding: "10px 16px",
                  borderBottom: "1px solid var(--mantine-color-gray-2)",
                  background: "var(--mantine-color-gray-0)",
                }}
              >
                <Group justify="space-between" align="center">
                  <Group gap="sm">
                    <Checkbox
                      checked={allSelected}
                      indeterminate={someSelected}
                      onChange={toggleAll}
                      size="xs"
                    />
                    <Text
                      size="xs"
                      style={{
                        fontWeight: 700,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "var(--mantine-color-gray-6)",
                        fontSize: 10,
                      }}
                    >
                      Document manifest
                    </Text>
                  </Group>
                  {selected.size > 0 && (
                    <Badge size="xs" color="teal" variant="light">
                      {selected.size} selected
                    </Badge>
                  )}
                </Group>
              </Box>

              <ScrollArea>
                <Table
                  highlightOnHover
                  styles={{
                    th: {
                      fontSize: 10,
                      color: "var(--mantine-color-gray-5)",
                      fontWeight: 700,
                      letterSpacing: "0.07em",
                      textTransform: "uppercase",
                      paddingTop: 8,
                      paddingBottom: 8,
                    },
                  }}
                >
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th style={{ width: 36 }} />
                      <Table.Th>Document</Table.Th>
                      <Table.Th>Project</Table.Th>
                      <Table.Th>Supplier</Table.Th>
                      <Table.Th>Quality</Table.Th>
                      <Table.Th>Approved</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {documents.map((doc) => {
                      const isSelected = selected.has(doc.id);
                      return (
                        <Table.Tr
                          key={doc.id}
                          onClick={() => toggleOne(doc.id)}
                          style={{
                            cursor: "pointer",
                            background: isSelected
                              ? "var(--mantine-color-teal-0)"
                              : undefined,
                          }}
                        >
                          <Table.Td>
                            <Checkbox
                              checked={isSelected}
                              onChange={() => toggleOne(doc.id)}
                              size="xs"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </Table.Td>
                          <Table.Td>
                            <Text
                              size="sm"
                              fw={500}
                              style={{
                                maxWidth: 240,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                fontFamily: "'Courier New', Courier, monospace",
                                fontSize: 12,
                              }}
                            >
                              {doc.fileName}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="xs" c="dimmed">
                              {doc.projectName}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text
                              size="xs"
                              c="dimmed"
                              style={{
                                maxWidth: 100,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {doc.supplierId}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <ConfidencePip confidence={doc.overallConfidence} />
                          </Table.Td>
                          <Table.Td>
                            <Text
                              size="xs"
                              c="dimmed"
                              style={{ fontVariantNumeric: "tabular-nums" }}
                            >
                              {doc.approvedAt.toLocaleDateString()}
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            </Box>
          </Box>

          {/* ── Config panel ── */}
          <Box
            style={{
              width: 260,
              flexShrink: 0,
              position: "sticky",
              top: 80,
              alignSelf: "flex-start",
            }}
            visibleFrom="sm"
          >
            <Box
              style={{
                background: "white",
                borderRadius: 10,
                border: "1px solid var(--mantine-color-gray-2)",
                overflow: "hidden",
              }}
            >
              {/* Panel header */}
              <Box
                style={{
                  padding: "10px 16px",
                  borderBottom: "1px solid var(--mantine-color-gray-2)",
                  background: "var(--mantine-color-gray-0)",
                }}
              >
                <Text
                  size="xs"
                  style={{
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--mantine-color-gray-6)",
                    fontSize: 10,
                  }}
                >
                  Export format
                </Text>
              </Box>

              <Stack gap="xs" p="sm">
                {FORMATS.map((f) => (
                  <FormatCard
                    key={f.id}
                    format={f}
                    selected={format === f.id}
                    onSelect={() => setFormat(f.id)}
                  />
                ))}
              </Stack>

              {/* Summary + download */}
              <Box
                style={{
                  padding: "12px 16px",
                  borderTop: "1px solid var(--mantine-color-gray-2)",
                  background: "var(--mantine-color-gray-0)",
                }}
              >
                <Text size="xs" c="dimmed" mb="sm">
                  {selected.size > 0
                    ? `${selected.size} document${selected.size !== 1 ? "s" : ""} selected`
                    : "Select documents to export"}
                </Text>
                <Button
                  fullWidth
                  color="teal"
                  leftSection={<IconDownload size={14} />}
                  disabled={selected.size === 0}
                  loading={isPending}
                  onClick={handleExport}
                  style={{ fontWeight: 600 }}
                >
                  Export CSV
                </Button>
              </Box>
            </Box>
          </Box>
        </Group>
      )}

      {/* Mobile export bar (replaces sticky sidebar on small screens) */}
      <Box
        hiddenFrom="sm"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "12px 16px",
          background: "white",
          borderTop: "1px solid var(--mantine-color-gray-2)",
          zIndex: 100,
        }}
      >
        <Group justify="space-between" align="center" gap="sm">
          <Stack gap={2}>
            <Text size="xs" c="dimmed">
              {selected.size > 0
                ? `${selected.size} doc${selected.size !== 1 ? "s" : ""} · ${FORMATS.find((f) => f.id === format)?.code}`
                : "No selection"}
            </Text>
          </Stack>
          <Button
            size="sm"
            color="teal"
            leftSection={<IconDownload size={14} />}
            disabled={selected.size === 0}
            loading={isPending}
            onClick={handleExport}
          >
            Export
          </Button>
        </Group>
      </Box>
    </Box>
  );
}
