import { prisma } from '@/lib/prisma'

export async function getPublishedProperties(limit = 6) {
  return prisma.property.findMany({
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
}

export async function getPublishedPropertyById(id: string) {
  return prisma.property.findFirst({
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
}
