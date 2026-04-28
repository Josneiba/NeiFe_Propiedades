ALTER TABLE "Mandate"
ADD COLUMN "documentNumber" TEXT,
ADD COLUMN "documentHash" TEXT,
ADD COLUMN "documentGeneratedAt" TIMESTAMP(3),
ADD COLUMN "documentSnapshot" JSONB;
