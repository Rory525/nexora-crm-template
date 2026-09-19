-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "label" TEXT,
    "url" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Document_contactId_idx" ON "Document"("contactId");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
