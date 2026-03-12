"use client";

import { useState, useTransition } from "react";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Divider,
  Group,
  ScrollArea,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconCheck,
  IconX,
  IconEye,
  IconEyeOff,
  IconFileTypePdf,
  IconLoader,
  IconRefresh,
} from "@tabler/icons-react";
import { approveDocument, rejectDocument, retryExtraction } from "../actions";
import type { ExtractionData, LineItem } from "@/lib/validators/extraction";

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  documentId: string;
  fileName: string;
  status: string;
  pdfUrl: string;
  extractionData: ExtractionData | null;
};

// ─── Confidence badge ─────────────────────────────────────────────────────────

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const color = confidence >= 0.8 ? "teal" : confidence >= 0.5 ? "orange" : "red";
  return (
    <Badge size="xs" color={color} variant="light">
      {pct}%
    </Badge>
  );
}

// ─── Field row ────────────────────────────────────────────────────────────────

function formatFieldValue(
  value: string | number | string[] | null,
  format?: "currency" | "integer"
): string {
  if (value === null || value === "") return "—";
  if (Array.isArray(value)) return value.length === 0 ? "—" : value.join(", ");
  if (typeof value === "number") {
    if (format === "currency") return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
    if (format === "integer") return value.toLocaleString();
    return value.toLocaleString();
  }
  return String(value);
}

function FieldRow({
  label,
  value,
  confidence,
  format,
}: {
  label: string;
  value: string | number | string[] | null;
  confidence: number;
  format?: "currency" | "integer";
}) {
  const isEmpty = value === null || value === "" || (Array.isArray(value) && value.length === 0);
  const displayValue = isEmpty ? "—" : formatFieldValue(value, format);

  return (
    <Box py={8} style={{ borderBottom: "1px solid var(--mantine-color-gray-1)" }}>
      <Group justify="space-between" align="flex-start" wrap="nowrap" gap="xs">
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Text size="xs" c="dimmed" mb={2} style={{ textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, fontSize: 10 }}>
            {label}
          </Text>
          <Text size="sm" c={isEmpty ? "dimmed" : undefined} style={{ wordBreak: "break-word" }}>
            {displayValue}
          </Text>
        </Box>
        {!isEmpty && <ConfidenceBadge confidence={confidence} />}
      </Group>
    </Box>
  );
}

// ─── Field group ──────────────────────────────────────────────────────────────

function FieldGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box>
      <Text
        size="xs"
        style={{
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--mantine-color-gray-6)",
          fontSize: 10,
          marginBottom: 4,
        }}
      >
        {title}
      </Text>
      {children}
    </Box>
  );
}

// ─── Line item card ───────────────────────────────────────────────────────────

