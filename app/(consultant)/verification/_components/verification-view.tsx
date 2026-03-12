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
  TextInput,
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
  IconDeviceFloppy,
  IconRotate,
  IconAlertTriangle,
} from "@tabler/icons-react";
import {
  approveDocument,
  rejectDocument,
  retryExtraction,
  updateExtractionData,
} from "../actions";
import type { ExtractionData, LineItem } from "@/lib/validators/extraction";
import type { FieldComparison } from "@/lib/validators/validation";

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  documentId: string;
  fileName: string;
  status: string;
  pdfUrl: string;
  extractionData: ExtractionData | null;
  validationFields?: Record<string, FieldComparison> | null;
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

// ─── Field value formatter ────────────────────────────────────────────────────

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

// ─── Editable field row ───────────────────────────────────────────────────────

function EditableFieldRow({
  label,
  value,
  confidence,
  isEdited,
  onEdit,
  format,
  validation,
}: {
  label: string;
  value: string | number | null;
  confidence: number;
  isEdited: boolean;
  onEdit: (v: string | number | null) => void;
  format?: "currency" | "integer";
  validation?: FieldComparison;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const isEmpty = value === null || value === "";
  const displayValue = isEmpty ? "—" : formatFieldValue(value, format);

  const startEdit = () => {
    setDraft(value === null ? "" : String(value));
    setEditing(true);
  };

  const commitEdit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed === "") {
      onEdit(null);
    } else if (typeof value === "number" || format === "currency" || format === "integer") {
      // Strip any currency formatting before parsing
      const stripped = trimmed.replace(/[$,]/g, "");
      const num = parseFloat(stripped);
      onEdit(isNaN(num) ? null : num);
    } else {
      onEdit(trimmed);
    }
  };

  if (editing) {
    return (
      <Box py={8} style={{ borderBottom: "1px solid var(--mantine-color-gray-1)" }}>
        <Text
          size="xs"
          c="dimmed"
          mb={4}
          style={{ textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, fontSize: 10 }}
        >
          {label}
        </Text>
        <TextInput
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") {
              setEditing(false);
            }
          }}
          size="xs"
          autoFocus
          rightSection={
            <ActionIcon size="xs" variant="transparent" color="teal" onClick={commitEdit}>
              <IconCheck size={12} />
            </ActionIcon>
          }
        />
      </Box>
    );
  }

  return (
    <Box
      py={8}
      style={{
        borderBottom: "1px solid var(--mantine-color-gray-1)",
        cursor: "text",
        borderRadius: 2,
        marginLeft: -4,
        marginRight: -4,
        paddingLeft: 4,
        paddingRight: 4,
        transition: "background 100ms ease",
      }}
      onClick={startEdit}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "var(--mantine-color-gray-0)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      <Group justify="space-between" align="flex-start" wrap="nowrap" gap="xs">
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Text
            size="xs"
            c="dimmed"
            mb={2}
            style={{ textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, fontSize: 10 }}
          >
            {label}
          </Text>
          <Text size="sm" c={isEmpty ? "dimmed" : undefined} style={{ wordBreak: "break-word" }}>
            {displayValue}
          </Text>
        </Box>
        <Group gap={4} style={{ flexShrink: 0 }}>
          {validation && !validation.agrees && !isEdited && (
            <Tooltip
              label={
                <Box>
                  <Text size="xs" fw={600} mb={2}>AI disagrees</Text>
                  {validation.claudeValue && (
                    <Text size="xs">Claude read: {validation.claudeValue}</Text>
                  )}
                  {validation.note && (
                    <Text size="xs" c="dimmed" mt={2}>{validation.note}</Text>
                  )}
                </Box>
              }
              withArrow
              multiline
              w={220}
            >
              <Badge
                size="xs"
                color="yellow"
                variant="light"
                leftSection={<IconAlertTriangle size={9} />}
                style={{ cursor: "default" }}
              >
                AI disagrees
              </Badge>
            </Tooltip>
          )}
          {isEdited ? (
            <Badge size="xs" color="violet" variant="light">Edited</Badge>
          ) : (
            !isEmpty && <ConfidenceBadge confidence={confidence} />
          )}
        </Group>
      </Group>
    </Box>
  );
}

