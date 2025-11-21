-- AlterTable
ALTER TABLE "User" ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3);

-- Auto-complete onboarding for existing users who have:
-- 1. Company name set
UPDATE "User" u
SET "onboardingCompletedAt" = u."createdAt"
WHERE "onboardingCompletedAt" IS NULL
AND EXISTS (
  SELECT 1 FROM "UserSettings" us 
  WHERE us."userId" = u."id" 
  AND us."companyName" IS NOT NULL
  AND us."companyName" != ''
);

