import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { logActivity } from '@/lib/activity'
import {
  canAccessMandate,
  getMandateOrThrow,
  isMandateError,
  mandateInclude,
  signMandate,
} from '@/lib/mandates'
import { createNotification } from '@/lib/notifications'

const patchSchema = z.object({
  action: z.enum(['sign', 'revoke']),
  role: z.enum(['owner', 'broker']).optional(),
})

function forbiddenResponse() {
  return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params
    const mandate = await getMandateOrThrow(id)

    if (!canAccessMandate(mandate, session.user.id)) {
      return forbiddenResponse()
    }

    return NextResponse.json({ mandate })
  } catch (error) {
    if (isMandateError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Error fetching mandate:', error)
    return NextResponse.json(
      { error: 'Error al obtener mandato' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await req.json()
    const data = patchSchema.parse(body)

    const mandate = await getMandateOrThrow(id)

    if (!canAccessMandate(mandate, session.user.id)) {
      return forbiddenResponse()
    }

    if (data.action === 'sign') {
      const role = data.role || 'owner'

      const result = await signMandate({
        mandateId: id,
        signerId: session.user.id,
        signerRole: role,
      })

      return NextResponse.json({
        mandate: result.mandate,
        activated: result.activated,
      })
    }

    if (data.action === 'revoke') {
      const updated = await prisma.mandate.update({
        where: { id },
        data: { status: 'REVOKED' },
        include: mandateInclude,
      })

      // Clear managedBy if this was the active mandate
      if (updated.status === 'ACTIVE' || mandate.status === 'ACTIVE') {
        await prisma.property.update({
          where: { id: mandate.propertyId },
          data: { managedBy: null },
        })
      }

      const recipientId =
        session.user.role === 'BROKER' ? mandate.ownerId : mandate.brokerId
      const revokerName = session.user.name || session.user.email
      const link =
        session.user.role === 'BROKER'
          ? `/dashboard/propiedades/${mandate.propertyId}`
          : `/broker/propiedades/${mandate.propertyId}`

      await createNotification(
        recipientId,
        'MANDATE_REVOKED',
        'Mandato revocado',
        `El mandato para ${mandate.property.name || mandate.property.address} fue revocado por ${revokerName}`,
        link
      )

      await logActivity(
        session.user.id,
        'MANDATE_REVOKED',
        `Mandato revocado para ${mandate.property.name || mandate.property.address}`,
        mandate.propertyId,
        {
          mandateId: id,
          revokedBy: session.user.role,
        }
      )

      return NextResponse.json({ mandate: updated })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    if (isMandateError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Error updating mandate:', error)
    return NextResponse.json(
      { error: 'Error al actualizar mandato' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const { id } = await params
    const mandate = await getMandateOrThrow(id)

    if (!canAccessMandate(mandate, session.user.id)) {
      return forbiddenResponse()
    }

    if (mandate.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Solo puedes eliminar solicitudes pendientes' },
        { status: 400 }
      )
    }

    const canDelete =
      mandate.brokerId === session.user.id || mandate.ownerId === session.user.id

    if (!canDelete) {
      return forbiddenResponse()
    }

    await prisma.mandate.delete({
      where: { id },
    })

    await logActivity(
      session.user.id,
      'MANDATE_DELETED',
      `Solicitud de mandato eliminada para ${mandate.property.name || mandate.property.address}`,
      mandate.propertyId,
      { mandateId: id }
    )

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (isMandateError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Error deleting mandate:', error)
    return NextResponse.json(
      { error: 'Error al eliminar mandato' },
      { status: 500 }
    )
  }
}
