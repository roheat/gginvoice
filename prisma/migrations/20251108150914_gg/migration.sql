-- AlterTable
ALTER TABLE "User" ALTER COLUMN "trialEnds" SET DEFAULT NOW() + INTERVAL '14 days';
