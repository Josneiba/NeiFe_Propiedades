-- CreateEnum
CREATE TYPE "CrmContactType" AS ENUM ('PROPIETARIO', 'ARRENDATARIO', 'INVERSIONISTA', 'LEAD');

-- CreateEnum
CREATE TYPE "CrmLeadSource" AS ENUM ('PORTAL', 'REFERIDO', 'RRSS', 'LLAMADA_DIRECTA', 'LETRERO', 'OTRO');

-- CreateEnum
CREATE TYPE "CrmPriority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "CrmContactStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'CONVERTED', 'LOST');

-- CreateEnum
CREATE TYPE "CrmPropertyType" AS ENUM ('DEPARTAMENTO', 'CASA', 'OFICINA', 'LOCAL_COMERCIAL', 'ESTACIONAMIENTO', 'OTRO');

-- CreateEnum
CREATE TYPE "CrmOperationType" AS ENUM ('ARRIENDO', 'VENTA', 'AMBOS');

-- CreateEnum
CREATE TYPE "CrmPropertyStatus" AS ENUM ('LEAD', 'CONTACTANDO', 'EN_EVALUACION', 'MANDATO_FIRMADO', 'PUBLICADA', 'RESERVADA', 'CONVERTIDA', 'PERDIDA');

-- CreateEnum
CREATE TYPE "CrmDealStage" AS ENUM ('NUEVO_LEAD', 'CONTACTO_INICIADO', 'VISITA_AGENDADA', 'PROPIEDAD_CAPTADA', 'PUBLICADA', 'MOSTRANDO', 'OFERTA_RECIBIDA', 'DOCS_REVISION', 'NEGOCIANDO', 'FIRMA_CONTRATO', 'ENTREGA_LLAVES', 'ADMINISTRAR');

-- CreateEnum
CREATE TYPE "CrmPhase" AS ENUM ('PRE_VENTA', 'VENTA', 'POST_VENTA');

