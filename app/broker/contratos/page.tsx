import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ContractWorkspace } from '@/components/contracts/contract-workspace'

export default async function BrokerContratosPage({
  searchParams,
}: {
  searchParams: Promise<{ property?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.role !== 'BROKER' && session.user.role !== 'OWNER') {
    redirect('/dashboard')
  }

  const { property } = await searchParams

  return (
    <ContractWorkspace
      actorRole={session.user.role}
      userId={session.user.id}
      propertyFilterId={property}
      basePath="/broker/contratos"
      propertyDetailBasePath="/broker/propiedades"
    />
  )
}
