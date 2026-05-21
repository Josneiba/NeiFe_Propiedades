-- CreateEnum
CREATE TYPE "BrokerPropertyCreationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "BrokerPropertyCreationRequest" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "landlordId" TEXT NOT NULL,
    "status" "BrokerPropertyCreationStatus" NOT NULL DEFAULT 'PENDING',
    "ownerName" TEXT,
    "ownerEmail" TEXT NOT NULL,
    "notes" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrokerPropertyCreationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BrokerPropertyCreationRequest_brokerId_status_idx" ON "BrokerPropertyCreationRequest"("brokerId", "status");

-- CreateIndex
CREATE INDEX "BrokerPropertyCreationRequest_landlordId_status_idx" ON "BrokerPropertyCreationRequest"("landlordId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "BrokerPropertyCreationRequest_propertyId_key" ON "BrokerPropertyCreationRequest"("propertyId");

-- AddForeignKey
ALTER TABLE "BrokerPropertyCreationRequest" ADD CONSTRAINT "BrokerPropertyCreationRequest_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrokerPropertyCreationRequest" ADD CONSTRAINT "BrokerPropertyCreationRequest_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrokerPropertyCreationRequest" ADD CONSTRAINT "BrokerPropertyCreationRequest_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
