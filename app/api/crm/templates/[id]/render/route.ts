import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { renderTemplate } from '@/lib/template-engine'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const { dealId, contactId } = await req.json()

  const template = await prisma.crmMessageTemplate.findUnique({ where: { id } })
  if (!template || template.brokerId !== session.user.id)
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const broker = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, phone: true, company: true },
  })

  let vars: Record<string, string> = {
    corredor: broker?.name ?? '',
    empresa: broker?.company ?? '',
    telefono_corredor: broker?.phone ?? '',
  }

  if (contactId) {
    const contact = await prisma.crmContact.findUnique({
      where: { id: contactId },
      select: { name: true, phone: true },
    })
    if (contact) vars = { ...vars, nombre: contact.name }
  }

  if (dealId) {
    const deal = await prisma.crmDeal.findUnique({
      where: { id: dealId },
      include: { property: { select: { address: true } } },
    })
    if (deal) {
      vars = {
        ...vars,
        propiedad: deal.property?.address ?? '',
        monto: deal.value ? `$${deal.value.toLocaleString('es-CL')}` : '',
      }
    }
  }

  const rendered = renderTemplate(template.body, vars)
  const subject = template.subject ? renderTemplate(template.subject, vars) : null

  return NextResponse.json({ rendered, subject, channel: template.channel })
}
