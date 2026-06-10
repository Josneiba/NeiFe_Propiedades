// app/api/crm/contacts/route.ts
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { generateCrmCode } from '@/lib/crm-codes'
import { NextRequest, NextResponse } from 'next/server'
import { CrmContactType, CrmLeadSource, CrmPriority } from '@prisma/client'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (session.user.role !== 'BROKER' && session.user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  const brokerId = session.user.id
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const status = searchParams.get('status')
  const q = searchParams.get('q')

  const where: any = { brokerId }

  if (type) {
    where.type = type as CrmContactType
  }

  if (status) {
    where.status = status
  }

  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { phone: { contains: q, mode: 'insensitive' } },
      { code: { contains: q, mode: 'insensitive' } },
    ]
  }

  const contacts = await prisma.crmContact.findMany({
    where,
    include: {
      deals: {
        include: { deal: { select: { id: true, code: true, title: true, stage: true } } },
        take: 3,
      },
      score: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(contacts)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (session.user.role !== 'BROKER' && session.user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Sin permiso' }, { status: 403 })
  }

  const brokerId = session.user.id
  const body = await request.json()

  const { type, name, email, phone, rut, source, priority = 'MEDIUM', notes } = body

  if (!type || !name || !source) {
    return NextResponse.json(
      { error: 'Faltan campos requeridos: type, name, source' },
      { status: 400 }
    )
  }

  try {
    const contact = await prisma.$transaction(async (tx) => {
      const code = await generateCrmCode(
        type === 'PROPIETARIO'
          ? 'PROP'
          : type === 'ARRENDATARIO'
            ? 'ARR'
            : type === 'INVERSIONISTA'
              ? 'INV'
              : 'LEAD',
        tx
      )

      return tx.crmContact.create({
        data: {
          code,
          type: type as CrmContactType,
          name,
          email: email || null,
          phone: phone || null,
          rut: rut || null,
          source: source as CrmLeadSource,
          priority: priority as CrmPriority,
          status: 'ACTIVE',
          brokerId,
          notes: notes || null,
        },
      })
    })

    return NextResponse.json(contact, { status: 201 })
  } catch (error) {
    console.error('Error creating contact:', error)
    return NextResponse.json({ error: 'Error al crear contacto' }, { status: 500 })
  }
}
