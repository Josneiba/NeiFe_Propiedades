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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-[#FAF6F2]">Contratos</h1>
        <p className="text-sm text-[#9C8578] mt-0.5">
          Gestiona y descarga los contratos de las propiedades que administras
        </p>
      </div>
      <ContractWorkspace
        actorRole={session.user.role}
        userId={session.user.id}
        propertyFilterId={property}
        basePath="/broker/contratos"
        propertyDetailBasePath="/broker/propiedades"
      />
    </div>
  )
}
