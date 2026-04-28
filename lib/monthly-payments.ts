import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'

type GenerateMonthlyPaymentsResult = {
  month: number
  year: number
  created: number
  skipped: number
}

export async function generateMonthlyPaymentsForPeriod(
  month = new Date().getMonth() + 1,
  year = new Date().getFullYear()
): Promise<GenerateMonthlyPaymentsResult> {
  const properties = await prisma.property.findMany({
    where: {
      isActive: true,
      tenantId: { not: null },
      monthlyRentCLP: { not: null },
      AND: [
        {
          OR: [
            { contractStart: null },
            { contractStart: { lte: new Date(year, month, 0) } },
          ],
        },
        {
          OR: [
            { contractEnd: null },
            { contractEnd: { gte: new Date(year, month - 1, 1) } },
          ],
        },
      ],
    },
    select: {
      id: true,
      tenantId: true,
      monthlyRentCLP: true,
      monthlyRentUF: true,
    },
  })

  let created = 0
  let skipped = 0

  for (const property of properties) {
    const existing = await prisma.payment.findUnique({
      where: {
        propertyId_month_year: {
          propertyId: property.id,
          month,
          year,
        },
      },
      select: { id: true },
    })

    if (existing) {
      skipped += 1
      continue
    }

    await prisma.payment.create({
      data: {
        propertyId: property.id,
        month,
        year,
        amountCLP: property.monthlyRentCLP ?? 0,
        amountUF: property.monthlyRentUF ?? 0,
        status: 'PENDING',
      },
    })

    if (property.tenantId) {
      await createNotification(
        property.tenantId,
        'PAYMENT_DUE',
        'Nuevo pago disponible',
        `Tu pago de ${new Date(year, month - 1, 1).toLocaleDateString('es-CL', {
          month: 'long',
          year: 'numeric',
        })} ya está disponible.`,
        '/mi-arriendo/pagos'
      )
    }

    created += 1
  }

  return { month, year, created, skipped }
}
