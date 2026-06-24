import { auth } from '@/lib/auth-session'
import { redirect } from 'next/navigation'
import { ClientsTable } from '@/components/broker/clientes/clients-table'

export default async function ClientesPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.role !== 'BROKER' && session.user.role !== 'OWNER') redirect('/broker')

  return (
    <div className="min-h-screen bg-[#1a2424] p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-[#FAF6F2] mb-6">Mis Clientes</h1>
        <ClientsTable />
      </div>
    </div>
  )
}
