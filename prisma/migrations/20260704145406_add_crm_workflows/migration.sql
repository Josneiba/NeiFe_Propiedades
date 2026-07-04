-- CreateEnum
CREATE TYPE "CrmWorkflowType" AS ENUM ('ARRIENDO', 'VENTA', 'ADMINISTRACION', 'CAPTACION', 'RENOVACION', 'COBRANZA', 'OTRO');

-- CreateEnum
CREATE TYPE "CrmSavedViewEntity" AS ENUM ('CONTACTS', 'PROPERTIES', 'MANDATES', 'PAYMENTS', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "GoalPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "GoalMetric" AS ENUM ('CONTACTS', 'VISITS', 'DEALS_CLOSED', 'COMMISSION_CLP', 'MANDATES', 'PROPERTIES_PUBLISHED');

-- CreateEnum
CREATE TYPE "CrmTaskType" AS ENUM ('LLAMADA', 'WHATSAPP', 'EMAIL', 'VISITA', 'REUNION', 'DOCUMENTO', 'SEGUIMIENTO', 'OTRO');

-- CreateEnum
CREATE TYPE "CrmChannel" AS ENUM ('TELEFONO', 'WHATSAPP', 'EMAIL', 'PRESENCIAL', 'VIDEO');

-- AlterTable
ALTER TABLE "CrmActivity" ADD COLUMN     "outcome" TEXT;

-- AlterTable
ALTER TABLE "CrmContact" ADD COLUMN     "preferredChannel" "CrmChannel";

-- AlterTable
ALTER TABLE "CrmDeal" ADD COLUMN     "landlordId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "dailyContactGoal" INTEGER NOT NULL DEFAULT 10;

-- CreateTable
CREATE TABLE "CrmWorkflow" (
    "id" TEXT NOT NULL,
    "brokerId" TEXT,
    "name" TEXT NOT NULL,
    "type" "CrmWorkflowType" NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmWorkflow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmWorkflowStage" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CrmWorkflowStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmWorkflowInstance" (
    "id" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "dealId" TEXT,
    "currentStageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmWorkflowInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmWorkflowInstanceStage" (
    "id" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "CrmWorkflowInstanceStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmSavedView" (
    "id" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "entity" "CrmSavedViewEntity" NOT NULL,
    "filters" JSONB NOT NULL,
    "sortBy" TEXT,
    "sortOrder" TEXT DEFAULT 'asc',
    "isStandard" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmSavedView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmTask" (
    "id" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "dealId" TEXT,
    "contactId" TEXT,
    "type" "CrmTaskType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "channel" "CrmChannel",
    "dueDate" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "isAutomatic" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmPlaybookStep" (
    "id" TEXT NOT NULL,
    "brokerId" TEXT,
    "stage" "CrmDealStage" NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "taskType" "CrmTaskType" NOT NULL,
    "channel" "CrmChannel",
    "daysDue" INTEGER NOT NULL DEFAULT 1,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrmPlaybookStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmPlaybookCompletion" (
    "id" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "CrmPlaybookCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrmMessageTemplate" (
    "id" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel" "CrmChannel" NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "variables" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmMessageTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrokerGoal" (
    "id" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "period" "GoalPeriod" NOT NULL,
    "week" INTEGER,
    "month" INTEGER,
    "year" INTEGER NOT NULL,
    "metric" "GoalMetric" NOT NULL,
    "target" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'count',
    "commitment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrokerGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrokerWeekPlan" (
    "id" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "week" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "planText" TEXT,
    "workDays" JSONB NOT NULL DEFAULT '{}',
    "dailyCommitments" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrokerWeekPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CrmWorkflow_brokerId_type_idx" ON "CrmWorkflow"("brokerId", "type");

-- CreateIndex
CREATE INDEX "CrmWorkflowStage_workflowId_order_idx" ON "CrmWorkflowStage"("workflowId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "CrmWorkflowInstance_dealId_key" ON "CrmWorkflowInstance"("dealId");

-- CreateIndex
CREATE INDEX "CrmWorkflowInstance_workflowId_dealId_idx" ON "CrmWorkflowInstance"("workflowId", "dealId");

-- CreateIndex
CREATE UNIQUE INDEX "CrmWorkflowInstanceStage_instanceId_stageId_key" ON "CrmWorkflowInstanceStage"("instanceId", "stageId");

-- CreateIndex
CREATE INDEX "CrmSavedView_brokerId_entity_idx" ON "CrmSavedView"("brokerId", "entity");

-- CreateIndex
CREATE INDEX "CrmTask_brokerId_isCompleted_dueDate_idx" ON "CrmTask"("brokerId", "isCompleted", "dueDate");

-- CreateIndex
CREATE INDEX "CrmTask_dealId_idx" ON "CrmTask"("dealId");

-- CreateIndex
CREATE INDEX "CrmPlaybookStep_stage_order_idx" ON "CrmPlaybookStep"("stage", "order");

-- CreateIndex
CREATE UNIQUE INDEX "CrmPlaybookStep_stage_order_brokerId_key" ON "CrmPlaybookStep"("stage", "order", "brokerId");

-- CreateIndex
CREATE INDEX "CrmPlaybookCompletion_dealId_idx" ON "CrmPlaybookCompletion"("dealId");

-- CreateIndex
CREATE UNIQUE INDEX "CrmPlaybookCompletion_stepId_dealId_key" ON "CrmPlaybookCompletion"("stepId", "dealId");

-- CreateIndex
CREATE INDEX "CrmMessageTemplate_brokerId_channel_idx" ON "CrmMessageTemplate"("brokerId", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "CrmMessageTemplate_brokerId_name_key" ON "CrmMessageTemplate"("brokerId", "name");

-- CreateIndex
CREATE INDEX "BrokerGoal_brokerId_period_year_idx" ON "BrokerGoal"("brokerId", "period", "year");

-- CreateIndex
CREATE UNIQUE INDEX "BrokerGoal_brokerId_period_metric_week_month_year_key" ON "BrokerGoal"("brokerId", "period", "metric", "week", "month", "year");

-- CreateIndex
CREATE INDEX "BrokerWeekPlan_brokerId_year_idx" ON "BrokerWeekPlan"("brokerId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "BrokerWeekPlan_brokerId_week_year_key" ON "BrokerWeekPlan"("brokerId", "week", "year");

-- CreateIndex
CREATE INDEX "CrmDeal_landlordId_idx" ON "CrmDeal"("landlordId");

-- AddForeignKey
ALTER TABLE "CrmWorkflow" ADD CONSTRAINT "CrmWorkflow_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmWorkflowStage" ADD CONSTRAINT "CrmWorkflowStage_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "CrmWorkflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmWorkflowInstance" ADD CONSTRAINT "CrmWorkflowInstance_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "CrmWorkflow"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmWorkflowInstanceStage" ADD CONSTRAINT "CrmWorkflowInstanceStage_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "CrmWorkflowInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmWorkflowInstanceStage" ADD CONSTRAINT "CrmWorkflowInstanceStage_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "CrmWorkflowStage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmSavedView" ADD CONSTRAINT "CrmSavedView_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmDeal" ADD CONSTRAINT "CrmDeal_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmTask" ADD CONSTRAINT "CrmTask_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmTask" ADD CONSTRAINT "CrmTask_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "CrmDeal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmTask" ADD CONSTRAINT "CrmTask_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "CrmContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmPlaybookStep" ADD CONSTRAINT "CrmPlaybookStep_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmPlaybookCompletion" ADD CONSTRAINT "CrmPlaybookCompletion_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "CrmPlaybookStep"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmPlaybookCompletion" ADD CONSTRAINT "CrmPlaybookCompletion_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "CrmDeal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrmMessageTemplate" ADD CONSTRAINT "CrmMessageTemplate_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrokerGoal" ADD CONSTRAINT "BrokerGoal_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrokerWeekPlan" ADD CONSTRAINT "BrokerWeekPlan_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