-- CreateEnum
CREATE TYPE "CrmDealStatus" AS ENUM ('ACTIVE', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "CrmDealRole" AS ENUM ('PROPIETARIO', 'ARRENDATARIO', 'AVAL', 'OTRO');

-- CreateEnum
CREATE TYPE "CrmActivityType" AS ENUM ('LLAMADA', 'VISITA', 'EMAIL', 'WHATSAPP', 'REUNION', 'NOTA', 'TAREA', 'DOCUMENTO');

-- AlterTable
ALTER TABLE "BrokerMessage" ADD COLUMN     "isRead" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "CrmContact" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "CrmContactType" NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "rut" TEXT,
    "notes" TEXT,
    "source" "CrmLeadSource" NOT NULL,
    "priority" "CrmPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "CrmContactStatus" NOT NULL DEFAULT 'ACTIVE',
    "brokerId" TEXT NOT NULL,
    "neifeUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmProperty" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "commune" TEXT NOT NULL,
    "type" "CrmPropertyType" NOT NULL,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "sqMeters" DOUBLE PRECISION,
    "operationType" "CrmOperationType" NOT NULL,
    "askingPrice" DOUBLE PRECISION,
    "crmStatus" "CrmPropertyStatus" NOT NULL DEFAULT 'LEAD',
    "ownerId" TEXT,
    "brokerId" TEXT NOT NULL,
    "notes" TEXT,
    "neifePropertyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmProperty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmDeal" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "stage" "CrmDealStage" NOT NULL DEFAULT 'NUEVO_LEAD',
    "phase" "CrmPhase" NOT NULL DEFAULT 'PRE_VENTA',
    "operationType" "CrmOperationType" NOT NULL,
    "value" DOUBLE PRECISION,
    "commission" DOUBLE PRECISION,
    "brokerId" TEXT NOT NULL,
    "propertyId" TEXT,
    "status" "CrmDealStatus" NOT NULL DEFAULT 'ACTIVE',
    "lostReason" TEXT,
    "wonAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "notes" TEXT,
    "neifeContractId" TEXT,
    "estimatedValue" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmDeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmDealContact" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "role" "CrmDealRole" NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrmDealContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmActivity" (
    "id" TEXT NOT NULL,
    "type" "CrmActivityType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "brokerId" TEXT NOT NULL,
    "dealId" TEXT,
    "contactId" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrmActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmDealSequenceTemplate" (
    "id" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "actions" JSONB NOT NULL,
    "triggerType" TEXT NOT NULL DEFAULT 'MANUAL',
    "triggerStage" TEXT,
    "triggerCondition" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmDealSequenceTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmDealSequence" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "actions" JSONB NOT NULL,
    "startedAt" TIMESTAMP(3),
    "pausedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrmDealSequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmDealSequenceExecution" (
    "id" TEXT NOT NULL,
    "sequenceId" TEXT NOT NULL,
    "action" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "executedAt" TIMESTAMP(3),
    "result" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrmDealSequenceExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrokerIntegration" (
    "id" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "integationType" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "credentials" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrokerIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppMessage" (
    "id" TEXT NOT NULL,
    "dealId" TEXT,
    "contactId" TEXT,
    "brokerId" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "messageId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhatsAppMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsAppTemplate" (
    "id" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "variables" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmContactScore" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "lastActivityDays" INTEGER NOT NULL DEFAULT 0,
    "urgencyLevel" TEXT NOT NULL DEFAULT 'MEDIUM',
    "recommendation" TEXT,
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmContactScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmDealStageHistory" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "fromStage" "CrmDealStage",
    "toStage" "CrmDealStage" NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedBy" TEXT NOT NULL,

    CONSTRAINT "CrmDealStageHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmDealAttachment" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrmDealAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CrmContact_code_key" ON "CrmContact"("code");

-- CreateIndex
CREATE INDEX "CrmContact_brokerId_status_idx" ON "CrmContact"("brokerId", "status");

-- CreateIndex
CREATE INDEX "CrmContact_code_idx" ON "CrmContact"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CrmProperty_code_key" ON "CrmProperty"("code");

-- CreateIndex
CREATE INDEX "CrmProperty_brokerId_crmStatus_idx" ON "CrmProperty"("brokerId", "crmStatus");

-- CreateIndex
CREATE UNIQUE INDEX "CrmDeal_code_key" ON "CrmDeal"("code");

-- CreateIndex
CREATE INDEX "CrmDeal_brokerId_status_stage_idx" ON "CrmDeal"("brokerId", "status", "stage");

-- CreateIndex
CREATE UNIQUE INDEX "CrmDealContact_dealId_contactId_key" ON "CrmDealContact"("dealId", "contactId");

-- CreateIndex
CREATE INDEX "CrmActivity_brokerId_isDone_idx" ON "CrmActivity"("brokerId", "isDone");

-- CreateIndex
CREATE INDEX "CrmActivity_dealId_idx" ON "CrmActivity"("dealId");

-- CreateIndex
CREATE INDEX "CrmDealSequenceTemplate_brokerId_idx" ON "CrmDealSequenceTemplate"("brokerId");

-- CreateIndex
CREATE INDEX "CrmDealSequence_dealId_status_idx" ON "CrmDealSequence"("dealId", "status");

-- CreateIndex
CREATE INDEX "CrmDealSequenceExecution_sequenceId_status_scheduledFor_idx" ON "CrmDealSequenceExecution"("sequenceId", "status", "scheduledFor");

-- CreateIndex
CREATE INDEX "BrokerIntegration_brokerId_integationType_idx" ON "BrokerIntegration"("brokerId", "integationType");

-- CreateIndex
CREATE UNIQUE INDEX "BrokerIntegration_brokerId_integationType_key" ON "BrokerIntegration"("brokerId", "integationType");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_dealId_contactId_idx" ON "WhatsAppMessage"("dealId", "contactId");

-- CreateIndex
CREATE INDEX "WhatsAppMessage_brokerId_createdAt_idx" ON "WhatsAppMessage"("brokerId", "createdAt");

-- CreateIndex
CREATE INDEX "WhatsAppTemplate_brokerId_isActive_idx" ON "WhatsAppTemplate"("brokerId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppTemplate_brokerId_name_key" ON "WhatsAppTemplate"("brokerId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "CrmContactScore_contactId_key" ON "CrmContactScore"("contactId");

-- CreateIndex
CREATE INDEX "CrmDealStageHistory_dealId_idx" ON "CrmDealStageHistory"("dealId");

-- CreateIndex
CREATE INDEX "CrmDealAttachment_dealId_idx" ON "CrmDealAttachment"("dealId");

-- AddForeignKey
ALTER TABLE "CrmContact" ADD CONSTRAINT "CrmContact_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmProperty" ADD CONSTRAINT "CrmProperty_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "CrmContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmProperty" ADD CONSTRAINT "CrmProperty_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmDeal" ADD CONSTRAINT "CrmDeal_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmDeal" ADD CONSTRAINT "CrmDeal_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "CrmProperty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmDealContact" ADD CONSTRAINT "CrmDealContact_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "CrmDeal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmDealContact" ADD CONSTRAINT "CrmDealContact_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmActivity" ADD CONSTRAINT "CrmActivity_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmActivity" ADD CONSTRAINT "CrmActivity_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "CrmDeal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmActivity" ADD CONSTRAINT "CrmActivity_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmDealSequenceTemplate" ADD CONSTRAINT "CrmDealSequenceTemplate_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmDealSequence" ADD CONSTRAINT "CrmDealSequence_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "CrmDeal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmDealSequence" ADD CONSTRAINT "CrmDealSequence_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CrmDealSequenceTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmDealSequence" ADD CONSTRAINT "CrmDealSequence_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmDealSequenceExecution" ADD CONSTRAINT "CrmDealSequenceExecution_sequenceId_fkey" FOREIGN KEY ("sequenceId") REFERENCES "CrmDealSequence"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrokerIntegration" ADD CONSTRAINT "BrokerIntegration_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppMessage" ADD CONSTRAINT "WhatsAppMessage_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "CrmDeal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppMessage" ADD CONSTRAINT "WhatsAppMessage_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppMessage" ADD CONSTRAINT "WhatsAppMessage_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppTemplate" ADD CONSTRAINT "WhatsAppTemplate_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmContactScore" ADD CONSTRAINT "CrmContactScore_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmDealStageHistory" ADD CONSTRAINT "CrmDealStageHistory_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "CrmDeal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmDealStageHistory" ADD CONSTRAINT "CrmDealStageHistory_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmDealAttachment" ADD CONSTRAINT "CrmDealAttachment_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "CrmDeal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmDealAttachment" ADD CONSTRAINT "CrmDealAttachment_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
