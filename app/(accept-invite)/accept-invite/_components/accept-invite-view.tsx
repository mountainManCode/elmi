"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Card,
  Center,
  Group,
  Stack,
  Text,
  Title,
  Badge,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconLeaf, IconX } from "@tabler/icons-react";
import { acceptInvite, declineInvite } from "../actions";

type InvitationData = {
  id: string;
  email: string;
  role: string;
  organizationName: string;
  inviterEmail: string;
  expiresAt: Date;
};

type Props =
  | { error: string; userEmail: string; invitation?: undefined }
  | { invitation: InvitationData; userEmail: string; error?: undefined };

const ROLE_COLORS: Record<string, string> = {
  owner: "violet",
  admin: "blue",
  member: "gray",
};

export function AcceptInviteView({ invitation, error, userEmail }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [action, setAction] = useState<"accept" | "decline" | null>(null);
  const [declined, setDeclined] = useState(false);

  const handleAccept = () => {
    if (!invitation) return;
    setAction("accept");
    startTransition(async () => {
      const result = await acceptInvite(invitation.id);
      if (result.success) {
        notifications.show({
          title: "Welcome!",
          message: `You've joined ${invitation.organizationName}.`,
          color: "teal",
          icon: <IconCheck size={16} />,
        });
        router.push("/dashboard");
      } else {
        notifications.show({ title: "Error", message: result.error, color: "red" });
        setAction(null);
      }
    });
  };

  const handleDecline = () => {
    if (!invitation) return;
    setAction("decline");
    startTransition(async () => {
      const result = await declineInvite(invitation.id);
      if (result.success) {
        setDeclined(true);
      } else {
        notifications.show({ title: "Error", message: result.error, color: "red" });
        setAction(null);
      }
    });
  };

  return (
    <Center mih="100vh" px="md" style={{ background: "var(--elmi-content-bg, #f8f9fa)" }}>
      <Card shadow="md" padding="xl" radius="md" w={{ base: "100%", xs: 420 }} withBorder>
        <Stack gap="lg">
          {/* Wordmark */}
          <Group gap={8} justify="center">
            <Box
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: "linear-gradient(135deg, #2f9e44 0%, #1e7e34 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconLeaf size={15} color="white" stroke={2} />
            </Box>
            <Text
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: "-0.5px",
                color: "#1a1a1a",
                lineHeight: 1,
              }}
            >
              elmi
            </Text>
          </Group>

          {error ? (
            <Stack gap="sm" align="center">
              <Box
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "var(--mantine-color-red-0)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <IconX size={24} color="var(--mantine-color-red-6)" />
              </Box>
              <Title order={3} ta="center">Invitation unavailable</Title>
              <Text size="sm" c="dimmed" ta="center">{error}</Text>
              <Button
                variant="subtle"
                color="gray"
                mt="xs"
                onClick={() => router.push("/dashboard")}
              >
                Go to dashboard
              </Button>
            </Stack>
          ) : declined ? (
            <Stack gap="sm" align="center">
              <Title order={3} ta="center">Invitation declined</Title>
              <Text size="sm" c="dimmed" ta="center">
                You have declined the invitation to join {invitation!.organizationName}.
              </Text>
              <Button
                variant="subtle"
                color="gray"
                mt="xs"
                onClick={() => router.push("/dashboard")}
              >
                Go to dashboard
              </Button>
            </Stack>
          ) : (
            <>
              <Stack gap={4} align="center">
                <Title order={3} ta="center">You&apos;re invited!</Title>
                <Text size="sm" c="dimmed" ta="center">
                  {invitation!.inviterEmail} has invited you to join
                </Text>
                <Text fw={600} size="lg" ta="center">{invitation!.organizationName}</Text>
              </Stack>

              <Stack gap="xs">
                <Group gap="sm">
                  <Text size="sm" c="dimmed" style={{ width: 80 }}>Invited as</Text>
                  <Badge
                    color={ROLE_COLORS[invitation!.role] ?? "gray"}
                    variant="light"
                    size="sm"
                  >
                    {invitation!.role}
                  </Badge>
                </Group>
                <Group gap="sm">
                  <Text size="sm" c="dimmed" style={{ width: 80 }}>Your email</Text>
                  <Text size="sm">{userEmail}</Text>
                </Group>
              </Stack>

              <Group grow>
                <Button
                  variant="subtle"
                  color="gray"
                  loading={isPending && action === "decline"}
                  disabled={isPending && action === "accept"}
                  onClick={handleDecline}
                >
                  Decline
                </Button>
                <Button
                  color="teal"
                  loading={isPending && action === "accept"}
                  disabled={isPending && action === "decline"}
                  onClick={handleAccept}
                >
                  Accept invitation
                </Button>
              </Group>
            </>
          )}
        </Stack>
      </Card>
    </Center>
  );
}
