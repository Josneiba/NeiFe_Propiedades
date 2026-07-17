// app/api/crm/contacts/route.ts
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { generateCrmCode } from '@/lib/crm-codes'
import { NextRequest, NextResponse } from 'next/server'
import { CrmContactType, CrmLeadSource, CrmPriority, CrmChannel, CrmPropertyType } from '@prisma/client'

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
  const source = searchParams.get('source')
  const q = searchParams.get('q')

  const where: any = { brokerId }

  if (type) {
    where.type = type as CrmContactType
  }

  if (status) {
    where.status = status
  }

  if (source) {
    where.source = source as CrmLeadSource
  }

  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { phone: { contains: q, mode: 'insensitive' } },
      { code: { contains: q, mode: 'insensitive' } },
    ]
  }

  let contacts: Array<any>

  try {
    contacts = await prisma.crmContact.findMany({
      where,
      select: {
        id: true,
        code: true,
        type: true,
        name: true,
        email: true,
        phone: true,
        rut: true,
        notes: true,
        source: true,
        priority: true,
        status: true,
        referredBy: true,
        interestedCommune: true,
        interestedPropertyType: true,
        budgetMin: true,
        budgetMax: true,
        brokerId: true,
        preferredChannel: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  } catch (error) {
    console.error('Error fetching CRM contacts:', error)
    return NextResponse.json([])
  }

  const enriched = contacts.map((contact) => {
    const lastActivityAt = contact.updatedAt
    const daysSinceActivity = Math.max(0, Math.floor((Date.now() - new Date(lastActivityAt).getTime()) / 86_400_000))

    let stallReason: string | null = null
    if (contact.status === 'INACTIVE') {
      stallReason = 'NO_INTERESADO'
    } else if (daysSinceActivity >= 45) {
      stallReason = 'SIN_CONTACTO_RECIENTE'
    } else if (daysSinceActivity >= 28) {
      stallReason = 'NO_CONTACTABLE'
    } else if (daysSinceActivity >= 14) {
      stallReason = 'MUY_OCUPADO'
    }

    return {
      ...contact,
      deals: [],
      activities: [],
      score: null,
      stallReason,
    }
  })

  return NextResponse.json(enriched)
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

  const {
    type,
    name,
    email,
    phone,
    rut,
    source,
    priority = 'MEDIUM',
    notes,
    preferredChannel,
    referredBy,
    interestedCommune,
    interestedPropertyType,
    budgetMin,
    budgetMax,
  } = body

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
          preferredChannel: (preferredChannel as CrmChannel) || null,
          referredBy: referredBy || null,
          interestedCommune: interestedCommune || null,
          interestedPropertyType: (interestedPropertyType as CrmPropertyType) || null,
          budgetMin: typeof budgetMin === 'number' ? budgetMin : budgetMin ? Number(budgetMin) : null,
          budgetMax: typeof budgetMax === 'number' ? budgetMax : budgetMax ? Number(budgetMax) : null,
        },
      })
    })

    return NextResponse.json(contact, { status: 201 })
  } catch (error) {
    console.error('Error creating contact:', error)
    return NextResponse.json({ error: 'Error al crear contacto' }, { status: 500 })
  }
}
