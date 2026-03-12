-- CreateTable
CREATE TABLE "validation_result" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "extractionResultId" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "overallAgreement" DOUBLE PRECISION NOT NULL,
    "modelId" TEXT NOT NULL,
    "validatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "validation_result_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "validation_result_documentId_key" ON "validation_result"("documentId");

-- AddForeignKey
ALTER TABLE "validation_result" ADD CONSTRAINT "validation_result_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
