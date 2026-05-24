import type { Role } from '@prisma/client'
import { createNotification } from '@/lib/notifications'

export function canManageContracts(role: Role) {
  return role === 'LANDLORD' || role === 'OWNER' || role === 'BROKER'
}

export function canViewContracts(role: Role) {
  return canManageContracts(role) || role === 'TENANT'
}

export function getManagedPropertiesWhere(userId: string, role: Role) {
  if (role === 'BROKER') {
    return {
      OR: [
        { managedBy: userId },
        {
          mandates: {
            some: {
              brokerId: userId,
              status: 'ACTIVE' as const,
            },
          },
        },
      ],
      isActive: true,
    }
  }

  return {
    landlordId: userId,
    isActive: true,
  }
}

export function buildContractLink(propertyId: string) {
  return `/mi-arriendo/contrato?property=${propertyId}`
}

export async function notifyTenantContractSent(params: {
  tenantId: string
  propertyAddress: string
  propertyId: string
  senderName: string
}) {
  return createNotification({
    userId: params.tenantId,
    type: 'SYSTEM',
    title: 'Nuevo contrato disponible',
    message: `${params.senderName} te envio un contrato para revisar y firmar en la plataforma.`,
    link: buildContractLink(params.propertyId)
  })
}

export async function notifyContractSigned(params: {
  landlordId: string
  brokerId?: string | null
  propertyAddress: string
  propertyId: string
  tenantName: string
}) {
  await createNotification({
    userId: params.landlordId,
    type: 'CONTRACT_SIGNED',
    title: 'Contrato firmado',
    message: `${params.tenantName} subio la copia firmada del contrato de ${params.propertyAddress}.`,
    link: `/dashboard/contratos?property=${params.propertyId}`
  })

  if (params.brokerId) {
    await createNotification({
      userId: params.brokerId,
      type: 'CONTRACT_SIGNED',
      title: 'Contrato firmado',
      message: `${params.tenantName} subio la copia firmada del contrato de ${params.propertyAddress}.`,
      link: `/broker/contratos?property=${params.propertyId}`
    })
  }
}
