-- AlterTable
-- Add quantity column back to InvoiceItem with default value of 1
ALTER TABLE "InvoiceItem" ADD COLUMN "quantity" INTEGER NOT NULL DEFAULT 1;

