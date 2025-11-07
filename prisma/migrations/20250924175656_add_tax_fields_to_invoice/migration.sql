-- AlterTable
ALTER TABLE "public"."Invoice" ADD COLUMN     "tax1Name" TEXT,
ADD COLUMN     "tax1Rate" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "tax2Name" TEXT,
ADD COLUMN     "tax2Rate" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."User" ALTER COLUMN "trialEnds" SET DEFAULT NOW() + INTERVAL '14 days';
