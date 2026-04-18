import { prisma } from '@/lib/prisma'

/** Termina la relación corredor–propietario: elimina permiso, borra mandatos pendientes y revoca activos. */
export async function endBrokerLandlordPartnership(landlordId: string, brokerId: string) {
  await prisma.$transaction(async (tx) => {
    await tx.mandate.deleteMany({
      where: {
        ownerId: landlordId,
        brokerId,
        status: 'PENDING',
      },
    })

    const active = await tx.mandate.findMany({
      where: {
        ownerId: landlordId,
        brokerId,
        status: 'ACTIVE',
      },
      select: { id: true, propertyId: true },
    })

    for (const m of active) {
      await tx.mandate.update({
        where: { id: m.id },
        data: { status: 'REVOKED' },
      })
      await tx.property.updateMany({
        where: { id: m.propertyId, managedBy: brokerId },
        data: { managedBy: null },
      })
    }

    await tx.brokerPermission.deleteMany({
      where: { landlordId, brokerId },
    })
  })
}
