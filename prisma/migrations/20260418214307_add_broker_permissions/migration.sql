-- CreateEnum
CREATE TYPE "PermissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "BrokerPermission" (
    "id" TEXT NOT NULL,
    "landlordId" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "status" "PermissionStatus" NOT NULL DEFAULT 'PENDING',
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrokerPermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BrokerPermission_landlordId_brokerId_key" ON "BrokerPermission"("landlordId", "brokerId");

-- AddForeignKey
ALTER TABLE "BrokerPermission" ADD CONSTRAINT "BrokerPermission_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrokerPermission" ADD CONSTRAINT "BrokerPermission_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
