"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Badge,
  Box,
  Button,
  Group,
  Stack,
  Tabs,
  Text,
  TextInput,
} from "@mantine/core";
import {
  IconFileTypePdf,
  IconSearch,
  IconArrowRight,
  IconEye,
} from "@tabler/icons-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type DocumentRow = {
  id: string;
  fileName: string;
  status: string;
  supplierId: string;
  projectId: string;
  createdAt: Date;
};

type Props = {
  documents: DocumentRow[];
  projectMap: Record<string, string>;
};

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  needs_review: { label: "Needs Review", color: "orange", dot: "#f59e0b" },
  extracting:   { label: "Extracting",   color: "blue",   dot: "#3b82f6" },
  pending:      { label: "Pending",      color: "gray",   dot: "#9ca3af" },
  approved:     { label: "Approved",     color: "teal",   dot: "#10b981" },
  rejected:     { label: "Rejected",     color: "red",    dot: "#ef4444" },
};

// Priority order for sorting (most urgent first)
const STATUS_SORT_ORDER = ["needs_review", "extracting", "pending", "rejected", "approved"];

function sortByStatus(a: DocumentRow, b: DocumentRow) {
  const ai = STATUS_SORT_ORDER.indexOf(a.status);
  const bi = STATUS_SORT_ORDER.indexOf(b.status);
  if (ai !== bi) return ai - bi;
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

function formatRelativeDate(date: Date): string {
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

// ─── Status dot ───────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { dot: "#9ca3af" };
  const isPulse = status === "needs_review" || status === "extracting";
  return (
    <Box
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: cfg.dot,
        flexShrink: 0,
        boxShadow: isPulse ? `0 0 0 2px ${cfg.dot}33` : undefined,
      }}
    />
  );
}

// ─── Document row ─────────────────────────────────────────────────────────────

