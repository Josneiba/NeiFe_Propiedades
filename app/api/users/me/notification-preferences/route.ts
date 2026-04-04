import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  notifyTenantInspection: z.boolean().optional(),
  inspectionReminderDays: z.number().int().min(1).max(14).optional(),
  notifyPaymentReminder: z.boolean().optional(),
  paymentReminderDays: z.number().int().min(1).max(10).optional(),
  notifyContractExpiring: z.boolean().optional(),
  contractWarningDays: z.number().int().min(7).max(90).optional(),
  notifyIpcDue: z.boolean().optional(),
  ipcReminderDays: z.number().int().min(7).max(60).optional(),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const prefs = await prisma.notificationPreferences.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id },
    update: {},
  })

  return NextResponse.json({ prefs })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  let body: z.infer<typeof schema>
  try {
    body = schema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  const prefs = await prisma.notificationPreferences.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, ...body },
    update: body,
  })

  return NextResponse.json({ prefs })
}
