-- CreateEnum
CREATE TYPE "BrokerStatementStatus" AS ENUM ('DRAFT', 'SENT');

-- CreateEnum
CREATE TYPE "BrokerStatementItemType" AS ENUM ('COMMISSION', 'MAINTENANCE', 'DEDUCTION');

-- CreateEnum
CREATE TYPE "BrokerMessageType" AS ENUM ('GENERAL', 'PAYMENT_REMINDER', 'MAINTENANCE_VISIT', 'CONTRACT_NOTICE');

-- CreateTable
CREATE TABLE "BrokerStatement" (
    "id" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "landlordId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "grossIncomeCLP" INTEGER NOT NULL,
    "brokerCommissionCLP" INTEGER NOT NULL,
    "maintenanceCLP" INTEGER NOT NULL DEFAULT 0,
    "otherDeductionsCLP" INTEGER NOT NULL DEFAULT 0,
    "netTransferCLP" INTEGER NOT NULL,
    "notes" TEXT,
    "transferReference" TEXT,
    "transferDate" TIMESTAMP(3),
    "status" "BrokerStatementStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrokerStatement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrokerStatementItem" (
    "id" TEXT NOT NULL,
    "statementId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amountCLP" INTEGER NOT NULL,
    "type" "BrokerStatementItemType" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrokerStatementItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrokerMessage" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" "BrokerMessageType" NOT NULL DEFAULT 'GENERAL',
    "sendEmail" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrokerMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BrokerStatement_propertyId_month_year_key" ON "BrokerStatement"("propertyId", "month", "year");

-- AddForeignKey
ALTER TABLE "BrokerStatement" ADD CONSTRAINT "BrokerStatement_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrokerStatement" ADD CONSTRAINT "BrokerStatement_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrokerStatement" ADD CONSTRAINT "BrokerStatement_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrokerStatementItem" ADD CONSTRAINT "BrokerStatementItem_statementId_fkey" FOREIGN KEY ("statementId") REFERENCES "BrokerStatement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrokerMessage" ADD CONSTRAINT "BrokerMessage_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrokerMessage" ADD CONSTRAINT "BrokerMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrokerMessage" ADD CONSTRAINT "BrokerMessage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
