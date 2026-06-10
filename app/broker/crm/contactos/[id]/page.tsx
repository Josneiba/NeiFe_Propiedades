import { auth } from '@/lib/auth-session'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Phone, Mail, Copy, Building2, Users, Activity, TrendingUp } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ContactDetailPage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>
}) {
  const params = await paramsPromise
  const session = await auth()
  if (!session?.user) redirect('/login')

  const contact = await prisma.crmContact.findUnique({
    where: { id: params.id },
    include: {
      deals: {
        include: {
          deal: {
            include: {
              property: { select: { code: true, address: true, type: true } },
              contacts: { include: { contact: { select: { code: true, name: true } } } },
            },
          },
        },
      },
      activities: { orderBy: { createdAt: 'desc' }, take: 10 },
      score: true,
    },
  })

  if (!contact || contact.brokerId !== session.user.id) notFound()

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/broker/crm/contactos">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <button
              className="font-mono text-sm text-[#B8965A] hover:text-[#D5C3B6] flex items-center gap-1"
              onClick={() => navigator.clipboard.writeText(contact.code)}
            >
              {contact.code} <Copy className="h-3 w-3" />
            </button>
            <h1 className="text-2xl font-semibold text-[#FAF6F2]">{contact.name}</h1>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs border-[#D5C3B6]/20 text-[#9C8578]">
              {contact.type}
            </Badge>
            <Badge variant="outline" className="text-xs border-[#D5C3B6]/20 text-[#9C8578]">
              {contact.status}
            </Badge>
            <Badge variant="outline" className="text-xs border-[#D5C3B6]/20 text-[#9C8578]">
              {contact.priority}
            </Badge>
          </div>
        </div>
      </div>

      <Separator className="bg-[#D5C3B6]/10" />

      {/* Datos de contacto */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#9C8578] mb-3">Datos de contacto</h2>
        <div className="bg-[#1C2828] border border-[#D5C3B6]/10 rounded-lg p-4 space-y-3">
          {contact.phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-[#5E8B8C]" />
              <a href={`tel:${contact.phone}`} className="text-sm text-[#D5C3B6] hover:text-[#FAF6F2]">
                {contact.phone}
              </a>
            </div>
          )}
          {contact.email && (
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-[#5E8B8C]" />
              <a href={`mailto:${contact.email}`} className="text-sm text-[#D5C3B6] hover:text-[#FAF6F2]">
                {contact.email}
              </a>
            </div>
          )}
          {contact.rut && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#9C8578]">RUT:</span>
              <span className="text-sm text-[#D5C3B6]">{contact.rut}</span>
            </div>
          )}
        </div>
      </section>

      {/* Score del motor */}
      {contact.score && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#9C8578] mb-3">Score de engagement</h2>
          <div className="bg-[#1C2828] border border-[#D5C3B6]/10 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#D5C3B6]">Puntaje</span>
              <span className="text-2xl font-bold" style={{ color: contact.score.score > 70 ? '#22c55e' : contact.score.score > 40 ? '#f59e0b' : '#ef4444' }}>
                {contact.score.score}
              </span>
            </div>
            <p className="text-xs text-[#9C8578]">{contact.score.recommendation}</p>
          </div>
        </section>
      )}

      <Separator className="bg-[#D5C3B6]/10" />

      {/* Deals asociados */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="h-4 w-4 text-[#5E8B8C]" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#9C8578]">Deals asociados</h2>
          <Badge variant="secondary" className="text-xs">{contact.deals.length}</Badge>
        </div>
        {contact.deals.length === 0 ? (
          <p className="text-sm text-[#9C8578] italic">Sin deals asociados</p>
        ) : (
          <div className="space-y-2">
            {contact.deals.map((dc) => (
              <Link
                key={dc.deal.id}
                href="/broker/crm/workspace"
                className="block bg-[#1C2828] border border-[#D5C3B6]/10 rounded-lg p-3 hover:border-[#5E8B8C]/50 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[10px] text-[#B8965A]">{dc.deal.code}</span>
                  <Badge variant="outline" className="text-[9px] border-[#D5C3B6]/20 text-[#9C8578]">
                    {dc.deal.stage}
                  </Badge>
                </div>
                <p className="text-sm text-[#D5C3B6]">{dc.deal.title}</p>
                {dc.deal.property && (
                  <p className="text-xs text-[#9C8578] mt-1">📍 {dc.deal.property.address}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      <Separator className="bg-[#D5C3B6]/10" />

      {/* Historial de actividades */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Activity className="h-4 w-4 text-[#5E8B8C]" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[#9C8578]">Historial de actividades</h2>
        </div>
        {contact.activities.length === 0 ? (
          <p className="text-sm text-[#9C8578] italic">Sin actividades registradas</p>
        ) : (
          <div className="space-y-2">
            {contact.activities.map((a) => (
              <div key={a.id} className="flex gap-3 text-sm bg-[#1C2828] border border-[#D5C3B6]/10 rounded-lg p-3">
                <span className="text-[#B8965A] flex-shrink-0">
                  {a.type === 'LLAMADA' ? '📞' : a.type === 'VISITA' ? '🏠' : a.type === 'EMAIL' ? '✉️' : '📝'}
                </span>
                <div className="flex-1">
                  <span className="text-[#D5C3B6]">{a.title}</span>
                  <span className="text-[#9C8578] ml-2 text-xs">
                    {new Date(a.createdAt).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Separator className="bg-[#D5C3B6]/10" />

      {/* Notas */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#9C8578] mb-3">Notas</h2>
        <div className="bg-[#1C2828] border border-[#D5C3B6]/10 rounded-lg p-4">
          <textarea
            className="w-full bg-transparent text-sm text-[#D5C3B6] placeholder-[#9C8578] resize-none focus:outline-none"
            rows={4}
            placeholder="Agregar notas sobre este contacto..."
            defaultValue={contact.notes || ''}
          />
        </div>
      </section>
    </div>
  )
}
