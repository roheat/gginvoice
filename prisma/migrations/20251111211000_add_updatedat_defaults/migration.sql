-- Add default now() to updatedAt columns so Prisma doesn't require explicit values on create
ALTER TABLE "Client" ALTER COLUMN "updatedAt" SET DEFAULT NOW();
ALTER TABLE "Invoice" ALTER COLUMN "updatedAt" SET DEFAULT NOW();
ALTER TABLE "Payment" ALTER COLUMN "updatedAt" SET DEFAULT NOW();
ALTER TABLE "User" ALTER COLUMN "updatedAt" SET DEFAULT NOW();
ALTER TABLE "UserSettings" ALTER COLUMN "updatedAt" SET DEFAULT NOW();
