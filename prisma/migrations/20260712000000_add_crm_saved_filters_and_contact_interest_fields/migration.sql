-- AlterTable
ALTER TABLE "CrmContact"
ADD COLUMN "interestedCommune" TEXT,
  ADD COLUMN "interestedPropertyType" "CrmPropertyType",
  ADD COLUMN "budgetMin" DOUBLE PRECISION,
  ADD COLUMN "budgetMax" DOUBLE PRECISION;
-- CreateTable
CREATE TABLE "CrmSavedFilter" (
  "id" TEXT NOT NULL,
  "brokerId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "criteria" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CrmSavedFilter_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE INDEX "CrmSavedFilter_brokerId_idx" ON "CrmSavedFilter"("brokerId");
-- AddForeignKey
ALTER TABLE "CrmSavedFilter"
ADD CONSTRAINT "CrmSavedFilter_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;