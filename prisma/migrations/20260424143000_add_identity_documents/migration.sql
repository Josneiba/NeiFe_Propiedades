-- CreateEnum
CREATE TYPE "DocumentCountry" AS ENUM ('CL', 'AR', 'PE', 'CO', 'MX', 'US', 'ES', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('RUT', 'DNI', 'CEDULA', 'PASSPORT', 'RFC', 'CURP', 'NIF_NIE', 'OTHER');

-- AlterTable
ALTER TABLE "User"
ADD COLUMN "documentCountry" "DocumentCountry",
ADD COLUMN "documentType" "DocumentType",
ADD COLUMN "documentNumber" TEXT,
ADD COLUMN "documentNumberNormalized" TEXT;

-- Backfill legacy Chilean RUT values into the new identity fields.
UPDATE "User"
SET
  "documentCountry" = 'CL',
  "documentType" = 'RUT',
  "documentNumber" = "rut",
  "documentNumberNormalized" = "rut"
WHERE "rut" IS NOT NULL
  AND "documentCountry" IS NULL
  AND "documentType" IS NULL
  AND "documentNumberNormalized" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_documentCountry_documentType_documentNumberNormalized_key"
ON "User"("documentCountry", "documentType", "documentNumberNormalized");
