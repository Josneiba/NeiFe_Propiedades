import { prisma } from '@/lib/prisma'

export async function logActivity(
  userId: string,
  action: string,
  description: string,
  propertyId?: string,
  metadata?: object
) {
  return prisma.activityLog.create({
    data: { userId, action, description, propertyId, metadata },
  })
}
