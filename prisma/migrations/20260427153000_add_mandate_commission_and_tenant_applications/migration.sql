ALTER TABLE "Property"
ADD COLUMN "applicationOpen" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "applicationSlug" TEXT;

ALTER TABLE "Mandate"
ADD COLUMN "commissionRate" DOUBLE PRECISION,
ADD COLUMN "commissionType" "CommissionType" DEFAULT 'MONTHLY';

CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'REVIEWING', 'APPROVED', 'REJECTED');

CREATE TABLE "TenantApplication" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "rut" TEXT NOT NULL,
    "monthlyIncome" INTEGER NOT NULL,
    "currentEmployer" TEXT,
    "message" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "documents" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantApplication_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Property_applicationSlug_key" ON "Property"("applicationSlug");

ALTER TABLE "TenantApplication"
ADD CONSTRAINT "TenantApplication_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
