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
      deals: {
        include: {
          deal: {
            include: {
              property: { select: { code: true, address: true, type: true } },
            },
          },
        },
      },
      activities: { orderBy: { createdAt: 'desc' }, take: 50 },
      score: true,
    },
  })

  if (!contact || contact.brokerId !== session.user.id) notFound()

  return (
    <div className="p-6">
      <ContactDetailTabs contact={contact} />
    </div>
  )
}
