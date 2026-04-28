import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { BrokerStatementManager } from '@/components/broker/broker-statement-manager'

export default async function BrokerRendicionesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  if (session.user.role !== 'BROKER' && session.user.role !== 'OWNER') {
    redirect('/dashboard')
  }

  const [properties, statements] = await Promise.all([
    prisma.property.findMany({
      where: {
        isActive: true,
        OR: [
          { managedBy: session.user.id },
          {
            mandates: {
              some: {
                brokerId: session.user.id,
                status: 'ACTIVE',
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        address: true,
        commune: true,
        monthlyRentCLP: true,
        commissionRate: true,
        commissionType: true,
        landlord: {
          select: {
            name: true,
            email: true,
          },
        },
        mandates: {
          where: {
            brokerId: session.user.id,
            status: 'ACTIVE',
          },
          select: {
            commissionRate: true,
            commissionType: true,
          },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.brokerStatement.findMany({
      where: { brokerId: session.user.id },
      include: {
        property: {
          select: { id: true, name: true, address: true, commune: true },
        },
        landlord: {
          select: { name: true, email: true },
        },
        items: true,
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { createdAt: 'desc' }],
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#FAF6F2]">Rendiciones</h1>
        <p className="text-[#9C8578]">
          Genera el documento mensual que el propietario espera y descárgalo en PDF.
        </p>
      </div>

      <BrokerStatementManager
        properties={properties.map((property) => ({
          id: property.id,
          label: property.name || `${property.address}, ${property.commune}`,
          landlordName: property.landlord.name || property.landlord.email,
          monthlyRentCLP: property.monthlyRentCLP,
          commissionRate:
            property.mandates[0]?.commissionRate ?? property.commissionRate ?? null,
          commissionType:
            property.mandates[0]?.commissionType ?? property.commissionType ?? null,
        }))}
        initialStatements={statements as any}
      />
    </div>
  )
}
