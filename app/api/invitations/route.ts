import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { render } from '@react-email/components'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { InvitationEmail } from '@/components/email/invitation-template'
import { getResendFrom } from '@/lib/resend-from'
import { getPublicOrigin } from '@/lib/public-origin'

const resend = new Resend(process.env.RESEND_API_KEY)

if (!process.env.RESEND_API_KEY) {
  console.error('⚠️ RESEND_API_KEY no está configurada')
}

const createSchema = z.object({
  type: z.enum(['EMAIL', 'LINK']),
  email: z.string().email().optional(),
  propertyId: z.string(),
})

// POST — crear invitación
export async function POST(req: NextRequest) {
  const publicOrigin = getPublicOrigin(req)
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = createSchema.parse(body)

    if (data.type === 'EMAIL' && !data.email?.trim()) {
      return NextResponse.json(
        { error: 'Indica el correo del arrendatario para enviar la invitación' },
        { status: 400 }
      )
    }

    // Verificar que el usuario es el propietario
    const property = await prisma.property.findFirst({
      where: {
        id: data.propertyId,
        landlordId: session.user.id,
      },
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Propiedad no encontrada' },
        { status: 404 }
      )
    }

    // Expiración en 7 días
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const invitation = await prisma.invitation.create({
      data: {
        type: data.type,
        email: data.type === 'EMAIL' ? data.email?.trim() ?? null : null,
        propertyId: data.propertyId,
        senderId: session.user.id,
        expiresAt,
        status: 'PENDING',
      },
    })

    const inviteUrl = `${publicOrigin}/invitacion/${invitation.token}`

    let emailSent = false
    let emailError: unknown = undefined

    // Solo enviar correo cuando el flujo es EMAIL (nunca para "solo enlace")
    if (data.type === 'EMAIL' && data.email?.trim()) {
      if (!process.env.RESEND_API_KEY) {
        emailError = { message: 'RESEND_API_KEY no está configurada' }
        console.error('⚠️ No se envió el correo: falta RESEND_API_KEY')
      } else {
        try {
          const toEmail = data.email.trim()
          console.log(`📧 Intentando enviar email de invitación a ${toEmail}`)
          console.log(`🔗 URL de invitación: ${inviteUrl}`)
          console.log(`📍 Propiedad: ${property.address}`)

          const emailHtml = await render(
            InvitationEmail({
              inviteLink: inviteUrl,
              invitedEmail: toEmail,
              propertyAddress: property.address || 'Tu propiedad',
              senderName: session.user.name || 'Tu arrendador',
            })
          )

          const from = getResendFrom()
          console.log(`✉️ Remitente: ${from}`)

          const result = await resend.emails.send({
            from,
            to: toEmail,
            subject: 'Invitación a NeiFe - Plataforma de Gestión de Arriendos',
            html: emailHtml,
          })

          if (result.error) {
            console.error('❌ Error de Resend:', result.error)
            emailError = result.error
          } else {
            emailSent = true
            console.log(`✅ Email enviado exitosamente. ID: ${result.data?.id}`)
          }
        } catch (emailErr) {
          console.error('❌ Error al enviar email:', emailErr)
          emailError =
            emailErr instanceof Error ? { message: emailErr.message } : emailErr
        }
      }
    }

    console.log(`✨ Invitación creada: ${invitation.id}`)

    const basePayload = {
      invitation,
      inviteUrl,
      emailSent,
      message: emailSent
        ? 'Invitación creada y correo enviado'
        : data.type === 'EMAIL'
          ? 'Invitación creada'
          : 'Invitación creada; copia el enlace para compartirlo',
    }

    if (data.type === 'EMAIL' && !emailSent && emailError !== undefined) {
      return NextResponse.json(
        {
          ...basePayload,
          emailError,
          warning:
            'La invitación está lista pero el correo no se pudo enviar. Verifica el dominio en Resend o usa RESEND_FROM=NeiFe <onboarding@resend.dev> para pruebas. Puedes copiar el enlace abajo.',
        },
        { status: 201 }
      )
    }

    return NextResponse.json(basePayload, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error creating invitation:', error)
    return NextResponse.json(
      { error: 'Error al crear invitación' },
      { status: 500 }
    )
  }
}
