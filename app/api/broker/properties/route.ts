import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()

  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (session.user.role !== 'BROKER' && session.user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Solo disponible para corredores y propietarios' }, { status: 403 })
  }

  // Get all properties managed by this broker through active mandates
  const mandates = await prisma.mandate.findMany({
    where: {
      brokerId: session.user.id,
      status: 'ACTIVE'
    },
    include: {
      property: {
        select: {
          id: true,
          name: true,
          address: true,
          commune: true,
          monthlyRentCLP: true,
          monthlyRentUF: true,
          landlord: {
            select: {
              name: true,
              email: true,
            },
          },
          tenant: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
  })

  const properties = mandates.map(mandate => ({
    id: mandate.property.id,
    name: mandate.property.name,
    address: mandate.property.address,
    commune: mandate.property.commune,
    monthlyRent: mandate.property.monthlyRentCLP ?? 0,
    monthlyRentUF: mandate.property.monthlyRentUF ?? 0,
    landlord: mandate.property.landlord,
    tenant: mandate.property.tenant,
  }))

  return NextResponse.json({ properties })
}