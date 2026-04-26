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

export function logUnauthorizedAccess(
  userId: string,
  role: string,
  pathname: string
) {
  console.warn(
    `[SECURITY] Unauthorized access attempt by user ${userId} (${role}) to ${pathname}`
  )
}
