"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";

type ActionResult = { success: true } | { success: false; error: string };

export async function acceptInvite(invitationId: string): Promise<ActionResult> {
  try {
    await auth.api.acceptInvitation({
      body: { invitationId },
      headers: await headers(),
    });
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to accept invitation",
    };
  }
}

export async function declineInvite(invitationId: string): Promise<ActionResult> {
  try {
    await auth.api.rejectInvitation({
      body: { invitationId },
      headers: await headers(),
    });
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to decline invitation",
    };
  }
}
