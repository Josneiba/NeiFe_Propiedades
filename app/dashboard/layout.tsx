import { Sidebar } from "@/components/layout/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-[#1C1917]">
      <Sidebar role="landlord" userName="Carlos Mendoza" />
      <main className="flex-1 lg:ml-0 p-4 lg:p-8 pt-16 lg:pt-8 overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}
