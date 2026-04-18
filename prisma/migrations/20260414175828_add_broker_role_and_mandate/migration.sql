-- CreateEnum
CREATE TYPE "MandateStatus" AS ENUM ('PENDING', 'ACTIVE', 'REVOKED', 'EXPIRED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'MANDATE_REQUESTED';
ALTER TYPE "NotificationType" ADD VALUE 'MANDATE_SIGNED';
ALTER TYPE "NotificationType" ADD VALUE 'MANDATE_REVOKED';

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'BROKER';

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "managedBy" TEXT;

-- CreateTable
CREATE TABLE "Mandate" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "status" "MandateStatus" NOT NULL DEFAULT 'PENDING',
    "signedByOwner" BOOLEAN NOT NULL DEFAULT false,
    "signedByBroker" BOOLEAN NOT NULL DEFAULT false,
    "ownerSignedAt" TIMESTAMP(3),
    "brokerSignedAt" TIMESTAMP(3),
    "startsAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mandate_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_managedBy_fkey" FOREIGN KEY ("managedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mandate" ADD CONSTRAINT "Mandate_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mandate" ADD CONSTRAINT "Mandate_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mandate" ADD CONSTRAINT "Mandate_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
