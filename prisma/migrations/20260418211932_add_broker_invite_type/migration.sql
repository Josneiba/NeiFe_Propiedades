-- AlterEnum
ALTER TYPE "InvitationType" ADD VALUE 'BROKER_INVITE';

-- DropForeignKey
ALTER TABLE "Invitation" DROP CONSTRAINT "Invitation_propertyId_fkey";

-- AlterTable
ALTER TABLE "Invitation" ALTER COLUMN "propertyId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
