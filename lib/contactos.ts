import { prisma } from '@/lib/prisma'

/**
 * Legacy Contacts Module - Stubbed for schema compatibility
 * TODO: Reimplement if needed with proper CRM/Lead models
 */

export type ContactType = 'OWNER' | 'TENANT' | 'BUYER' | 'INVESTOR' | 'PROSPECT_OWNER'

export type UnifiedContact = {
  id: string
  publicId: string
  type: ContactType
  tag: string
  name: string
  email: string | null
  phone: string | null
  status: string
  priority: string
  nextFollowUpAt: string | null
  createdAt: string
  linkedProperties: Array<{
    opportunityId: string
    opportunityPublicId: string
    propertyId: string | null
    propertyPublicId: string | null
    propertyName: string | null
    propertyCommune: string | null
    stage: string
    stageLabel: string
    attachmentStatus: string
  }>
}

export async function getUnifiedContacts(brokerId: string): Promise<UnifiedContact[]> {
  return []
}

export async function getContactHistory(leadId: string) {
  return null
}

export async function getOwnerHistory(userId: string) {
  return null
}
