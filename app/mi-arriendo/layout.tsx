import { Sidebar } from "@/components/layout/sidebar"
import { auth } from "@/lib/auth-session"

export default async function MiArriendoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  const userName = session?.user?.name ?? "Usuario"

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar role="tenant" userName={userName} />
      <main className="flex-1 lg:ml-0 p-4 lg:p-8 pt-16 lg:pt-8">
        {children}
      </main>
    </div>
  )
}
