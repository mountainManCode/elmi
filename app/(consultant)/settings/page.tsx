// Team Settings — Server Component
// Lists org members and pending invitations; allows owner/admin to invite/remove.

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getUserDb } from "@/lib/db";
import { auth } from "@/lib/auth";
import { TeamSettingsView } from "./_components/team-settings-view";

export default async function SettingsPage() {
  const hdrs = await headers();

  const session = await auth.api.getSession({ headers: hdrs });
  if (!session) redirect("/sign-in");

  const db = await getUserDb();
  const org = await db.organization.findFirst();
  if (!org) redirect("/dashboard");

  const [membersResult, invitationsResult, activeMember] = await Promise.all([
    auth.api.listMembers({
      query: { organizationId: org.id },
      headers: hdrs,
    }),
    auth.api.listInvitations({
      query: { organizationId: org.id },
      headers: hdrs,
    }),
    auth.api.getActiveMember({ headers: hdrs }),
  ]);

  const members = membersResult?.members ?? [];
  const invitations = invitationsResult ?? [];

  return (
    <TeamSettingsView
      currentUserId={session.user.id}
      currentUserRole={activeMember?.role ?? "member"}
      members={members}
      invitations={invitations}
    />
  );
}
