"use client";

import { Button } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconPlus } from "@tabler/icons-react";
import { CreateProjectModal } from "./create-project-modal";

export function CreateProjectButton({ orgId }: { orgId: string }) {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <Button
        size="sm"
        color="teal"
        leftSection={<IconPlus size={14} />}
        onClick={open}
      >
        New project
      </Button>
      <CreateProjectModal orgId={orgId} opened={opened} onClose={close} />
    </>
  );
}
