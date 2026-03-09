"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Card, Stack, Text, TextInput, Title } from "@mantine/core";
import { IconBuilding } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { createOrg } from "../actions";

export function CreateOrgPrompt() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    startTransition(async () => {
      const result = await createOrg(name.trim());
      if (result.success) {
        notifications.show({
          title: "Organization created",
          message: "Your workspace is ready. Create your first project.",
          color: "teal",
        });
        router.refresh();
      } else {
        notifications.show({
          title: "Error",
          message: result.error,
          color: "red",
        });
      }
    });
  };

  return (
    <Box
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - 60px)",
        padding: "40px 24px",
      }}
    >
      <Card
        shadow="sm"
        padding="xl"
        radius="md"
        withBorder
        style={{ width: "100%", maxWidth: 420 }}
      >
        <Stack gap="lg">
          <Box
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: "linear-gradient(135deg, #5B9E8A 0%, #3D7A68 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconBuilding size={22} color="white" stroke={1.5} />
          </Box>

          <Box>
            <Title order={3} style={{ fontWeight: 600, letterSpacing: "-0.3px" }}>
              Set up your workspace
            </Title>
            <Text size="sm" c="dimmed" mt={4}>
              Create an organization to start managing ESG supplier documents.
            </Text>
          </Box>

          <form onSubmit={handleSubmit}>
            <Stack gap="sm">
              <TextInput
                label="Organization name"
                placeholder="e.g. Meridian ESG Advisors"
                value={name}
                onChange={(e) => setName(e.currentTarget.value)}
                required
              />
              <Button
                type="submit"
                loading={isPending}
                disabled={!name.trim()}
                color="teal"
                fullWidth
              >
                Create workspace
              </Button>
            </Stack>
          </form>
        </Stack>
      </Card>
    </Box>
  );
}
