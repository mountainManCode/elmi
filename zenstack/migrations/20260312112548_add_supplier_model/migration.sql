-- AlterTable
ALTER TABLE "supplier_link" ADD COLUMN     "supplierModelId" TEXT;

-- CreateTable
CREATE TABLE "supplier" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "supplier" ADD CONSTRAINT "supplier_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_link" ADD CONSTRAINT "supplier_link_supplierModelId_fkey" FOREIGN KEY ("supplierModelId") REFERENCES "supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
