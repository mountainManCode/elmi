"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Combobox,
  Group,
  InputBase,
  Modal,
  NumberInput,
  Stack,
  Text,
  TextInput,
  useCombobox,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconPlus } from "@tabler/icons-react";
import { createSupplierLink } from "../actions";

type SupplierOption = { id: string; name: string };

type Props = {
  projectId: string;
  projectName: string;
  suppliers: SupplierOption[];
  opened: boolean;
  onClose: () => void;
};

export function CreateSupplierLinkModal({
  projectId,
  projectName,
  suppliers,
  opened,
  onClose,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [creatingNew, setCreatingNew] = useState(false);

  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  const form = useForm({
    initialValues: {
      supplierId: "",       // Supplier.id when picking existing, or "" when typing new
      supplierName: "",     // Free-text name when creating new
      expiresInDays: 30,
      maxUploads: 10,
    },
    validate: {
      supplierId: (v) =>
        !creatingNew && v.trim().length === 0 ? "Please select or create a supplier" : null,
      supplierName: (v) =>
        creatingNew && v.trim().length === 0 ? "Supplier name is required" : null,
      expiresInDays: (v) =>
        v > 0 && v <= 365 ? null : "Must be between 1 and 365 days",
      maxUploads: (v) =>
        v > 0 && v <= 50 ? null : "Must be between 1 and 50",
    },
  });

  const selectedSupplier = suppliers.find((s) => s.id === form.values.supplierId);

  const handleSubmit = form.onSubmit((values) => {
    startTransition(async () => {
      // supplierName for display, supplierModelId for FK
      const supplierName = creatingNew
        ? values.supplierName.trim()
        : (selectedSupplier?.name ?? values.supplierId);

      const result = await createSupplierLink(
        projectId,
        supplierName,           // display name / doc matching key
        values.expiresInDays,
        values.maxUploads,
        creatingNew ? undefined : values.supplierId,  // existing supplier FK
        creatingNew ? supplierName : undefined         // new supplier to create
      );

      if (result.success) {
        notifications.show({
          title: "Link generated",
          message: `Upload link created for "${supplierName}".`,
          color: "teal",
        });
        form.reset();
        setCreatingNew(false);
        onClose();
        router.refresh();
      } else {
        notifications.show({ title: "Error", message: result.error, color: "red" });
      }
    });
  });

  const options = suppliers.map((s) => (
    <Combobox.Option value={s.id} key={s.id}>
      {s.name}
    </Combobox.Option>
  ));

  return (
    <Modal
      opened={opened}
      onClose={() => {
        form.reset();
        setCreatingNew(false);
        onClose();
      }}
      title="Generate supplier link"
      centered
    >
      <Text size="sm" c="dimmed" mb="md">
        Project: <strong>{projectName}</strong>
      </Text>
      <form onSubmit={handleSubmit}>
        <Stack gap="sm">
          {/* Supplier picker / new supplier input */}
          {!creatingNew ? (
            <Stack gap={4}>
              <Text size="sm" fw={500}>
                Supplier <span style={{ color: "red" }}>*</span>
              </Text>
              {suppliers.length > 0 ? (
                <Combobox
                  store={combobox}
                  onOptionSubmit={(val) => {
                    form.setFieldValue("supplierId", val);
                    combobox.closeDropdown();
                  }}
                >
                  <Combobox.Target>
                    <InputBase
                      component="button"
                      type="button"
                      pointer
                      rightSection={<Combobox.Chevron />}
                      rightSectionPointerEvents="none"
                      onClick={() => combobox.toggleDropdown()}
                      style={{ cursor: "pointer" }}
                    >
                      {selectedSupplier?.name ?? (
                        <Text component="span" c="dimmed">Select a supplier…</Text>
                      )}
                    </InputBase>
                  </Combobox.Target>
                  <Combobox.Dropdown>
                    <Combobox.Options>
                      {options}
                    </Combobox.Options>
                  </Combobox.Dropdown>
                </Combobox>
              ) : (
                <Text size="xs" c="dimmed">No suppliers yet.</Text>
              )}
              {form.errors.supplierId && (
                <Text size="xs" c="red">{form.errors.supplierId}</Text>
              )}
              <Button
                variant="subtle"
                color="teal"
                size="xs"
                leftSection={<IconPlus size={12} />}
                style={{ alignSelf: "flex-start", paddingLeft: 0 }}
                onClick={() => {
                  setCreatingNew(true);
                  form.setFieldValue("supplierId", "");
                }}
              >
                Create new supplier
              </Button>
            </Stack>
          ) : (
            <Stack gap={4}>
              <TextInput
                label="New supplier name"
                placeholder="e.g. Acme Manufacturing"
                required
                {...form.getInputProps("supplierName")}
              />
              <Text size="xs" c="dimmed">
                The supplier will be saved for future use.{" "}
                <Text
                  component="span"
                  size="xs"
                  c="teal"
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    setCreatingNew(false);
                    form.setFieldValue("supplierName", "");
                  }}
                >
                  Pick existing instead
                </Text>
              </Text>
            </Stack>
          )}

          <Group grow>
            <NumberInput
              label="Expires in (days)"
              min={1}
              max={365}
              {...form.getInputProps("expiresInDays")}
            />
            <NumberInput
              label="Max uploads"
              min={1}
              max={50}
              {...form.getInputProps("maxUploads")}
            />
          </Group>

          <Group justify="flex-end" mt="xs">
            <Button variant="subtle" color="gray" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" color="teal" loading={isPending}>
              Generate link
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
