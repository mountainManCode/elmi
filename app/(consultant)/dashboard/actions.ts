"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getUserDb } from "@/lib/db";

type ActionResult = { success: true } | { success: false; error: string };

/** Create a new organization for the current user (makes them owner). */
export async function createOrg(name: string): Promise<ActionResult> {
  try {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .slice(0, 50);

    await auth.api.createOrganization({
      body: { name, slug },
      headers: await headers(),
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create organization",
    };
  }
}

/** Create a new project within the current user's organization. */
export async function createProject(
  orgId: string,
  name: string,
  description?: string
): Promise<ActionResult> {
  try {
    const db = await getUserDb();
    await db.project.create({
      data: { name, description: description || null, organizationId: orgId },
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create project",
    };
  }
}

/** Generate a supplier upload link for a project.
 *  If supplierModelId is provided, links to an existing Supplier.
 *  If createSupplierName is provided, creates a new Supplier first, then links to it.
 */
export async function createSupplierLink(
  projectId: string,
  supplierId: string,           // display name — used for document matching
  expiresInDays: number,
  maxUploads: number,
  supplierModelId?: string,     // FK to existing Supplier record
  createSupplierName?: string   // if set, creates a new Supplier first
): Promise<ActionResult> {
  try {
    const db = await getUserDb();
    const project = await db.project.findUnique({ where: { id: projectId } });
    if (!project) return { success: false, error: "Project not found" };

    let resolvedSupplierModelId = supplierModelId ?? null;

    // If creating a new supplier on the fly, insert the Supplier record first
    if (createSupplierName) {
      const newSupplier = await db.supplier.create({
        data: {
          organizationId: project.organizationId,
          name: createSupplierName.trim(),
        },
      });
      resolvedSupplierModelId = newSupplier.id;
    }

    await db.supplierLink.create({
      data: {
        projectId,
        organizationId: project.organizationId,
        supplierId,
        supplierModelId: resolvedSupplierModelId,
        expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000),
        maxUploads,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/suppliers");
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create supplier link",
    };
  }
}
