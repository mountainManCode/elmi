"use client";

import { useState, useTransition } from "react";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Divider,
  Grid,
  GridCol,
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
import type { ExtractionData } from "@/lib/validators/extraction";

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

function FieldRow({
  label,
  value,
  confidence,
}: {
  label: string;
  value: string | number | string[] | null;
  confidence: number;
}) {
  const isEmpty = value === null || value === "" || (Array.isArray(value) && value.length === 0);

  const displayValue = isEmpty
    ? "—"
    : Array.isArray(value)
      ? value.join(", ")
      : String(value);

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
      <Grid
        style={{ flex: 1, margin: 0, minHeight: 0, gridAutoRows: "1fr" }}
        gutter={0}
      >
        {/* PDF pane */}
        {(showPdf) && (
          <GridCol
            span={{ base: 12, lg: 7 }}
            style={{ height: "100%", borderRight: "1px solid var(--mantine-color-gray-2)" }}
          >
            <Box style={{ height: "100%", background: "#525659" }}>
              <iframe
                src={pdfUrl}
                style={{ width: "100%", height: "100%", border: "none", display: "block" }}
                title={fileName}
              />
            </Box>
          </GridCol>
        )}

        {/* Fields pane */}
        <GridCol
          span={{ base: 12, lg: showPdf ? 5 : 12 }}
          style={{ height: "100%", display: "flex", flexDirection: "column" }}
        >
          <ScrollArea style={{ flex: 1 }} px="md" py="md">
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

                <FieldGroup title="Facility">
                  <FieldRow label="Facility Name" value={extractionData.facilityName.value} confidence={extractionData.facilityName.confidence} />
                  <FieldRow label="Address" value={extractionData.facilityAddress.value} confidence={extractionData.facilityAddress.confidence} />
                  <FieldRow label="Applicant" value={extractionData.applicant.value} confidence={extractionData.applicant.confidence} />
                  <FieldRow label="Issuing Authority" value={extractionData.issuingAuthority.value} confidence={extractionData.issuingAuthority.confidence} />
                </FieldGroup>

                <Divider />

                <FieldGroup title="Dates">
                  <FieldRow label="Issue Date" value={extractionData.issueDate.value} confidence={extractionData.issueDate.confidence} />
                  <FieldRow label="Expiration Date" value={extractionData.expirationDate.value} confidence={extractionData.expirationDate.confidence} />
                  <FieldRow label="Billing Period Start" value={extractionData.billingPeriodStart.value} confidence={extractionData.billingPeriodStart.confidence} />
                  <FieldRow label="Billing Period End" value={extractionData.billingPeriodEnd.value} confidence={extractionData.billingPeriodEnd.confidence} />
                </FieldGroup>

                <Divider />

                <FieldGroup title="Utility Data">
                  <FieldRow label="Utility Type" value={extractionData.utilityType.value} confidence={extractionData.utilityType.confidence} />
                  <FieldRow label="Consumption" value={extractionData.consumption.value} confidence={extractionData.consumption.confidence} />
                  <FieldRow label="Unit" value={extractionData.consumptionUnit.value} confidence={extractionData.consumptionUnit.confidence} />
                  <FieldRow label="Total Cost" value={extractionData.totalCost.value} confidence={extractionData.totalCost.confidence} />
                  <FieldRow label="Currency" value={extractionData.currency.value} confidence={extractionData.currency.confidence} />
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
                  <FieldRow label="Page Count" value={extractionData.pageCount.value} confidence={extractionData.pageCount.confidence} />
                  <FieldRow label="Extraction Notes" value={extractionData.extractionNotes.value} confidence={extractionData.extractionNotes.confidence} />
                </FieldGroup>
              </Stack>
            )}
          </ScrollArea>
        </GridCol>
      </Grid>
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
