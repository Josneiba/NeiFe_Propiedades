// app/api/crm/deals/route.ts
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { generateCrmCode } from '@/lib/crm-codes'
import { NextRequest, NextResponse } from 'next/server'
import { CrmOperationType } from '@prisma/client'

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
  const stage = searchParams.get('stage')
  const phase = searchParams.get('phase')
  const status = searchParams.get('status') || 'ACTIVE'
  const q = searchParams.get('q')
  const landlordId = searchParams.get('landlordId')
  const operationType = searchParams.get('operationType')

  const where: any = { brokerId, status }

  if (stage) {
    where.stage = stage
  }

  if (phase) {
    where.phase = phase
  }

  if (landlordId) {
    where.landlordId = landlordId
  }

  if (operationType && operationType !== 'ALL') {
    where.operationType = operationType
  }

  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { code: { contains: q, mode: 'insensitive' } },
    ]
  }

  const deals = await prisma.crmDeal.findMany({
    where,
    include: {
      property: {
        select: { id: true, code: true, address: true, type: true },
      },
      contacts: {
        include: { contact: { select: { id: true, code: true, name: true, phone: true, email: true } } },
        orderBy: { isPrimary: 'desc' },
      },
      activities: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { createdAt: true, type: true },
      },
      playbookSteps: {
        select: { stepId: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json(deals)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const brokerId = session.user.id
  const body = await request.json()

  const {
    title,
    operationType,
    propertyId,
    value,
    commission,
    dueDate,
    notes,
  } = body

  if (!title || !operationType) {
    return NextResponse.json(
      { error: 'Faltan campos requeridos: title, operationType' },
      { status: 400 }
    )
  }

  try {
    const deal = await prisma.$transaction(async (tx) => {
      const code = await generateCrmCode('OPE', tx)

      return tx.crmDeal.create({
        data: {
          code,
          title,
          operationType: operationType as CrmOperationType,
          stage: 'NUEVO_LEAD',
          phase: 'PRE_VENTA',
          status: 'ACTIVE',
          propertyId: propertyId || null,
          value: value ? parseFloat(value) : null,
          commission: commission ? parseFloat(commission) : null,
          dueDate: dueDate ? new Date(dueDate) : null,
          brokerId,
          notes: notes || null,
        },
        include: {
          property: true,
          contacts: { include: { contact: true } },
          activities: true,
        },
      })
    })

    // After creating the deal, if there is a default workflow for this operationType, create an instance
    try {
      if (deal && deal.operationType && deal.operationType !== 'AMBOS') {
        await prisma.$transaction(async (tx) => {
          const wf = await tx.crmWorkflow.findFirst({
            where: {
              type: deal.operationType as any,
              isActive: true,
              OR: [{ brokerId }, { brokerId: null }],
            },
            orderBy: [{ isDefault: 'desc' }, { brokerId: 'desc' }],
          })

          if (!wf) return

          const stages = await tx.crmWorkflowStage.findMany({ where: { workflowId: wf.id }, orderBy: { order: 'asc' } })

          const instance = await tx.crmWorkflowInstance.create({
            data: {
              workflowId: wf.id,
              dealId: deal.id,
              currentStageId: stages[0]?.id ?? null,
              stages: { create: stages.map((s) => ({ stageId: s.id })) },
            },
          })
        })
      }
    } catch (err) {
      console.error('Error creating workflow instance for deal:', err)
    }

    return NextResponse.json(deal, { status: 201 })
  } catch (error) {
    console.error('Error creating deal:', error)
    return NextResponse.json({ error: 'Error al crear operación' }, { status: 500 })
  }
}
