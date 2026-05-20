import { auth } from '@/lib/auth-session'
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
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-serif font-semibold text-[#FAF6F2]">Contratos</h1>
        <p className="text-sm text-[#9C8578] mt-0.5">
          Gestiona y descarga los contratos de tus propiedades
        </p>
      </div>
      <div className="h-px bg-[#D5C3B6]/10" />
      <ContractWorkspace
        actorRole={session.user.role}
        userId={session.user.id}
        propertyFilterId={property}
        basePath="/dashboard/contratos"
        propertyDetailBasePath="/dashboard/propiedades"
      />
    </div>
  )
}
