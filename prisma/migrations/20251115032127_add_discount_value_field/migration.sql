-- AlterTable
ALTER TABLE "public"."Invoice" ADD COLUMN     "discountValue" DECIMAL(65,30) NOT NULL DEFAULT 0;
