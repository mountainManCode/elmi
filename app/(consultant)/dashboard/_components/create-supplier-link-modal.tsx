"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Group,
  Modal,
  NumberInput,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { createSupplierLink } from "../actions";

type Props = {
  projectId: string;
  projectName: string;
  opened: boolean;
  onClose: () => void;
};

export function CreateSupplierLinkModal({
  projectId,
  projectName,
  opened,
  onClose,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm({
    initialValues: { supplierId: "", expiresInDays: 30, maxUploads: 10 },
    validate: {
      supplierId: (v) =>
        v.trim().length > 0 ? null : "Supplier name is required",
      expiresInDays: (v) =>
        v > 0 && v <= 365 ? null : "Must be between 1 and 365 days",
      maxUploads: (v) =>
        v > 0 && v <= 50 ? null : "Must be between 1 and 50",
    },
  });

  const handleSubmit = form.onSubmit((values) => {
    startTransition(async () => {
      const result = await createSupplierLink(
        projectId,
        values.supplierId.trim(),
        values.expiresInDays,
        values.maxUploads
      );
      if (result.success) {
        notifications.show({
          title: "Link generated",
          message: `Upload link created for "${values.supplierId}".`,
          color: "teal",
        });
        form.reset();
        onClose();
        router.refresh();
      } else {
        notifications.show({ title: "Error", message: result.error, color: "red" });
      }
    });
  });

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Generate supplier link"
      centered
    >
      <Text size="sm" c="dimmed" mb="md">
        Project: <strong>{projectName}</strong>
      </Text>
      <form onSubmit={handleSubmit}>
        <Stack gap="sm">
          <TextInput
            label="Supplier name"
            placeholder="e.g. Acme Manufacturing"
            description="Used to identify uploads from this supplier"
            required
            {...form.getInputProps("supplierId")}
          />
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
