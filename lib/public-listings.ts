import { prisma } from '@/lib/prisma'
import { isPrismaConnectionError, logPrismaConnectionWarning } from '@/lib/prisma-errors'

export async function getPublishedProperties(limit = 6) {
  try {
    return await prisma.property.findMany({
      where: {
        isActive: true,
        isPublished: true,
        tenantId: null,
      },
      select: {
        id: true,
        name: true,
        address: true,
        commune: true,
        region: true,
        description: true,
        bedrooms: true,
        bathrooms: true,
        squareMeters: true,
        monthlyRentCLP: true,
        monthlyRentUF: true,
        publishedAt: true,
        photos: {
          where: {
            type: 'CURRENT',
          },
          orderBy: [{ order: 'asc' }, { takenAt: 'desc' }],
          take: 1,
          select: {
            url: true,
            caption: true,
          },
        },
      },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    })
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      logPrismaConnectionWarning('public-listings', error)
      return []
    }

    throw error
  }
}

export async function getPublishedPropertyById(id: string) {
  try {
    return await prisma.property.findFirst({
      where: {
        id,
        isActive: true,
        isPublished: true,
        tenantId: null,
      },
      select: {
        id: true,
        name: true,
        address: true,
        commune: true,
        region: true,
        description: true,
        bedrooms: true,
        bathrooms: true,
        squareMeters: true,
        monthlyRentCLP: true,
        monthlyRentUF: true,
        createdAt: true,
        publishedAt: true,
        applicationOpen: true,
        applicationSlug: true,
        photos: {
          orderBy: [{ order: 'asc' }, { takenAt: 'desc' }],
          select: {
            id: true,
            url: true,
            room: true,
            caption: true,
            type: true,
          },
        },
      },
    })
  } catch (error) {
    if (isPrismaConnectionError(error)) {
      logPrismaConnectionWarning('public-listings-detail', error)
      return null
    }

    throw error
  }
}