function DocumentRow({ doc, projectMap }: { doc: DocumentRow; projectMap: Record<string, string> }) {
  const cfg = STATUS_CONFIG[doc.status] ?? { label: doc.status, color: "gray", dot: "#9ca3af" };
  const projectName = projectMap[doc.projectId] ?? "Unknown project";
  const isActionable = doc.status === "needs_review";

  return (
    <Box
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "12px 20px",
        borderBottom: "1px solid var(--mantine-color-gray-1)",
        background: "white",
        transition: "background 120ms ease",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "var(--mantine-color-gray-0)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "white";
      }}
    >
      {/* Status dot */}
      <StatusDot status={doc.status} />

      {/* File icon + name */}
      <Group gap={10} style={{ flex: 1, minWidth: 0 }}>
        <IconFileTypePdf size={16} color="var(--mantine-color-gray-4)" style={{ flexShrink: 0 }} />
        <Box style={{ minWidth: 0 }}>
          <Text
            size="sm"
            fw={500}
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: 13,
              letterSpacing: "-0.2px",
            }}
          >
            {doc.fileName}
          </Text>
          <Text size="xs" c="dimmed" mt={1}>
            {projectName}
            {doc.supplierId && (
              <> · <span style={{ color: "var(--mantine-color-gray-5)" }}>{doc.supplierId}</span></>
            )}
          </Text>
        </Box>
      </Group>

      {/* Status badge */}
      <Badge size="xs" color={cfg.color} variant="light" style={{ flexShrink: 0 }}>
        {cfg.label}
      </Badge>

      {/* Date */}
      <Text size="xs" c="dimmed" style={{ flexShrink: 0, minWidth: 60, textAlign: "right" }}>
        {formatRelativeDate(doc.createdAt)}
      </Text>

      {/* Action */}
      <Button
        component={Link}
        href={`/verification?documentId=${doc.id}`}
        size="xs"
        variant={isActionable ? "filled" : "subtle"}
        color={isActionable ? "orange" : "gray"}
        rightSection={isActionable ? <IconArrowRight size={12} /> : <IconEye size={12} />}
        style={{ flexShrink: 0, minWidth: 80 }}
      >
        {isActionable ? "Review" : "View"}
      </Button>
    </Box>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DocumentQueue({ documents, projectMap }: Props) {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [search, setSearch] = useState("");

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: documents.length };
    for (const doc of documents) {
      c[doc.status] = (c[doc.status] ?? 0) + 1;
    }
    return c;
  }, [documents]);

  const filtered = useMemo(() => {
    let list = [...documents];

    if (activeTab !== "all") {
      list = list.filter((d) => d.status === activeTab);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (d) =>
          d.fileName.toLowerCase().includes(q) ||
          d.supplierId.toLowerCase().includes(q) ||
          (projectMap[d.projectId] ?? "").toLowerCase().includes(q)
      );
    }

    return list.sort(sortByStatus);
  }, [documents, activeTab, search, projectMap]);

  const needsReviewCount = counts["needs_review"] ?? 0;
  const totalDone = (counts["approved"] ?? 0) + (counts["rejected"] ?? 0);
  const progressPct = documents.length > 0 ? Math.round((totalDone / documents.length) * 100) : 0;

  const TAB_ITEMS = [
    { value: "all",          label: "All" },
    { value: "needs_review", label: "Needs Review" },
    { value: "extracting",   label: "Processing" },
    { value: "approved",     label: "Approved" },
    { value: "rejected",     label: "Rejected" },
  ];

  return (
    <Box style={{ padding: "32px 40px 40px" }}>
      {/* Page header */}
      <Group justify="space-between" align="flex-start" mb="xl" wrap="nowrap">
        <Box>
          <Text
            style={{
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: "-0.4px",
              lineHeight: 1.2,
            }}
          >
            Review Queue
          </Text>
          <Text size="sm" c="dimmed" mt={4}>
            {documents.length} document{documents.length !== 1 ? "s" : ""}
            {needsReviewCount > 0 && (
              <> · <span style={{ color: "#f59e0b", fontWeight: 500 }}>{needsReviewCount} need{needsReviewCount !== 1 ? "" : "s"} review</span></>
            )}
            {needsReviewCount === 0 && documents.length > 0 && " · all reviewed"}
          </Text>
        </Box>

        {/* Progress bar */}
        {documents.length > 0 && (
          <Box style={{ minWidth: 180 }}>
            <Group justify="space-between" mb={4}>
              <Text size="xs" c="dimmed">Progress</Text>
              <Text size="xs" fw={500}>{progressPct}%</Text>
            </Group>
            <Box
              style={{
                height: 4,
                borderRadius: 2,
                background: "var(--mantine-color-gray-1)",
                overflow: "hidden",
              }}
            >
              <Box
                style={{
                  height: "100%",
                  width: `${progressPct}%`,
                  borderRadius: 2,
                  background: progressPct === 100 ? "#10b981" : "#3b82f6",
                  transition: "width 400ms ease",
                }}
              />
            </Box>
            <Text size="xs" c="dimmed" mt={4}>{totalDone} of {documents.length} reviewed</Text>
          </Box>
        )}
      </Group>

      {/* Tabs + search */}
      <Box
        style={{
          background: "white",
          borderRadius: 10,
          border: "1px solid var(--mantine-color-gray-2)",
          overflow: "hidden",
        }}
      >
        {/* Toolbar */}
        <Box
          style={{
            padding: "0 20px",
            borderBottom: "1px solid var(--mantine-color-gray-2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(v) => setActiveTab(v ?? "all")}
            variant="unstyled"
            style={{ flex: 1 }}
          >
            <Tabs.List style={{ gap: 0, borderBottom: "none" }}>
              {TAB_ITEMS.map(({ value, label }) => {
                const count = counts[value] ?? 0;
                if (value !== "all" && count === 0) return null;
                return (
                  <Tabs.Tab
                    key={value}
                    value={value}
                    style={{
                      padding: "12px 14px",
                      fontSize: 13,
                      fontWeight: activeTab === value ? 500 : 400,
                      color: activeTab === value ? "var(--mantine-color-dark-7)" : "var(--mantine-color-gray-6)",
                      borderBottom: activeTab === value ? "2px solid var(--mantine-color-dark-7)" : "2px solid transparent",
                      borderRadius: 0,
                      background: "none",
                      transition: "color 120ms ease, border-color 120ms ease",
                    }}
                  >
                    {label}
                    {value !== "all" && (
                      <Text
                        component="span"
                        size="xs"
                        style={{
                          marginLeft: 6,
                          padding: "1px 6px",
                          borderRadius: 10,
                          background: activeTab === value ? "var(--mantine-color-dark-1)" : "var(--mantine-color-gray-1)",
                          color: activeTab === value ? "var(--mantine-color-dark-7)" : "var(--mantine-color-gray-6)",
                          fontWeight: 500,
                        }}
                      >
                        {count}
                      </Text>
                    )}
                  </Tabs.Tab>
                );
              })}
            </Tabs.List>
          </Tabs>

          <TextInput
            placeholder="Search documents…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftSection={<IconSearch size={14} />}
            size="xs"
            style={{ width: 220 }}
            styles={{ input: { background: "var(--mantine-color-gray-0)", border: "1px solid var(--mantine-color-gray-2)" } }}
          />
        </Box>

        {/* Document list */}
        {filtered.length === 0 ? (
          <Stack align="center" gap="xs" style={{ padding: "60px 24px" }}>
            <Text size="sm" c="dimmed">
              {documents.length === 0
                ? "No documents yet. Documents will appear here once suppliers upload files."
                : "No documents match your filter."}
            </Text>
          </Stack>
        ) : (
          <Box>
            {filtered.map((doc) => (
              <DocumentRow key={doc.id} doc={doc} projectMap={projectMap} />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