// ─── Display-only field row (for arrays / non-editable) ───────────────────────

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

export function VerificationView({ documentId, fileName, status, pdfUrl, extractionData, validationFields }: Props) {
  const [showPdf, setShowPdf] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [currentStatus, setCurrentStatus] = useState(status);

  // Editable extraction data state
  const [localData, setLocalData] = useState<ExtractionData | null>(extractionData);
  const [editedFields, setEditedFields] = useState<Set<string>>(new Set());
  const hasEdits = editedFields.size > 0;

  const isApproved = currentStatus === "approved";
  const isRejected = currentStatus === "rejected";
  const isProcessing = currentStatus === "pending" || currentStatus === "extracting" || currentStatus === "validating";

  // ── Field update helper ────────────────────────────────────────────────────

  const updateField = (fieldName: string, newValue: string | number | null) => {
    setLocalData((prev) => {
      if (!prev) return prev;
      const field = prev[fieldName as keyof ExtractionData] as { value: unknown; confidence: number };
      return {
        ...prev,
        [fieldName]: { ...field, value: newValue },
      };
    });
    setEditedFields((prev) => new Set([...prev, fieldName]));
  };

  // ── Action handlers ────────────────────────────────────────────────────────

  const handleSave = () => {
    if (!localData) return;
    startTransition(async () => {
      const result = await updateExtractionData(documentId, localData);
      if (result.success) {
        setEditedFields(new Set());
        notifications.show({
          title: "Saved",
          message: "Field edits saved successfully.",
          color: "teal",
          icon: <IconCheck size={16} />,
        });
      } else {
        notifications.show({ title: "Error", message: result.error, color: "red" });
      }
    });
  };

  const handleDiscard = () => {
    setLocalData(extractionData);
    setEditedFields(new Set());
  };

  const handleApprove = () => {
    startTransition(async () => {
      // Auto-save any edits before approving
      if (hasEdits && localData) {
        await updateExtractionData(documentId, localData);
        setEditedFields(new Set());
      }
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

            {/* Unsaved edits indicator */}
            {hasEdits && (
              <Group gap={6}>
                <Tooltip label="Discard all edits" withArrow>
                  <Button
                    size="xs"
                    variant="subtle"
                    color="gray"
                    leftSection={<IconRotate size={12} />}
                    onClick={handleDiscard}
                    disabled={isPending}
                  >
                    Discard
                  </Button>
                </Tooltip>
                <Button
                  size="xs"
                  variant="light"
                  color="violet"
                  leftSection={<IconDeviceFloppy size={12} />}
                  onClick={handleSave}
                  loading={isPending}
                  disabled={isPending}
                >
                  Save {editedFields.size} edit{editedFields.size !== 1 ? "s" : ""}
                </Button>
              </Group>
            )}

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
                  {hasEdits ? "Save & Approve" : "Approve"}
                </Button>
              </>
            )}

            {isApproved && (
              <>
                {hasEdits && (
                  <Button
                    size="xs"
                    variant="light"
                    color="violet"
                    leftSection={<IconDeviceFloppy size={12} />}
                    onClick={handleSave}
                    loading={isPending}
                    disabled={isPending}
                  >
                    Save {editedFields.size} edit{editedFields.size !== 1 ? "s" : ""}
                  </Button>
                )}
                <Badge color="teal" variant="light" size="sm">Approved</Badge>
              </>
            )}
            {isRejected && (
              <Badge color="red" variant="light" size="sm">Rejected</Badge>
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
                  {currentStatus === "validating" ? "AI validation in progress…" : "Extraction in progress…"}
                </Text>
                <Text c="dimmed" size="xs" ta="center">
                  {currentStatus === "validating"
                    ? "Claude is cross-checking the extraction. Refresh in a moment to see results."
                    : "Refresh the page in a moment to see extracted fields. If it stays stuck, use the Retry button above."}
                </Text>
              </Stack>
            )}

            {!isProcessing && !localData && (
              <Stack align="center" gap="sm" style={{ padding: "60px 0" }}>
                <Text c="dimmed" size="sm">
                  No extraction data available.
                </Text>
              </Stack>
            )}

            {localData && (
              <Stack gap="xl">
                {/* Edit hint */}
                {!isProcessing && (
                  <Text size="xs" c="dimmed" style={{ fontStyle: "italic" }}>
                    Click any field to edit its value.
                  </Text>
                )}

                <FieldGroup title="Document">
                  <EditableFieldRow label="Document Type" value={localData.documentType.value} confidence={localData.documentType.confidence} isEdited={editedFields.has("documentType")} onEdit={(v) => updateField("documentType", v)} validation={validationFields?.["documentType"]} />
                  <EditableFieldRow label="Permit Number" value={localData.permitNumber.value} confidence={localData.permitNumber.confidence} isEdited={editedFields.has("permitNumber")} onEdit={(v) => updateField("permitNumber", v)} validation={validationFields?.["permitNumber"]} />
                  <EditableFieldRow label="Account Number" value={localData.accountNumber.value} confidence={localData.accountNumber.confidence} isEdited={editedFields.has("accountNumber")} onEdit={(v) => updateField("accountNumber", v)} validation={validationFields?.["accountNumber"]} />
                </FieldGroup>

                <Divider />

                <FieldGroup title="Customer &amp; Location">
                  <EditableFieldRow label="Customer Name" value={localData.customerName.value} confidence={localData.customerName.confidence} isEdited={editedFields.has("customerName")} onEdit={(v) => updateField("customerName", v)} validation={validationFields?.["customerName"]} />
                  <EditableFieldRow label="Facility Name" value={localData.facilityName.value} confidence={localData.facilityName.confidence} isEdited={editedFields.has("facilityName")} onEdit={(v) => updateField("facilityName", v)} validation={validationFields?.["facilityName"]} />
                  <EditableFieldRow label="Service Address" value={localData.serviceAddress.value} confidence={localData.serviceAddress.confidence} isEdited={editedFields.has("serviceAddress")} onEdit={(v) => updateField("serviceAddress", v)} validation={validationFields?.["serviceAddress"]} />
                  <EditableFieldRow label="Mailing Address" value={localData.mailingAddress.value} confidence={localData.mailingAddress.confidence} isEdited={editedFields.has("mailingAddress")} onEdit={(v) => updateField("mailingAddress", v)} validation={validationFields?.["mailingAddress"]} />
                  <EditableFieldRow label="Issuing Authority" value={localData.issuingAuthority.value} confidence={localData.issuingAuthority.confidence} isEdited={editedFields.has("issuingAuthority")} onEdit={(v) => updateField("issuingAuthority", v)} validation={validationFields?.["issuingAuthority"]} />
                </FieldGroup>

                <Divider />

                <FieldGroup title="Dates">
                  <EditableFieldRow label="Issue Date" value={localData.issueDate.value} confidence={localData.issueDate.confidence} isEdited={editedFields.has("issueDate")} onEdit={(v) => updateField("issueDate", v)} validation={validationFields?.["issueDate"]} />
                  <EditableFieldRow label="Due Date" value={localData.dueDate.value} confidence={localData.dueDate.confidence} isEdited={editedFields.has("dueDate")} onEdit={(v) => updateField("dueDate", v)} validation={validationFields?.["dueDate"]} />
                  <EditableFieldRow label="Billing Period Start" value={localData.billingPeriodStart.value} confidence={localData.billingPeriodStart.confidence} isEdited={editedFields.has("billingPeriodStart")} onEdit={(v) => updateField("billingPeriodStart", v)} validation={validationFields?.["billingPeriodStart"]} />
                  <EditableFieldRow label="Billing Period End" value={localData.billingPeriodEnd.value} confidence={localData.billingPeriodEnd.confidence} isEdited={editedFields.has("billingPeriodEnd")} onEdit={(v) => updateField("billingPeriodEnd", v)} validation={validationFields?.["billingPeriodEnd"]} />
                  <EditableFieldRow label="Billing Days" value={localData.billingDays.value} confidence={localData.billingDays.confidence} isEdited={editedFields.has("billingDays")} onEdit={(v) => updateField("billingDays", v)} format="integer" validation={validationFields?.["billingDays"]} />
                </FieldGroup>

                <Divider />

                {/* Line items — display-only (complex structure, skip inline editing) */}
                <FieldGroup title={`Utility Services (${localData.lineItems.value.length})`}>
                  {localData.lineItems.value.length === 0 ? (
                    <Text size="xs" c="dimmed" py={8}>No line items extracted.</Text>
                  ) : (
                    <Stack gap="xs" mt={4}>
                      {localData.lineItems.value.map((item: LineItem, i: number) => (
                        <LineItemCard key={i} item={item} />
                      ))}
                    </Stack>
                  )}
                  <Box mt={4}>
                    <ConfidenceBadge confidence={localData.lineItems.confidence} />
                  </Box>
                </FieldGroup>

                <Divider />

                <FieldGroup title="Bill Totals">
                  <EditableFieldRow label="Total Cost" value={localData.totalCost.value} confidence={localData.totalCost.confidence} isEdited={editedFields.has("totalCost")} onEdit={(v) => updateField("totalCost", v)} format="currency" validation={validationFields?.["totalCost"]} />
                  <EditableFieldRow label="Currency" value={localData.currency.value} confidence={localData.currency.confidence} isEdited={editedFields.has("currency")} onEdit={(v) => updateField("currency", v)} validation={validationFields?.["currency"]} />
                  <EditableFieldRow label="Previous Balance" value={localData.previousBalance.value} confidence={localData.previousBalance.confidence} isEdited={editedFields.has("previousBalance")} onEdit={(v) => updateField("previousBalance", v)} format="currency" validation={validationFields?.["previousBalance"]} />
                  <EditableFieldRow label="Payments Received" value={localData.paymentsReceived.value} confidence={localData.paymentsReceived.confidence} isEdited={editedFields.has("paymentsReceived")} onEdit={(v) => updateField("paymentsReceived", v)} format="currency" validation={validationFields?.["paymentsReceived"]} />
                  <EditableFieldRow label="Amount Due" value={localData.amountDue.value} confidence={localData.amountDue.confidence} isEdited={editedFields.has("amountDue")} onEdit={(v) => updateField("amountDue", v)} format="currency" validation={validationFields?.["amountDue"]} />
                </FieldGroup>

                {(localData.conditions.value.length > 0 || localData.emissionsLimits.value.length > 0) && (
                  <>
                    <Divider />
                    <FieldGroup title="Regulatory">
                      <FieldRow label="Conditions" value={localData.conditions.value} confidence={localData.conditions.confidence} />
                      <FieldRow label="Emissions Limits" value={localData.emissionsLimits.value} confidence={localData.emissionsLimits.confidence} />
                    </FieldGroup>
                  </>
                )}

                <Divider />

                <FieldGroup title="Metadata">
                  <EditableFieldRow label="Page Count" value={localData.pageCount.value} confidence={localData.pageCount.confidence} isEdited={editedFields.has("pageCount")} onEdit={(v) => updateField("pageCount", v)} format="integer" validation={validationFields?.["pageCount"]} />
                  <FieldRow label="Extraction Notes" value={localData.extractionNotes.value} confidence={localData.extractionNotes.confidence} />
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
  validating: { label: "Validating", color: "violet" },
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
