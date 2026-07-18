import { auth } from '@/lib/auth-session'
import { redirect } from 'next/navigation'
import BrokerShell from '@/components/layout/broker-shell'

export default async function BrokerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.role !== 'BROKER' && session.user.role !== 'OWNER') {
    redirect('/dashboard')
  }

  return (
    <BrokerShell
      role="broker"
      userName={session.user.name ?? 'Corredor'}
      userId={session.user.id}
    >
      {children}
    </BrokerShell>
  )
}
