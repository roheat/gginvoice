/*
  Warnings:

  - You are about to drop the column `salesTaxName` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `salesTaxRate` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `secondTaxName` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `secondTaxRate` on the `Invoice` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Invoice" DROP COLUMN "salesTaxName",
DROP COLUMN "salesTaxRate",
DROP COLUMN "secondTaxName",
DROP COLUMN "secondTaxRate",
ADD COLUMN     "tax" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."User" ALTER COLUMN "trialEnds" SET DEFAULT NOW() + INTERVAL '14 days';
