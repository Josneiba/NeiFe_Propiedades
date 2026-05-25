import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { MessageList } from '@/components/messages/message-list'
import { MessageComposer } from '@/components/messages/message-composer'

export default async function ConversationPage({ params }: { params: { propertyId: string } }) {
  const session = await auth()
  if (!session?.user?.id) return null

  const property = await prisma.property.findUnique({ where: { id: params.propertyId }, select: { id: true, name: true, address: true } })
  if (!property) return <div>No encontrado</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-semibold text-[#FAF6F2]">Mensajes · {property.name || property.address}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <MessageList propertyId={property.id} />
        </div>
        <aside className="lg:col-span-1">
          <MessageComposer propertyId={property.id} />
        </aside>
      </div>
    </div>
  )
}
