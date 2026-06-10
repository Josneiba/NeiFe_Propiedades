import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth-session'
import { getUnifiedContacts } from '@/lib/contactos'
import { ContactosUnifiedClient } from '@/components/broker/contactos-unified-client'

export const dynamic = 'force-dynamic'

export default async function BrokerContactosPage() {
  const session = await auth()
  if (!session?.user?.id || !['BROKER', 'OWNER'].includes(session.user.role)) {
    redirect('/login')
  }

  const contacts = await getUnifiedContacts(session.user.id)

  return <ContactosUnifiedClient initialContacts={contacts} />
}
