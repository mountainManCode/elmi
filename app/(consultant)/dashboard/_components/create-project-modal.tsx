"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button, Group, Modal, Stack, Textarea, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { createProject } from "../actions";

type Props = {
  orgId: string;
  opened: boolean;
  onClose: () => void;
};

export function CreateProjectModal({ orgId, opened, onClose }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm({
    initialValues: { name: "", description: "" },
    validate: {
      name: (v) => (v.trim().length > 0 ? null : "Project name is required"),
    },
  });

  const handleSubmit = form.onSubmit((values) => {
    startTransition(async () => {
      const result = await createProject(
        orgId,
        values.name.trim(),
        values.description.trim() || undefined
      );
      if (result.success) {
        notifications.show({
          title: "Project created",
          message: `"${values.name}" is ready for suppliers.`,
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
    <Modal opened={opened} onClose={onClose} title="New project" centered>
      <form onSubmit={handleSubmit}>
        <Stack gap="sm">
          <TextInput
            label="Project name"
            placeholder="e.g. Q1 2026 Scope 3 Engagement"
            required
            {...form.getInputProps("name")}
          />
          <Textarea
            label="Description"
            placeholder="Optional context for your team"
            rows={3}
            {...form.getInputProps("description")}
          />
          <Group justify="flex-end" mt="xs">
            <Button variant="subtle" color="gray" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" color="teal" loading={isPending}>
              Create project
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
