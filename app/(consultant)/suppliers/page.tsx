// Supplier Management — Server Component
// Lists all suppliers in the org with link and document counts.

import { redirect } from "next/navigation";
import { getUserDb } from "@/lib/db";
import { SuppliersView } from "./_components/suppliers-view";

export default async function SuppliersPage() {
  const db = await getUserDb();

  const org = await db.organization.findFirst();
  if (!org) redirect("/dashboard");

  const [suppliers, supplierLinks, documents] = await Promise.all([
    db.supplier.findMany({
      where: { organizationId: org.id },
      orderBy: { name: "asc" },
    }),
    db.supplierLink.findMany({
      where: { organizationId: org.id },
    }),
    db.document.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Compute stats per supplier
  const supplierStats = suppliers.map((s) => {
    const links = supplierLinks.filter((l) => l.supplierModelId === s.id);
    // Documents can match by supplierModelId-derived supplierId or legacy name
    const supplierNames = new Set([s.id, s.name, ...links.map((l) => l.supplierId)]);
    const docs = documents.filter((d) => supplierNames.has(d.supplierId));
    const approved = docs.filter((d) => d.status === "approved").length;
    return { ...s, linkCount: links.length, docCount: docs.length, approvedCount: approved };
  });

  return (
    <SuppliersView
      orgId={org.id}
      suppliers={supplierStats}
    />
  );
}
