"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  AppShell,
  Box,
  Burger,
  Group,
  NavLink,
  Stack,
  Text,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconLayoutDashboard,
  IconFileExport,
  IconLogout,
  IconLeaf,
} from "@tabler/icons-react";
import { authClient } from "@/lib/auth-client";

type User = { name: string | null; email: string };

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: IconLayoutDashboard },
  { label: "Export", href: "/export", icon: IconFileExport },
];

export function ConsultantShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: User;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileNavOpen, { toggle: toggleMobileNav, close: closeMobileNav }] =
    useDisclosure(false);

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/sign-in");
  };

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email[0].toUpperCase();

  return (
    <AppShell
      navbar={{
        width: 220,
        breakpoint: "sm",
        collapsed: { mobile: !mobileNavOpen },
      }}
      header={{ height: 56, offset: true }}
      padding={0}
    >
      {/* Mobile-only header with burger */}
      <AppShell.Header hiddenFrom="sm" style={{ background: "var(--elmi-sidebar-bg)", borderBottom: "1px solid var(--elmi-sidebar-border)" }}>
        <Group h="100%" px="md" justify="space-between">
          <Group gap={8}>
            <Box
              style={{
                width: 24,
                height: 24,
                borderRadius: 5,
                background: "linear-gradient(135deg, var(--elmi-sidebar-accent) 0%, var(--elmi-sidebar-accent-dark) 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconLeaf size={13} color="white" stroke={2} />
            </Box>
            <Text
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: 17,
                fontWeight: 700,
                letterSpacing: "-0.5px",
                color: "var(--elmi-sidebar-text-active)",
                lineHeight: 1,
              }}
            >
              elmi
            </Text>
          </Group>
          <Burger
            opened={mobileNavOpen}
            onClick={toggleMobileNav}
            color="var(--elmi-sidebar-text)"
            size="sm"
          />
        </Group>
      </AppShell.Header>

      <AppShell.Navbar
        style={{
          background: "var(--elmi-sidebar-bg)",
          borderRight: "1px solid var(--elmi-sidebar-border)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Wordmark — desktop only (mobile uses the header) */}
        <Box
          visibleFrom="sm"
          style={{
            padding: "24px 20px 20px",
            borderBottom: "1px solid var(--elmi-sidebar-border)",
          }}
        >
          <Group gap={8} align="center">
            <Box
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background:
                  "linear-gradient(135deg, var(--elmi-sidebar-accent) 0%, var(--elmi-sidebar-accent-dark) 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
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
                color: "var(--elmi-sidebar-text-active)",
                lineHeight: 1,
              }}
            >
              elmi
            </Text>
          </Group>
        </Box>

        {/* Navigation */}
        <Stack gap={2} style={{ padding: "12px 8px", flex: 1 }}>
          <Text
            size="xs"
            style={{
              color: "var(--elmi-sidebar-text-muted)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontWeight: 600,
              padding: "8px 12px 4px",
              fontSize: 10,
            }}
          >
            Workspace
          </Text>

          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <NavLink
                key={href}
                component={Link}
                href={href}
                label={label}
                onClick={closeMobileNav}
                leftSection={
                  <Icon
                    size={16}
                    stroke={active ? 2 : 1.5}
                    color={
                      active
                        ? "var(--elmi-sidebar-accent)"
                        : "var(--elmi-sidebar-text)"
                    }
                  />
                }
                active={active}
                style={{
                  borderRadius: 6,
                  padding: "8px 12px",
                  color: active
                    ? "var(--elmi-sidebar-text-active)"
                    : "var(--elmi-sidebar-text)",
                  background: active
                    ? "var(--elmi-sidebar-accent-bg)"
                    : "transparent",
                  borderLeft: active
                    ? "2px solid var(--elmi-sidebar-accent)"
                    : "2px solid transparent",
                  fontWeight: active ? 500 : 400,
                  fontSize: 14,
                  transition: "all 120ms ease",
                }}
                styles={{
                  label: {
                    color: active
                      ? "var(--elmi-sidebar-text-active)"
                      : "var(--elmi-sidebar-text)",
                    fontWeight: active ? 500 : 400,
                  },
                }}
              />
            );
          })}
        </Stack>

        {/* User area */}
        <Box
          style={{
            padding: "12px 8px",
            borderTop: "1px solid var(--elmi-sidebar-border)",
          }}
        >
          <Group gap={10} style={{ padding: "6px 12px" }} wrap="nowrap">
            {/* Avatar */}
            <Box
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg, var(--elmi-sidebar-avatar-bg-start) 0%, var(--elmi-sidebar-avatar-bg-end) 100%)",
                border: "1px solid var(--elmi-sidebar-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--elmi-sidebar-text)",
                  letterSpacing: "0.02em",
                }}
              >
                {initials}
              </Text>
            </Box>

            {/* Name + email */}
            <Box style={{ flex: 1, minWidth: 0 }}>
              {user.name && (
                <Text
                  size="xs"
                  style={{
                    color: "var(--elmi-sidebar-text-name)",
                    fontWeight: 500,
                    lineHeight: 1.2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user.name}
                </Text>
              )}
              <Text
                size="xs"
                style={{
                  color: "var(--elmi-sidebar-text-muted)",
                  lineHeight: 1.2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontSize: 11,
                }}
              >
                {user.email}
              </Text>
            </Box>

            {/* Sign out */}
            <Tooltip label="Sign out" position="right" withArrow>
              <UnstyledButton
                onClick={handleSignOut}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 44,
                  height: 44,
                  borderRadius: 6,
                  color: "var(--elmi-sidebar-text-muted)",
                  flexShrink: 0,
                  transition: "color 120ms ease, background 120ms ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color =
                    "var(--elmi-sidebar-danger)";
                  (e.currentTarget as HTMLElement).style.background =
                    "var(--elmi-sidebar-danger-bg)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color =
                    "var(--elmi-sidebar-text-muted)";
                  (e.currentTarget as HTMLElement).style.background =
                    "transparent";
                }}
              >
                <IconLogout size={15} stroke={1.5} />
              </UnstyledButton>
            </Tooltip>
          </Group>
        </Box>
      </AppShell.Navbar>

      <AppShell.Main
        style={{
          background: "var(--elmi-content-bg)",
          minHeight: "100vh",
        }}
      >
        {children}
      </AppShell.Main>
    </AppShell>
  );
}
