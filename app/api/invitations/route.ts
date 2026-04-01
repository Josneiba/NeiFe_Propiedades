import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const resend = new Resend(process.env.RESEND_API_KEY)

const createSchema = z.object({
  type: z.enum(['EMAIL', 'LINK']),
  email: z.string().email().optional(),
  propertyId: z.string(),
})

// POST — crear invitación
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = createSchema.parse(body)

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
        email: data.email,
        propertyId: data.propertyId,
        senderId: session.user.id,
        expiresAt,
        status: 'PENDING',
      },
    })

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invitacion/${invitation.token}`

    // Enviar email vía Resend si type === EMAIL
    if (data.type === 'EMAIL' && data.email) {
      try {
        await resend.emails.send({
          from: 'noreply@neife.cl',
          to: data.email,
          subject: 'Invitación a NeiFe - Plataforma de Gestión de Arriendos',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1a1a1a;">Bienvenido a NeiFe</h2>
              <p style="color: #666;">Has sido invitado a unirte a una propiedad en NeiFe, la plataforma de gestión de arriendos más moderna de Chile.</p>
              <p style="margin: 30px 0;">
                <a href="${inviteUrl}" style="background-color: #5E8B8C; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Aceptar invitación
                </a>
              </p>
              <p style="color: #999; font-size: 12px;">Este link expira en 7 días. Si no puedes hacer clic, copia y pega este enlace en tu navegador: ${inviteUrl}</p>
            </div>
          `,
        })
      } catch (emailError) {
        console.error('Error sending invitation email:', emailError)
        // No fallar toda la operación si falla el email, pero loguear el error
      }
    }

    return NextResponse.json(
      { invitation, inviteUrl },
      { status: 201 }
    )
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
