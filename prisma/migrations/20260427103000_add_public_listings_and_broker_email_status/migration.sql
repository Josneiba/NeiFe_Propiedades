CREATE TYPE "EmailDeliveryStatus" AS ENUM ('NOT_REQUESTED', 'SENT', 'FAILED');

ALTER TABLE "Property"
ADD COLUMN "isPublished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "publishedAt" TIMESTAMP(3);

ALTER TABLE "BrokerMessage"
ADD COLUMN "emailStatus" "EmailDeliveryStatus" NOT NULL DEFAULT 'NOT_REQUESTED',
ADD COLUMN "emailProviderId" TEXT,
ADD COLUMN "emailError" TEXT;
