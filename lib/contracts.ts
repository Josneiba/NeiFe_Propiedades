import type { Role } from '@prisma/client'
import { createNotification } from '@/lib/notifications'

export function canManageContracts(role: Role) {
  return role === 'LANDLORD' || role === 'OWNER' || role === 'BROKER'
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
  return createNotification(
    params.tenantId,
    'SYSTEM',
    'Nuevo contrato disponible',
    `${params.senderName} te envio un contrato para revisar y firmar en la plataforma.`,
    buildContractLink(params.propertyId)
  )
}

export async function notifyContractSigned(params: {
  landlordId: string
  brokerId?: string | null
  propertyAddress: string
  propertyId: string
  tenantName: string
}) {
  await createNotification(
    params.landlordId,
    'CONTRACT_SIGNED',
    'Contrato firmado',
    `${params.tenantName} subio la copia firmada del contrato de ${params.propertyAddress}.`,
    `/dashboard/contratos?property=${params.propertyId}`
  )

  if (params.brokerId) {
    await createNotification(
      params.brokerId,
      'CONTRACT_SIGNED',
      'Contrato firmado',
      `${params.tenantName} subio la copia firmada del contrato de ${params.propertyAddress}.`,
      `/broker/contratos?property=${params.propertyId}`
    )
  }
}
