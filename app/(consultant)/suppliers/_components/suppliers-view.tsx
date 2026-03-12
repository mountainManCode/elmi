"use client";

import { useState, useTransition } from "react";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Modal,
  Stack,
  Table,
  Text,
  TextInput,
  Textarea,
  Tooltip,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconBuilding,
  IconCheck,
  IconEdit,
  IconMail,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { createSupplier, updateSupplier, deleteSupplier } from "../actions";

// ─── Types ────────────────────────────────────────────────────────────────────

type SupplierRow = {
  id: string;
  name: string;
  email: string | null;
  notes: string | null;
  createdAt: Date;
  linkCount: number;
  docCount: number;
  approvedCount: number;
};

type Props = {
  orgId: string;
  suppliers: SupplierRow[];
};

// ─── Create / Edit modal ──────────────────────────────────────────────────────

function SupplierModal({
  orgId,
  editTarget,
  opened,
  onClose,
}: {
  orgId: string;
  editTarget: SupplierRow | null;
  opened: boolean;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const isEdit = editTarget !== null;

  const form = useForm({
    initialValues: {
      name: editTarget?.name ?? "",
      email: editTarget?.email ?? "",
      notes: editTarget?.notes ?? "",
    },
    validate: {
      name: (v) => (v.trim().length > 0 ? null : "Supplier name is required"),
      email: (v) =>
        !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
          ? null
          : "Invalid email address",
    },
  });

  const handleSubmit = form.onSubmit((values) => {
    startTransition(async () => {
      const result = isEdit
        ? await updateSupplier(editTarget!.id, values.name, values.email || undefined, values.notes || undefined)
        : await createSupplier(orgId, values.name, values.email || undefined, values.notes || undefined);

      if (result.success) {
        notifications.show({
          title: isEdit ? "Supplier updated" : "Supplier created",
          message: `"${values.name}" ${isEdit ? "updated" : "added"} successfully.`,
          color: "teal",
          icon: <IconCheck size={16} />,
        });
        form.reset();
        onClose();
      } else {
        notifications.show({ title: "Error", message: result.error, color: "red" });
      }
    });
  });

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEdit ? "Edit supplier" : "Add supplier"}
      centered
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="sm">
          <TextInput
            label="Supplier name"
            placeholder="e.g. Acme Manufacturing"
            required
            {...form.getInputProps("name")}
          />
          <TextInput
            label="Email"
            placeholder="contact@acme.com"
            leftSection={<IconMail size={14} />}
            {...form.getInputProps("email")}
          />
          <Textarea
            label="Notes"
            placeholder="Optional notes about this supplier…"
            rows={3}
            {...form.getInputProps("notes")}
          />
          <Group justify="flex-end" mt="xs">
            <Button variant="subtle" color="gray" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" color="teal" loading={isPending}>
              {isEdit ? "Save changes" : "Add supplier"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

// ─── Delete confirm modal ─────────────────────────────────────────────────────

function DeleteModal({
  supplier,
  opened,
  onClose,
}: {
  supplier: SupplierRow | null;
  opened: boolean;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!supplier) return;
    startTransition(async () => {
      const result = await deleteSupplier(supplier.id);
      if (result.success) {
        notifications.show({
          title: "Supplier removed",
          message: `"${supplier.name}" has been deleted.`,
          color: "orange",
        });
        onClose();
      } else {
        notifications.show({ title: "Error", message: result.error, color: "red" });
      }
    });
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Delete supplier?" centered size="sm">
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Remove <strong>{supplier?.name}</strong>? This won&apos;t delete their uploaded documents,
          but existing supplier links will lose their association.
        </Text>
        {supplier && supplier.docCount > 0 && (
          <Badge color="orange" variant="light" size="sm">
            {supplier.docCount} document{supplier.docCount !== 1 ? "s" : ""} will be unaffected
          </Badge>
        )}
        <Group justify="flex-end">
          <Button variant="subtle" color="gray" onClick={onClose}>
            Cancel
          </Button>
          <Button color="red" loading={isPending} onClick={handleDelete}>
            Delete supplier
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

export function SuppliersView({ orgId, suppliers }: Props) {
  const [modalOpen, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [deleteOpen, { open: openDelete, close: closeDelete }] = useDisclosure(false);
  const [editTarget, setEditTarget] = useState<SupplierRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SupplierRow | null>(null);

  const openEdit = (s: SupplierRow) => {
    setEditTarget(s);
    openModal();
    // Note: SupplierModal reads editTarget via prop, so form values come from the prop
  };

  const openCreate = () => {
    setEditTarget(null);
    openModal();
  };

  const openDeleteConfirm = (s: SupplierRow) => {
    setDeleteTarget(s);
    openDelete();
  };

  const totalDocs = suppliers.reduce((acc, s) => acc + s.docCount, 0);
  const totalApproved = suppliers.reduce((acc, s) => acc + s.approvedCount, 0);

  return (
    <>
      <Box style={{ padding: "32px 40px 40px" }}>
        {/* Page header */}
        <Group justify="space-between" align="flex-start" mb="xl" wrap="nowrap">
          <Box>
            <Text style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.4px", lineHeight: 1.2 }}>
              Suppliers
            </Text>
            <Text size="sm" c="dimmed" mt={4}>
              {suppliers.length} supplier{suppliers.length !== 1 ? "s" : ""}
              {suppliers.length > 0 && (
                <> · {totalDocs} document{totalDocs !== 1 ? "s" : ""} · {totalApproved} approved</>
              )}
            </Text>
          </Box>
          <Button
            color="teal"
            leftSection={<IconPlus size={14} />}
            onClick={openCreate}
          >
            Add supplier
          </Button>
        </Group>

        {/* Suppliers table */}
        {suppliers.length === 0 ? (
          <Box
            style={{
              textAlign: "center",
              padding: "80px 24px",
              background: "white",
              borderRadius: 10,
              border: "1px solid var(--mantine-color-gray-2)",
            }}
          >
            <IconBuilding size={32} color="var(--mantine-color-gray-3)" style={{ marginBottom: 12 }} />
            <Text size="sm" c="dimmed" mb={16}>
              No suppliers yet. Add your first supplier to get started.
            </Text>
            <Button color="teal" leftSection={<IconPlus size={14} />} onClick={openCreate}>
              Add supplier
            </Button>
          </Box>
        ) : (
          <Box
            style={{
              background: "white",
              borderRadius: 10,
              border: "1px solid var(--mantine-color-gray-2)",
              overflow: "hidden",
            }}
          >
            <Table
              highlightOnHover
              styles={{
                th: {
                  fontSize: 11,
                  color: "var(--mantine-color-gray-6)",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  padding: "12px 20px",
                  background: "var(--mantine-color-gray-0)",
                  borderBottom: "1px solid var(--mantine-color-gray-2)",
                },
                td: { padding: "12px 20px" },
              }}
            >
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Supplier</Table.Th>
                  <Table.Th>Email</Table.Th>
                  <Table.Th>Links</Table.Th>
                  <Table.Th>Documents</Table.Th>
                  <Table.Th>Approved</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {suppliers.map((s) => (
                  <Table.Tr key={s.id}>
                    <Table.Td>
                      <Box>
                        <Text size="sm" fw={500}>{s.name}</Text>
                        {s.notes && (
                          <Text size="xs" c="dimmed" lineClamp={1}>{s.notes}</Text>
                        )}
                      </Box>
                    </Table.Td>
                    <Table.Td>
                      {s.email ? (
                        <Text size="sm" c="dimmed">{s.email}</Text>
                      ) : (
                        <Text size="xs" c="dimmed">—</Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{s.linkCount}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{s.docCount}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c={s.approvedCount > 0 ? "teal" : "dimmed"} fw={s.approvedCount > 0 ? 500 : 400}>
                        {s.approvedCount}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4} justify="flex-end">
                        <Tooltip label="Edit" withArrow>
                          <ActionIcon
                            size="sm"
                            variant="subtle"
                            color="gray"
                            onClick={() => openEdit(s)}
                          >
                            <IconEdit size={14} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Delete" withArrow>
                          <ActionIcon
                            size="sm"
                            variant="subtle"
                            color="red"
                            onClick={() => openDeleteConfirm(s)}
                          >
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Box>
        )}
      </Box>

      {/* key forces re-mount when switching between create/edit, resetting form state */}
      <SupplierModal
        key={editTarget?.id ?? "create"}
        orgId={orgId}
        editTarget={editTarget}
        opened={modalOpen}
        onClose={closeModal}
      />

      <DeleteModal
        supplier={deleteTarget}
        opened={deleteOpen}
        onClose={closeDelete}
      />
    </>
  );
}
