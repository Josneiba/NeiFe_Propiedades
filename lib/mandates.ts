import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import { logActivity } from '@/lib/activity'

export const mandateInclude = {
  property: {
    select: {
      id: true,
      name: true,
      address: true,
      managedBy: true,
      landlordId: true,
    },
  },
  owner: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  broker: {
    select: {
      id: true,
      name: true,
      email: true,
      company: true,
    },
  },
} satisfies Prisma.MandateInclude

export type MandateWithRelations = Prisma.MandateGetPayload<{
  include: typeof mandateInclude
}>

type MandateErrorCode = 'NOT_FOUND' | 'FORBIDDEN' | 'INVALID_STATUS'

export class MandateError extends Error {
  code: MandateErrorCode
  status: number

  constructor(code: MandateErrorCode, message: string, status: number) {
    super(message)
    this.code = code
    this.status = status
  }
}

export function isMandateError(error: unknown): error is MandateError {
  return error instanceof MandateError
}

export function canAccessMandate(mandate: { ownerId: string; brokerId: string }, userId: string) {
  return mandate.ownerId === userId || mandate.brokerId === userId
}

export async function getMandateOrThrow(id: string) {
  const mandate = await prisma.mandate.findUnique({
    where: { id },
    include: mandateInclude,
  })

  if (!mandate) {
    throw new MandateError('NOT_FOUND', 'Mandato no encontrado', 404)
  }

  return mandate
}

function getPropertyLabel(property: { name: string | null; address: string }) {
  return property.name?.trim() || property.address
}

type SignMandateInput = {
  mandateId: string
  signerId: string
  signerRole: 'owner' | 'broker'
}

export async function signMandate({
  mandateId,
  signerId,
  signerRole,
}: SignMandateInput) {
  const current = await getMandateOrThrow(mandateId)

  if (signerRole === 'owner' && current.ownerId !== signerId) {
    throw new MandateError('FORBIDDEN', 'No puedes firmar este mandato', 403)
  }

  if (signerRole === 'broker' && current.brokerId !== signerId) {
    throw new MandateError('FORBIDDEN', 'No puedes firmar este mandato', 403)
  }

  if (current.status === 'REVOKED' || current.status === 'EXPIRED') {
    throw new MandateError(
      'INVALID_STATUS',
      'Este mandato ya no puede firmarse',
      400
    )
  }

  const nextSignedByOwner = current.signedByOwner || signerRole === 'owner'
  const nextSignedByBroker = current.signedByBroker || signerRole === 'broker'
  const nextStatus =
    nextSignedByOwner && nextSignedByBroker ? 'ACTIVE' : current.status
  const shouldActivate = nextStatus === 'ACTIVE' && current.status !== 'ACTIVE'
  const shouldSyncManagedBy =
    nextStatus === 'ACTIVE' && current.property.managedBy !== current.brokerId
  const needsOwnerSignature = signerRole === 'owner' && !current.signedByOwner
  const needsBrokerSignature =
    signerRole === 'broker' && !current.signedByBroker

  if (
    !needsOwnerSignature &&
    !needsBrokerSignature &&
    !shouldActivate &&
    !shouldSyncManagedBy
  ) {
    return {
      mandate: current,
      activated: current.status === 'ACTIVE',
      changed: false,
    }
  }

  const now = new Date()
  const updated = await prisma.$transaction(async (tx) => {
    if (shouldActivate) {
      const activeMandate = await tx.mandate.findFirst({
        where: {
          propertyId: current.propertyId,
          status: 'ACTIVE',
          id: { not: mandateId },
        },
        select: { id: true },
      })

      if (activeMandate) {
        throw new MandateError(
          'INVALID_STATUS',
          'Esta propiedad ya tiene un corredor activo',
          400
        )
      }
    }

    const data: Prisma.MandateUpdateInput = {}

    if (needsOwnerSignature) {
      data.signedByOwner = true
      data.ownerSignedAt = current.ownerSignedAt ?? now
    }

    if (needsBrokerSignature) {
      data.signedByBroker = true
      data.brokerSignedAt = current.brokerSignedAt ?? now
    }

    if (shouldActivate) {
      data.status = 'ACTIVE'
    }

    if (Object.keys(data).length > 0) {
      await tx.mandate.update({
        where: { id: mandateId },
        data,
      })
    }

    if (shouldSyncManagedBy) {
      await tx.property.update({
        where: { id: current.propertyId },
        data: { managedBy: current.brokerId },
      })
    }

    return tx.mandate.findUniqueOrThrow({
      where: { id: mandateId },
      include: mandateInclude,
    })
  })

  const propertyLabel = getPropertyLabel(updated.property)

  if (shouldActivate) {
    const recipientId =
      signerRole === 'owner' ? updated.brokerId : updated.ownerId
    const link =
      signerRole === 'owner'
        ? `/broker/propiedades/${updated.propertyId}`
        : `/dashboard/propiedades/${updated.propertyId}`

    await createNotification(
      recipientId,
      'MANDATE_SIGNED',
      'Mandato activado',
      `El mandato de ${propertyLabel} fue firmado por ambas partes`,
      link
    )
  }

  await logActivity(
    signerId,
    signerRole === 'owner' ? 'MANDATE_OWNER_SIGNED' : 'MANDATE_BROKER_SIGNED',
    `Firma de mandato para ${propertyLabel}`,
    updated.propertyId,
    {
      mandateId: updated.id,
      activated: shouldActivate,
    }
  )

  return {
    mandate: updated,
    activated: shouldActivate,
    changed: true,
  }
}

export async function revokeMandate(mandateId: string, userId: string) {
  const current = await getMandateOrThrow(mandateId)

  if (current.ownerId !== userId) {
    throw new MandateError('FORBIDDEN', 'No puedes revocar este mandato', 403)
  }

  if (current.status === 'EXPIRED') {
    throw new MandateError(
      'INVALID_STATUS',
      'No puedes revocar un mandato expirado',
      400
    )
  }

  if (current.status === 'REVOKED') {
    return {
      mandate: current,
      changed: false,
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.mandate.update({
      where: { id: mandateId },
      data: { status: 'REVOKED' },
    })

    await tx.property.update({
      where: { id: current.propertyId },
      data: { managedBy: null },
    })

    return tx.mandate.findUniqueOrThrow({
      where: { id: mandateId },
      include: mandateInclude,
    })
  })

  const propertyLabel = getPropertyLabel(updated.property)

  await createNotification(
    updated.brokerId,
    'MANDATE_REVOKED',
    'Mandato revocado',
    `El propietario revocó el mandato de ${propertyLabel}`,
    `/broker/propiedades/${updated.propertyId}`
  )

  await logActivity(
    userId,
    'MANDATE_REVOKED',
    `Mandato revocado para ${propertyLabel}`,
    updated.propertyId,
    {
      mandateId: updated.id,
    }
  )

  return {
    mandate: updated,
    changed: true,
  }
}
