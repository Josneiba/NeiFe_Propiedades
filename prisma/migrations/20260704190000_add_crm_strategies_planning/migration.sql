ALTER TYPE "CrmSavedViewEntity" ADD VALUE IF NOT EXISTS 'DEALS';

CREATE TYPE "CrmStrategyType" AS ENUM (
  'CAPTACION_PROPIEDADES',
  'GENERACION_LEADS',
  'MARKETING',
  'REFERIDOS',
  'REACTIVACION',
  'INVERSIONISTAS',
  'OPEN_HOUSE',
  'ALIANZAS'
);

CREATE TABLE "CrmStrategy" (
  "id" TEXT NOT NULL,
  "brokerId" TEXT NOT NULL,
  "type" "CrmStrategyType" NOT NULL,
  "name" TEXT NOT NULL,
  "goalDescription" TEXT,
  "targetNumber" INTEGER,
  "expectedConversion" DOUBLE PRECISION,
  "week" INTEGER NOT NULL,
  "year" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CrmStrategy_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CrmStrategyActivity" (
  "id" TEXT NOT NULL,
  "strategyId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "ownerId" TEXT,
  "dueDate" TIMESTAMP(3),
  "taskId" TEXT,
  "isCompleted" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CrmStrategyActivity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CrmStrategy_brokerId_week_year_idx" ON "CrmStrategy"("brokerId", "week", "year");
CREATE INDEX "CrmStrategyActivity_strategyId_idx" ON "CrmStrategyActivity"("strategyId");
CREATE INDEX "CrmStrategyActivity_ownerId_idx" ON "CrmStrategyActivity"("ownerId");
CREATE UNIQUE INDEX "CrmStrategyActivity_taskId_key" ON "CrmStrategyActivity"("taskId");

ALTER TABLE "CrmStrategy"
  ADD CONSTRAINT "CrmStrategy_brokerId_fkey"
  FOREIGN KEY ("brokerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "CrmStrategyActivity"
  ADD CONSTRAINT "CrmStrategyActivity_strategyId_fkey"
  FOREIGN KEY ("strategyId") REFERENCES "CrmStrategy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CrmStrategyActivity"
  ADD CONSTRAINT "CrmStrategyActivity_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
