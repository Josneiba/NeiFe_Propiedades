-- CreateTable
CREATE TABLE "RentAdjustment" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "previousCLP" INTEGER NOT NULL,
    "newCLP" INTEGER NOT NULL,
    "previousUF" DOUBLE PRECISION,
    "newUF" DOUBLE PRECISION,
    "reason" TEXT NOT NULL,
    "ipcRate" DOUBLE PRECISION,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RentAdjustment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RentAdjustment" ADD CONSTRAINT "RentAdjustment_propertyId_fkey"
FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
