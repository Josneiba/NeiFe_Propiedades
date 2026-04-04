import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'

export default async function MiArriendoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.role !== 'TENANT') redirect('/dashboard')

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        role="tenant"
        userName={session.user.name ?? 'Arrendatario'}
        userId={session.user.id}
      />
      <main className="flex-1 lg:ml-0 p-4 lg:p-8 pt-16 lg:pt-8">
        {children}
      </main>
    </div>
  )
}
