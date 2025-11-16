-- DropIndex
DROP INDEX "Invoice_shareId_idx";

-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "shareId";

