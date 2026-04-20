-- CreateTable
CREATE TABLE "PropertyAccessRequest" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "landlordId" TEXT NOT NULL,
    "message" TEXT,
    "status" "PermissionStatus" NOT NULL DEFAULT 'PENDING',
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyAccessRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PropertyAccessRequest_propertyId_brokerId_key" ON "PropertyAccessRequest"("propertyId", "brokerId");

-- AddForeignKey
ALTER TABLE "PropertyAccessRequest" ADD CONSTRAINT "PropertyAccessRequest_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyAccessRequest" ADD CONSTRAINT "PropertyAccessRequest_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyAccessRequest" ADD CONSTRAINT "PropertyAccessRequest_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
