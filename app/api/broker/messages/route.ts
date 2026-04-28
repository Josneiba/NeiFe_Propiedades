import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { z } from 'zod'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import {
  getResendDomainHelpMessage,
  getResendFrom,
  isResendSandboxFrom,
} from '@/lib/resend-from'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const messageSchema = z.object({
  propertyId: z.string().min(1),
  subject: z.string().min(3).max(120),
  message: z.string().min(5).max(1000),
  type: z.enum(['GENERAL', 'PAYMENT_REMINDER', 'MAINTENANCE_VISIT', 'CONTRACT_NOTICE']),
  sendEmail: z.boolean().optional().default(false),
})

async function getBrokerProperty(propertyId: string, brokerId: string) {
  return prisma.property.findFirst({
    where: {
      id: propertyId,
      isActive: true,
      OR: [
        { managedBy: brokerId },
        {
          mandates: {
            some: {
              brokerId,
              status: 'ACTIVE',
            },
          },
        },
      ],
    },
    select: {
      id: true,
      address: true,
      tenant: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  if (session.user.role !== 'BROKER' && session.user.role !== 'OWNER') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const messages = await prisma.brokerMessage.findMany({
    where: { senderId: session.user.id },
    include: {
      property: {
        select: {
          id: true,
          address: true,
          commune: true,
          name: true,
        },
      },
      tenant: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({ messages })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  if (session.user.role !== 'BROKER' && session.user.role !== 'OWNER') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const raw = await req.json()
    const data = messageSchema.parse(raw)

    const property = await getBrokerProperty(data.propertyId, session.user.id)
    if (!property) {
      return NextResponse.json({ error: 'Propiedad no encontrada' }, { status: 404 })
    }
    if (!property.tenant?.id) {
      return NextResponse.json(
        { error: 'La propiedad no tiene arrendatario asignado' },
        { status: 400 }
      )
    }

    await createNotification(
      property.tenant.id,
      'SYSTEM',
      data.subject,
      data.message,
      '/mi-arriendo'
    )

    let emailStatus: 'NOT_REQUESTED' | 'SENT' | 'FAILED' = 'NOT_REQUESTED'
    let emailProviderId: string | null = null
    let emailError: string | null = null

    const fromAddress = getResendFrom()

    if (data.sendEmail && resend && isResendSandboxFrom(fromAddress)) {
      emailStatus = 'FAILED'
      emailError = getResendDomainHelpMessage()
    } else if (data.sendEmail && resend) {
      const emailResult = await resend.emails.send({
        from: fromAddress,
        to: property.tenant.email,
        subject: `NeiFe - ${data.subject}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#1C1917;padding:32px;border-radius:12px;">
            <div style="text-align:center;margin-bottom:24px;">
              <span style="font-size:20px;font-weight:700;color:#D5C3B6;">NeiFe</span>
            </div>
            <h2 style="color:#FAF6F2;margin:0 0 8px;font-size:20px;">${data.subject}</h2>
            <p style="color:#9C8578;font-size:14px;line-height:1.6;white-space:pre-wrap;">${data.message}</p>
            <p style="color:#9C8578;font-size:12px;margin-top:24px;">Propiedad: ${property.address}</p>
          </div>
        `,
      })

      if (emailResult.error) {
        console.error('Broker email send error:', emailResult.error)
        emailStatus = 'FAILED'
        emailError =
          emailResult.error.message?.includes('verify a domain')
            ? getResendDomainHelpMessage()
            : emailResult.error.message || 'Resend no acepto el correo'
      } else {
        emailStatus = 'SENT'
        emailProviderId =
          typeof emailResult.data === 'object' &&
          emailResult.data &&
          'id' in emailResult.data &&
          typeof emailResult.data.id === 'string'
            ? emailResult.data.id
            : null
      }
    } else if (data.sendEmail && !resend) {
      emailStatus = 'FAILED'
      emailError = 'RESEND_API_KEY no configurada en este entorno'
    }

    const message = await prisma.brokerMessage.create({
      data: {
        propertyId: property.id,
        senderId: session.user.id,
        tenantId: property.tenant.id,
        subject: data.subject,
        message: data.message,
        type: data.type,
        sendEmail: data.sendEmail,
        emailStatus,
        emailProviderId,
        emailError,
      },
      include: {
        property: {
          select: {
            address: true,
            commune: true,
            name: true,
          },
        },
        tenant: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(
      {
        message,
        delivery: {
          notificationDelivered: true,
          emailRequested: data.sendEmail,
          emailStatus,
          emailProviderId,
          emailError,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message ?? 'Datos invalidos' },
        { status: 400 }
      )
    }
    console.error('Error creating broker message:', error)
    return NextResponse.json(
      { error: 'Error al enviar el aviso' },
      { status: 500 }
    )
  }
}
