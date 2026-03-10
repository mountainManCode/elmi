"use server";

import { getUserDb } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function approveDocument(documentId: string) {
  const db = await getUserDb();

  try {
    await db.document.update({
      where: { id: documentId },
      data: { status: "approved" },
    });
    revalidatePath("/dashboard");
    revalidatePath("/verification");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to approve document";
    return { success: false, error: message };
  }
}

export async function rejectDocument(documentId: string) {
  const db = await getUserDb();

  try {
    await db.document.update({
      where: { id: documentId },
      data: { status: "rejected" },
    });
    revalidatePath("/dashboard");
    revalidatePath("/verification");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to reject document";
    return { success: false, error: message };
  }
}
