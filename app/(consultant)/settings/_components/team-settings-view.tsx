"use client";

import { useState, useTransition } from "react";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Modal,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconCheck,
  IconMail,
  IconPlus,
  IconTrash,
  IconUsers,
  IconX,
} from "@tabler/icons-react";
import { inviteTeamMember, removeMember, cancelInvitation } from "../actions";

// ─── Types ────────────────────────────────────────────────────────────────────

type MemberRow = {
  id: string;
  userId: string;
  role: string;
  createdAt: Date;
  user: { id: string; name: string; email: string; image?: string | null };
};

type InvitationRow = {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: Date;
  createdAt: Date;
};

type Props = {
  currentUserId: string;
  currentUserRole: string;
  members: MemberRow[];
  invitations: InvitationRow[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, string> = {
  owner: "violet",
  admin: "blue",
  member: "gray",
};

function roleBadge(role: string) {
  return (
    <Badge size="xs" color={ROLE_COLORS[role] ?? "gray"} variant="light">
      {role}
    </Badge>
  );
}

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Remove confirm modal ─────────────────────────────────────────────────────

function RemoveMemberModal({
  member,
  opened,
  onClose,
}: {
  member: MemberRow | null;
  opened: boolean;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  const handleRemove = () => {
    if (!member) return;
    startTransition(async () => {
      const result = await removeMember(member.id);
      if (result.success) {
        notifications.show({
          title: "Member removed",
          message: `${member.user.name || member.user.email} has been removed.`,
          color: "orange",
        });
        onClose();
      } else {
        notifications.show({ title: "Error", message: result.error, color: "red" });
      }
    });
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Remove member?" centered size="sm">
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Remove <strong>{member?.user.name || member?.user.email}</strong> from the organization?
          They will lose access immediately.
        </Text>
        <Group justify="flex-end">
          <Button variant="subtle" color="gray" onClick={onClose}>Cancel</Button>
          <Button color="red" loading={isPending} onClick={handleRemove}>Remove member</Button>
        </Group>
      </Stack>
    </Modal>
  );
}

// ─── Invite form modal ────────────────────────────────────────────────────────

function InviteModal({
  opened,
  onClose,
}: {
  opened: boolean;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<{ email: string; role: "member" | "admin" }>({
    initialValues: { email: "", role: "member" },
    validate: {
      email: (v) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? null : "Invalid email address",
    },
  });

  const handleSubmit = form.onSubmit((values) => {
    startTransition(async () => {
      const result = await inviteTeamMember(values.email.trim(), values.role);
      if (result.success) {
        notifications.show({
          title: "Invitation sent",
          message: `An invitation has been sent to ${values.email}.`,
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
    <Modal opened={opened} onClose={onClose} title="Invite team member" centered>
      <form onSubmit={handleSubmit}>
        <Stack gap="sm">
          <TextInput
            label="Email address"
            placeholder="colleague@consultancy.com"
            leftSection={<IconMail size={14} />}
            required
            {...form.getInputProps("email")}
          />
          <Select
            label="Role"
            data={[
              { value: "member", label: "Member" },
              { value: "admin", label: "Admin" },
            ]}
            {...form.getInputProps("role")}
          />
          <Group justify="flex-end" mt="xs">
            <Button variant="subtle" color="gray" onClick={onClose}>Cancel</Button>
            <Button type="submit" color="teal" loading={isPending}>
              Send invitation
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

export function TeamSettingsView({
  currentUserId,
  currentUserRole,
  members,
  invitations,
}: Props) {
  const [inviteOpen, { open: openInvite, close: closeInvite }] = useDisclosure(false);
  const [removeOpen, { open: openRemove, close: closeRemove }] = useDisclosure(false);
  const [removeTarget, setRemoveTarget] = useState<MemberRow | null>(null);
  const [cancelPending, startCancelTransition] = useTransition();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const isAdminOrOwner = currentUserRole === "owner" || currentUserRole === "admin";

  const handleOpenRemove = (m: MemberRow) => {
    setRemoveTarget(m);
    openRemove();
  };

  const handleCancelInvitation = (id: string) => {
    setCancellingId(id);
    startCancelTransition(async () => {
      const result = await cancelInvitation(id);
      if (result.success) {
        notifications.show({
          title: "Invitation cancelled",
          message: "The invitation has been cancelled.",
          color: "orange",
        });
      } else {
        notifications.show({ title: "Error", message: result.error, color: "red" });
      }
      setCancellingId(null);
    });
  };

  const pendingInvitations = invitations.filter((i) => i.status === "pending");

  return (
    <>
      <Box style={{ padding: "32px 40px 40px" }}>
        {/* Page header */}
        <Group justify="space-between" align="flex-start" mb="xl" wrap="nowrap">
          <Box>
            <Text style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.4px", lineHeight: 1.2 }}>
              Team
            </Text>
            <Text size="sm" c="dimmed" mt={4}>
              {members.length} member{members.length !== 1 ? "s" : ""}
              {pendingInvitations.length > 0 && (
                <> · {pendingInvitations.length} pending invitation{pendingInvitations.length !== 1 ? "s" : ""}</>
              )}
            </Text>
          </Box>
          {isAdminOrOwner && (
            <Button
              color="teal"
              leftSection={<IconPlus size={14} />}
              onClick={openInvite}
            >
              Invite member
            </Button>
          )}
        </Group>

        {/* Members table */}
        <Text size="xs" c="dimmed" fw={600} tt="uppercase" style={{ letterSpacing: "0.06em" }} mb="xs">
          Members
        </Text>
        {members.length === 0 ? (
          <Box
            style={{
              textAlign: "center",
              padding: "60px 24px",
              background: "white",
              borderRadius: 10,
              border: "1px solid var(--mantine-color-gray-2)",
            }}
          >
            <IconUsers size={32} color="var(--mantine-color-gray-3)" style={{ marginBottom: 12 }} />
            <Text size="sm" c="dimmed">No members yet.</Text>
          </Box>
        ) : (
          <Box
            style={{
              background: "white",
              borderRadius: 10,
              border: "1px solid var(--mantine-color-gray-2)",
              overflow: "hidden",
              marginBottom: 32,
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
                  <Table.Th>Member</Table.Th>
                  <Table.Th>Role</Table.Th>
                  <Table.Th>Joined</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {members.map((m) => {
                  const isSelf = m.userId === currentUserId;
                  return (
                    <Table.Tr key={m.id}>
                      <Table.Td>
                        <Box>
                          <Text size="sm" fw={500}>{m.user.name || "—"}</Text>
                          <Text size="xs" c="dimmed">{m.user.email}</Text>
                        </Box>
                      </Table.Td>
                      <Table.Td>{roleBadge(m.role)}</Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">{formatDate(m.createdAt)}</Text>
                      </Table.Td>
                      <Table.Td>
                        {isAdminOrOwner && !isSelf && m.role !== "owner" && (
                          <Group gap={4} justify="flex-end">
                            <Tooltip label="Remove" withArrow>
                              <ActionIcon
                                size="sm"
                                variant="subtle"
                                color="red"
                                onClick={() => handleOpenRemove(m)}
                              >
                                <IconTrash size={14} />
                              </ActionIcon>
                            </Tooltip>
                          </Group>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Box>
        )}

        {/* Pending invitations */}
        {pendingInvitations.length > 0 && (
          <>
            <Text size="xs" c="dimmed" fw={600} tt="uppercase" style={{ letterSpacing: "0.06em" }} mb="xs">
              Pending invitations
            </Text>
            <Box
              style={{
                background: "white",
                borderRadius: 10,
                border: "1px solid var(--mantine-color-gray-2)",
                overflow: "hidden",
              }}
            >
              <Table
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
                    <Table.Th>Email</Table.Th>
                    <Table.Th>Role</Table.Th>
                    <Table.Th>Expires</Table.Th>
                    <Table.Th />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {pendingInvitations.map((inv) => (
                    <Table.Tr key={inv.id}>
                      <Table.Td>
                        <Text size="sm">{inv.email}</Text>
                      </Table.Td>
                      <Table.Td>{roleBadge(inv.role)}</Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">{formatDate(inv.expiresAt)}</Text>
                      </Table.Td>
                      <Table.Td>
                        {isAdminOrOwner && (
                          <Group gap={4} justify="flex-end">
                            <Tooltip label="Cancel invitation" withArrow>
                              <ActionIcon
                                size="sm"
                                variant="subtle"
                                color="gray"
                                loading={cancelPending && cancellingId === inv.id}
                                onClick={() => handleCancelInvitation(inv.id)}
                              >
                                <IconX size={14} />
                              </ActionIcon>
                            </Tooltip>
                          </Group>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Box>
          </>
        )}
      </Box>

      <InviteModal opened={inviteOpen} onClose={closeInvite} />
      <RemoveMemberModal
        member={removeTarget}
        opened={removeOpen}
        onClose={closeRemove}
      />
    </>
  );
}
