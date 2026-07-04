import { auth } from '@/lib/auth-session'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { ContactDetailTabs } from '@/components/broker/crm/contact-detail-tabs'

export const dynamic = 'force-dynamic'

export default async function ContactDetailPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>
}) {
  const params = await paramsPromise
  const session = await auth()
  if (!session?.user) redirect('/login')

  const contact = await prisma.crmContact.findUnique({
    where: { id: params.id },
    include: {
      broker: { select: { id: true, name: true } },
      deals: {
        include: {
          deal: {
            select: {
              id: true,
              code: true,
              title: true,
              stage: true,
              dueDate: true,
              propertyId: true,
              property: { select: { code: true, address: true, type: true } },
              workflowInstance: {
                select: {
                  id: true,
                  stages: { select: { id: true, isCompleted: true } },
                },
              },
            },
          },
        },
      },
      activities: { orderBy: { createdAt: 'desc' }, take: 50 },
      score: true,
    },
  })

  if (!contact || contact.brokerId !== session.user.id) notFound()

  const dealIds = contact.deals.map(({ deal }) => deal.id)
  const propertyIds = contact.deals.map(({ deal }) => deal.propertyId).filter(Boolean) as string[]

  const [tasks, payments, mandates, relatedContacts, attachments] = await Promise.all([
    prisma.crmTask.findMany({
      where: {
        OR: [{ contactId: contact.id }, { dealId: { in: dealIds } }],
      },
      orderBy: { dueDate: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        isCompleted: true,
        dueDate: true,
        priority: true,
        createdAt: true,
      },
    }),
    prisma.payment.findMany({
      where: { propertyId: { in: propertyIds } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        amountCLP: true,
        status: true,
        month: true,
        year: true,
        createdAt: true,
        paidAt: true,
      },
    }),
    prisma.mandate.findMany({
      where: {
        brokerId: session.user.id,
        propertyId: { in: propertyIds },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        expiresAt: true,
        status: true,
        property: { select: { address: true, id: true } },
      },
    }),
    prisma.crmDealContact.findMany({
      where: { dealId: { in: dealIds } },
      include: {
        contact: { select: { id: true, name: true, type: true, phone: true } },
      },
    }),
    prisma.crmDealAttachment.findMany({
      where: { dealId: { in: dealIds } },
      select: { id: true, fileName: true, fileUrl: true },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  return (
    <div className="p-6">
      <ContactDetailTabs
        contact={{
          ...contact,
          tasks,
          payments,
          mandates,
          relatedContacts: relatedContacts.map((item) => ({
            id: item.contact.id,
            name: item.contact.name,
            role: item.role,
            type: item.contact.type,
            phone: item.contact.phone,
          })),
          attachments,
        }}
      />
    </div>
  )
}
