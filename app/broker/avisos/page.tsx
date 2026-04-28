import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { BrokerMessageCenter } from '@/components/broker/broker-message-center'

export default async function BrokerAvisosPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  if (session.user.role !== 'BROKER' && session.user.role !== 'OWNER') {
    redirect('/dashboard')
  }

  const [properties, messages] = await Promise.all([
    prisma.property.findMany({
      where: {
        isActive: true,
        tenantId: { not: null },
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
        tenant: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.brokerMessage.findMany({
      where: { senderId: session.user.id },
      include: {
        property: {
          select: { name: true, address: true, commune: true },
        },
        tenant: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[#FAF6F2]">Avisos al arrendatario</h1>
        <p className="text-[#9C8578]">
          Envía recordatorios y coordinaciones sin salir de NeiFe.
        </p>
      </div>

      <BrokerMessageCenter
        properties={properties.map((property) => ({
          id: property.id,
          label: `${property.name || property.address} · ${property.tenant?.name || property.tenant?.email}`,
          tenantName: property.tenant?.name ?? null,
          tenantEmail: property.tenant?.email ?? null,
        }))}
        initialMessages={messages as any}
      />
    </div>
  )
}
