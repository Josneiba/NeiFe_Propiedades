// lib/crm-codes.ts
import { Prisma } from '@prisma/client'

type CrmCodePrefix = 'PROP' | 'ARR' | 'INV' | 'LEAD' | 'INMU' | 'OPE'

/**
 * Genera un código único dentro de una transacción para evitar colisiones.
 * El 'tx' debe ser el cliente de transacción de Prisma, no el cliente global.
 */
export async function generateCrmCode(
  type: CrmCodePrefix,
  tx: Prisma.TransactionClient
): Promise<string> {
  if (type === 'INMU') {
    const count = await tx.crmProperty.count()
    return `INMU-${String(count + 1).padStart(4, '0')}`
  }
  if (type === 'OPE') {
    const count = await tx.crmDeal.count()
    return `OPE-${String(count + 1).padStart(4, '0')}`
  }
  // PROP, ARR, INV, LEAD → CrmContact filtrado por type
  const typeMap: Record<string, string> = {
    PROP: 'PROPIETARIO',
    ARR: 'ARRENDATARIO',
    INV: 'INVERSIONISTA',
    LEAD: 'LEAD',
  }
  const count = await tx.crmContact.count({
    where: { type: typeMap[type] as any },
  })
  return `${type}-${String(count + 1).padStart(4, '0')}`
}
