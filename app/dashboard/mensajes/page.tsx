import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2 } from 'lucide-react'

export default async function MessagesIndexPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const properties = await prisma.property.findMany({ where: { landlordId: session.user.id, isActive: true }, select: { id: true, name: true, address: true } })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-semibold text-[#FAF6F2]">Mensajes</h1>
        <p className="text-sm text-[#9C8578] mt-0.5">Conversaciones por propiedad</p>
      </div>

      {properties.length === 0 ? (
        <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
          <CardContent className="p-8 text-center">
            <Building2 className="h-10 w-10 mx-auto text-[#9C8578] mb-4 opacity-50" />
            <p className="text-[#9C8578]">No tienes propiedades</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {properties.map((p) => (
            <Link key={p.id} href={`/dashboard/mensajes/${p.id}`}>
              <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10 p-4">
                <CardContent>
                  <p className="font-semibold text-[#FAF6F2]">{p.name || p.address}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
