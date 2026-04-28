import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ContractWorkspace } from '@/components/contracts/contract-workspace'

export default async function ContratosPage({
  searchParams,
}: {
  searchParams: Promise<{ property?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.role === 'BROKER') {
    redirect('/broker/contratos')
  }
  if (session.user.role !== 'LANDLORD' && session.user.role !== 'OWNER') {
    redirect('/mi-arriendo')
  }

  const { property } = await searchParams

  return (
    <ContractWorkspace
      actorRole={session.user.role}
      userId={session.user.id}
      propertyFilterId={property}
      basePath="/dashboard/contratos"
      propertyDetailBasePath="/dashboard/propiedades"
    />
  )
}
