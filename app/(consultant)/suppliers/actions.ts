"use server";

import { getUserDb } from "@/lib/db";
import { revalidatePath } from "next/cache";

type ActionResult = { success: true } | { success: false; error: string };

export async function createSupplier(
  orgId: string,
  name: string,
  email?: string,
  notes?: string
): Promise<ActionResult> {
  try {
    const db = await getUserDb();
    await db.supplier.create({
      data: {
        organizationId: orgId,
        name: name.trim(),
        email: email?.trim() || null,
        notes: notes?.trim() || null,
      },
    });
    revalidatePath("/suppliers");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create supplier",
    };
  }
}

export async function updateSupplier(
  supplierId: string,
  name: string,
  email?: string,
  notes?: string
): Promise<ActionResult> {
  try {
    const db = await getUserDb();
    await db.supplier.update({
      where: { id: supplierId },
      data: {
        name: name.trim(),
        email: email?.trim() || null,
        notes: notes?.trim() || null,
      },
    });
    revalidatePath("/suppliers");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update supplier",
    };
  }
}

export async function deleteSupplier(supplierId: string): Promise<ActionResult> {
  try {
    const db = await getUserDb();
    await db.supplier.delete({ where: { id: supplierId } });
    revalidatePath("/suppliers");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete supplier",
    };
  }
}
