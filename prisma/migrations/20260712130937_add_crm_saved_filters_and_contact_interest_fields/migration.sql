-- AddForeignKey
ALTER TABLE "CrmWorkflowInstance" ADD CONSTRAINT "CrmWorkflowInstance_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "CrmDeal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
