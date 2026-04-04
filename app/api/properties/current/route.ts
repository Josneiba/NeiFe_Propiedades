import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (session.user.role !== 'TENANT') {
    return NextResponse.json({ error: 'Solo disponible para arrendatarios' }, { status: 403 })
  }

  const property = await prisma.property.findFirst({
    where: { tenantId: session.user.id },
    select: {
      id: true,
      address: true,
      monthlyRentCLP: true,
      landlord: {
        select: {
          bankName: true,
          bankAccountType: true,
          bankAccountNumber: true,
          rut: true,
          name: true,
          bankEmail: true,
        },
      },
    },
  })

  if (!property) {
    return NextResponse.json({ error: 'No tienes una propiedad asignada' }, { status: 404 })
  }

  return NextResponse.json({
    id: property.id,
    address: property.address,
    monthlyRent: property.monthlyRentCLP ?? 0,
    landlord: property.landlord,
  })
}
