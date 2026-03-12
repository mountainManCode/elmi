"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getUserDb } from "@/lib/db";

type ActionResult = { success: true } | { success: false; error: string };

export async function inviteTeamMember(
  email: string,
  role: "member" | "admin"
): Promise<ActionResult> {
  try {
    const db = await getUserDb();
    const org = await db.organization.findFirst();
    if (!org) return { success: false, error: "Organization not found" };

    await auth.api.createInvitation({
      body: { email, role, organizationId: org.id },
      headers: await headers(),
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to send invitation",
    };
  }
}

export async function removeMember(memberId: string): Promise<ActionResult> {
  try {
    const db = await getUserDb();
    const org = await db.organization.findFirst();
    if (!org) return { success: false, error: "Organization not found" };

    await auth.api.removeMember({
      body: { memberIdOrEmail: memberId, organizationId: org.id },
      headers: await headers(),
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to remove member",
    };
  }
}

export async function cancelInvitation(
  invitationId: string
): Promise<ActionResult> {
  try {
    await auth.api.cancelInvitation({
      body: { invitationId },
      headers: await headers(),
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to cancel invitation",
    };
  }
}
