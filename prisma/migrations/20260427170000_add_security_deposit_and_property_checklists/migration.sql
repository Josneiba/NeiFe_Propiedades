CREATE TYPE "DepositStatus" AS ENUM ('HELD', 'RETURNED_FULL', 'RETURNED_PARTIAL', 'FORFEITED');

CREATE TYPE "ChecklistType" AS ENUM ('CHECKIN', 'CHECKOUT');

CREATE TABLE "SecurityDeposit" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "amountCLP" INTEGER NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "receivedBy" TEXT NOT NULL,
    "status" "DepositStatus" NOT NULL DEFAULT 'HELD',
    "returnedAt" TIMESTAMP(3),
    "returnedAmountCLP" INTEGER,
    "deductionsCLP" INTEGER,
    "deductionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SecurityDeposit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PropertyChecklist" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "type" "ChecklistType" NOT NULL,
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT NOT NULL,
    "rooms" JSONB NOT NULL,
    "overallCondition" TEXT,
    "tenantSignature" TEXT,
    "landlordSignature" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyChecklist_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SecurityDeposit_propertyId_key" ON "SecurityDeposit"("propertyId");

ALTER TABLE "SecurityDeposit"
ADD CONSTRAINT "SecurityDeposit_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PropertyChecklist"
ADD CONSTRAINT "PropertyChecklist_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