function LineItemCard({ item }: { item: LineItem }) {
  const consumptionStr =
    item.consumption !== null
      ? `${item.consumption}${item.consumptionUnit ? ` ${item.consumptionUnit}` : ""}`
      : null;

  const costStr = item.cost !== null
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(item.cost)
    : null;

  return (
    <Box
      style={{
        padding: "10px 12px",
        borderRadius: 6,
        border: "1px solid var(--mantine-color-gray-2)",
        background: "var(--mantine-color-gray-0)",
      }}
    >
      <Group justify="space-between" align="center" mb={6}>
        <Badge size="xs" color="blue" variant="light">
          {item.utilityType}
        </Badge>
        {costStr && (
          <Text size="sm" fw={600}>
            {costStr}
          </Text>
        )}
      </Group>
      <Group gap="xl">
        {consumptionStr && (
          <Box>
            <Text size="xs" c="dimmed" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
              Consumption
            </Text>
            <Text size="sm">{consumptionStr}</Text>
          </Box>
        )}
        {item.rate && (
          <Box>
            <Text size="xs" c="dimmed" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
              Rate
            </Text>
            <Text size="sm">{item.rate}</Text>
          </Box>
        )}
        {item.meterNumber && (
          <Box>
            <Text size="xs" c="dimmed" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
              Meter
            </Text>
            <Text size="sm" style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: 12 }}>
              {item.meterNumber}
            </Text>
          </Box>
        )}
      </Group>
    </Box>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function VerificationView({ documentId, fileName, status, pdfUrl, extractionData }: Props) {
  const [showPdf, setShowPdf] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [currentStatus, setCurrentStatus] = useState(status);

  const isApproved = currentStatus === "approved";
  const isRejected = currentStatus === "rejected";
  const isProcessing = currentStatus === "pending" || currentStatus === "extracting";

  const handleApprove = () => {
    startTransition(async () => {
      const result = await approveDocument(documentId);
      if (result.success) {
        setCurrentStatus("approved");
        notifications.show({ title: "Approved", message: `${fileName} approved.`, color: "teal", icon: <IconCheck size={16} /> });
      } else {
        notifications.show({ title: "Error", message: result.error, color: "red" });
      }
    });
  };

  const handleReject = () => {
    startTransition(async () => {
      const result = await rejectDocument(documentId);
      if (result.success) {
        setCurrentStatus("rejected");
        notifications.show({ title: "Rejected", message: `${fileName} marked as rejected.`, color: "orange" });
      } else {
        notifications.show({ title: "Error", message: result.error, color: "red" });
      }
    });
  };

  const handleRetry = () => {
    startTransition(async () => {
      const result = await retryExtraction(documentId);
      if (result.success) {
        setCurrentStatus("pending");
        notifications.show({
          title: "Extraction queued",
          message: "Pipeline restarted. Refresh in a moment to see results.",
          color: "blue",
          icon: <IconRefresh size={16} />,
        });
      } else {
        notifications.show({ title: "Error", message: result.error, color: "red" });
      }
    });
  };

  return (
    <Box style={{ height: "calc(100dvh - var(--app-shell-header-height, 0px))", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header bar */}
      <Box
        style={{
          padding: "12px 20px",
          borderBottom: "1px solid var(--mantine-color-gray-2)",
          background: "white",
          flexShrink: 0,
        }}
      >
        <Group justify="space-between" wrap="nowrap" gap="md">
          <Group gap="sm" style={{ minWidth: 0, flex: 1 }}>
            <IconFileTypePdf size={18} color="var(--mantine-color-gray-5)" />
            <Box style={{ minWidth: 0 }}>
              <Text size="sm" fw={500} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {fileName}
              </Text>
            </Box>
            <StatusBadge status={currentStatus} />
          </Group>

          <Group gap="sm" style={{ flexShrink: 0 }}>
            {/* Mobile PDF toggle */}
            <Tooltip label={showPdf ? "Hide PDF" : "Show PDF"} withArrow>
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={() => setShowPdf((v) => !v)}
                visibleFrom="xs"
                hiddenFrom="lg"
              >
                {showPdf ? <IconEyeOff size={16} /> : <IconEye size={16} />}
              </ActionIcon>
            </Tooltip>

            {isProcessing && (
              <Tooltip label="Restart extraction pipeline" withArrow>
                <Button
                  size="xs"
                  variant="light"
                  color="blue"
                  leftSection={<IconRefresh size={12} />}
                  onClick={handleRetry}
                  loading={isPending}
                  disabled={isPending}
                >
                  Retry
                </Button>
              </Tooltip>
            )}

            {!isApproved && !isRejected && !isProcessing && (
              <>
                <Button
                  size="xs"
                  variant="light"
                  color="red"
                  leftSection={<IconX size={12} />}
                  onClick={handleReject}
                  loading={isPending}
                  disabled={isPending}
                >
                  Reject
                </Button>
                <Button
                  size="xs"
                  color="teal"
                  leftSection={<IconCheck size={12} />}
                  onClick={handleApprove}
                  loading={isPending}
                  disabled={isPending}
                >
                  Approve
                </Button>
              </>
            )}

            {isApproved && (
              <Badge color="teal" variant="light" size="sm">
                Approved
              </Badge>
            )}
            {isRejected && (
              <Badge color="red" variant="light" size="sm">
                Rejected
              </Badge>
            )}
          </Group>
        </Group>
      </Box>

      {/* Split-screen body */}
      <Box style={{ flex: 1, minHeight: 0, display: "flex", overflow: "hidden" }}>
        {/* PDF pane */}
        {showPdf && (
          <Box
            style={{
              flex: 7,
              minWidth: 0,
              height: "100%",
              borderRight: "1px solid var(--mantine-color-gray-2)",
              background: "#525659",
            }}
          >
            <iframe
              src={pdfUrl}
              style={{ width: "100%", height: "100%", border: "none", display: "block" }}
              title={fileName}
            />
          </Box>
        )}

        {/* Fields pane */}
        <Box style={{ flex: showPdf ? 5 : 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <ScrollArea style={{ flex: 1, height: 0 }} px="md" py="md" scrollbarSize={6}>
            {isProcessing && (
              <Stack align="center" gap="sm" style={{ padding: "60px 0" }}>
                <IconLoader size={32} color="var(--mantine-color-gray-4)" />
                <Text c="dimmed" size="sm">
                  Extraction in progress…
                </Text>
                <Text c="dimmed" size="xs" ta="center">
                  Refresh the page in a moment to see extracted fields.
                  If it stays stuck, use the Retry button above.
                </Text>
              </Stack>
            )}

            {!isProcessing && !extractionData && (
              <Stack align="center" gap="sm" style={{ padding: "60px 0" }}>
                <Text c="dimmed" size="sm">
                  No extraction data available.
                </Text>
              </Stack>
            )}

            {extractionData && (
              <Stack gap="xl">
                <FieldGroup title="Document">
                  <FieldRow label="Document Type" value={extractionData.documentType.value} confidence={extractionData.documentType.confidence} />
                  <FieldRow label="Permit Number" value={extractionData.permitNumber.value} confidence={extractionData.permitNumber.confidence} />
                  <FieldRow label="Account Number" value={extractionData.accountNumber.value} confidence={extractionData.accountNumber.confidence} />
                </FieldGroup>

                <Divider />

                <FieldGroup title="Customer &amp; Location">
                  <FieldRow label="Customer Name" value={extractionData.customerName.value} confidence={extractionData.customerName.confidence} />
                  <FieldRow label="Facility Name" value={extractionData.facilityName.value} confidence={extractionData.facilityName.confidence} />
                  <FieldRow label="Service Address" value={extractionData.serviceAddress.value} confidence={extractionData.serviceAddress.confidence} />
                  <FieldRow label="Mailing Address" value={extractionData.mailingAddress.value} confidence={extractionData.mailingAddress.confidence} />
                  <FieldRow label="Issuing Authority" value={extractionData.issuingAuthority.value} confidence={extractionData.issuingAuthority.confidence} />
                </FieldGroup>

                <Divider />

                <FieldGroup title="Dates">
                  <FieldRow label="Issue Date" value={extractionData.issueDate.value} confidence={extractionData.issueDate.confidence} />
                  <FieldRow label="Due Date" value={extractionData.dueDate.value} confidence={extractionData.dueDate.confidence} />
                  <FieldRow label="Billing Period Start" value={extractionData.billingPeriodStart.value} confidence={extractionData.billingPeriodStart.confidence} />
                  <FieldRow label="Billing Period End" value={extractionData.billingPeriodEnd.value} confidence={extractionData.billingPeriodEnd.confidence} />
                  <FieldRow label="Billing Days" value={extractionData.billingDays.value} confidence={extractionData.billingDays.confidence} format="integer" />
                </FieldGroup>

                <Divider />

                {/* Line items — one card per utility service */}
                <FieldGroup title={`Utility Services (${extractionData.lineItems.value.length})`}>
                  {extractionData.lineItems.value.length === 0 ? (
                    <Text size="xs" c="dimmed" py={8}>No line items extracted.</Text>
                  ) : (
                    <Stack gap="xs" mt={4}>
                      {extractionData.lineItems.value.map((item: LineItem, i: number) => (
                        <LineItemCard key={i} item={item} />
                      ))}
                    </Stack>
                  )}
                  <Box mt={4}>
                    <ConfidenceBadge confidence={extractionData.lineItems.confidence} />
                  </Box>
                </FieldGroup>

                <Divider />

                <FieldGroup title="Bill Totals">
                  <FieldRow label="Total Cost" value={extractionData.totalCost.value} confidence={extractionData.totalCost.confidence} format="currency" />
                  <FieldRow label="Currency" value={extractionData.currency.value} confidence={extractionData.currency.confidence} />
                  <FieldRow label="Previous Balance" value={extractionData.previousBalance.value} confidence={extractionData.previousBalance.confidence} format="currency" />
                  <FieldRow label="Payments Received" value={extractionData.paymentsReceived.value} confidence={extractionData.paymentsReceived.confidence} format="currency" />
                  <FieldRow label="Amount Due" value={extractionData.amountDue.value} confidence={extractionData.amountDue.confidence} format="currency" />
                </FieldGroup>

                {(extractionData.conditions.value.length > 0 || extractionData.emissionsLimits.value.length > 0) && (
                  <>
                    <Divider />
                    <FieldGroup title="Regulatory">
                      <FieldRow label="Conditions" value={extractionData.conditions.value} confidence={extractionData.conditions.confidence} />
                      <FieldRow label="Emissions Limits" value={extractionData.emissionsLimits.value} confidence={extractionData.emissionsLimits.confidence} />
                    </FieldGroup>
                  </>
                )}

                <Divider />

                <FieldGroup title="Metadata">
                  <FieldRow label="Page Count" value={extractionData.pageCount.value} confidence={extractionData.pageCount.confidence} format="integer" />
                  <FieldRow label="Extraction Notes" value={extractionData.extractionNotes.value} confidence={extractionData.extractionNotes.confidence} />
                </FieldGroup>
              </Stack>
            )}
          </ScrollArea>
        </Box>
      </Box>
    </Box>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "gray" },
  extracting: { label: "Extracting", color: "blue" },
  needs_review: { label: "Needs Review", color: "orange" },
  approved: { label: "Approved", color: "teal" },
  rejected: { label: "Rejected", color: "red" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: "gray" };
  return (
    <Badge size="xs" color={cfg.color} variant="light">
      {cfg.label}
    </Badge>
  );
}
