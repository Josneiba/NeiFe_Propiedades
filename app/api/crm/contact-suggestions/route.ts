import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'BROKER') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const brokerId = session.user.id

  let scores: Array<any> = []

  try {
    scores = await prisma.crmContactScore.findMany({
      where: {
        contact: {
          brokerId,
          status: 'ACTIVE',
        },
      },
      include: {
        contact: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
      orderBy: { score: 'asc' },
      take: 10,
    })
  } catch (error) {
    console.error('Error fetching CRM contact suggestions:', error)
    return NextResponse.json([])
  }

  const suggestions = scores.map((item) => {
    const contact = item.contact
    const dealCode = null
    const dealStage = null
    const urgency = item.urgencyLevel as 'HIGH' | 'MEDIUM' | 'LOW'
    const successProbability = Math.round(item.score)
    const reason = item.recommendation ?? 'Revisa este contacto para mantener la relación.'
    const suggestedAction =
      urgency === 'HIGH'
        ? 'Contactar urgente'
        : urgency === 'MEDIUM'
        ? 'Revisar estado'
        : 'Mantener seguimiento'

    return {
      contactId: contact.id,
      contactName: contact.name,
      contactPhone: contact.phone,
      dealCode,
      dealStage,
      daysWithoutContact: item.lastActivityDays,
      urgency,
      successProbability,
      reason,
      suggestedAction,
    }
  })

  return NextResponse.json(suggestions)
}
