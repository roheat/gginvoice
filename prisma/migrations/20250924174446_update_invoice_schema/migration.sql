/*
  Warnings:

  - You are about to drop the column `tax` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `InvoiceItem` table. All the data in the column will be lost.
  - You are about to drop the column `rate` on the `InvoiceItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Invoice" DROP COLUMN "tax",
ADD COLUMN     "salesTaxName" TEXT,
ADD COLUMN     "salesTaxRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "secondTaxName" TEXT,
ADD COLUMN     "secondTaxRate" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."InvoiceItem" DROP COLUMN "quantity",
DROP COLUMN "rate";

-- AlterTable
ALTER TABLE "public"."User" ALTER COLUMN "trialEnds" SET DEFAULT NOW() + INTERVAL '14 days';
