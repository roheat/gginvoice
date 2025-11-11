-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'SENT', 'PAID', 'REFUNDED', 'OVERDUE');

-- AlterTable "Invoice"
-- First, add the new columns
ALTER TABLE "Invoice" 
  ADD COLUMN "deleted" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "refundedAt" TIMESTAMP(3),
  ADD COLUMN "paidVia" TEXT,
  ADD COLUMN "paymentRef" TEXT,
  ADD COLUMN "refundRef" TEXT;

-- Alter the status column from TEXT to enum
-- Step 1: Create a temporary column with the enum type
ALTER TABLE "Invoice" 
  ADD COLUMN "status_new" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT';

-- Step 2: Copy data from old status to new status, converting strings to enum values
UPDATE "Invoice" 
  SET "status_new" = CASE 
    WHEN "status" = 'DRAFT' THEN 'DRAFT'::text::"InvoiceStatus"
    WHEN "status" = 'SENT' THEN 'SENT'::text::"InvoiceStatus"
    WHEN "status" = 'PAID' THEN 'PAID'::text::"InvoiceStatus"
    WHEN "status" = 'REFUNDED' THEN 'REFUNDED'::text::"InvoiceStatus"
    WHEN "status" = 'OVERDUE' THEN 'OVERDUE'::text::"InvoiceStatus"
    ELSE 'DRAFT'::text::"InvoiceStatus"
  END
  WHERE "status" IS NOT NULL;

-- Step 3: Drop the old status column and rename the new one
ALTER TABLE "Invoice" DROP COLUMN "status";
ALTER TABLE "Invoice" RENAME COLUMN "status_new" TO "status";

-- CreateIndex for deleted flag (soft delete optimization)
CREATE INDEX "Invoice_deleted_idx" ON "Invoice"("id") WHERE "deleted" = false;

-- CreateTable "InvoiceEvent" for audit logging
CREATE TABLE "InvoiceEvent" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "actorId" TEXT,
    "ref" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex on InvoiceEvent
CREATE INDEX "InvoiceEvent_invoiceId_idx" ON "InvoiceEvent"("invoiceId");
CREATE INDEX "InvoiceEvent_createdAt_idx" ON "InvoiceEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "InvoiceEvent" ADD CONSTRAINT "InvoiceEvent_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

