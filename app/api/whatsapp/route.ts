import { auth } from '@/lib/auth-session'
import { NextRequest, NextResponse } from 'next/server'
import {
  sendWhatsAppMessage,
  sendBulkWhatsAppMessages,
  sendWhatsAppTemplate,
  getWhatsAppHistory,
  getWhatsAppStats,
  configureWhatsApp,
  getWhatsAppTemplates,
  createWhatsAppTemplate,
} from '@/lib/whatsapp-integration'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { action, dealId, contactId, message, templateName, parameters, bulkDealIds, config, phone } = await request.json()

    switch (action) {
      case 'SEND':
        const result = await sendWhatsAppMessage(dealId, contactId, message, session.user.id)
        return NextResponse.json(result)

      case 'SEND_BULK':
        const bulkResult = await sendBulkWhatsAppMessages(bulkDealIds, message, session.user.id)
        return NextResponse.json(bulkResult)

      case 'SEND_TEMPLATE':
        const templateResult = await sendWhatsAppTemplate(
          dealId,
          contactId,
          templateName,
          parameters,
          session.user.id
        )
        return NextResponse.json(templateResult)

      case 'CONFIGURE':
        const configResult = await configureWhatsApp(session.user.id, config.provider, config.credentials)
        return NextResponse.json({ success: true, config: configResult })

      case 'CREATE_TEMPLATE':
        const newTemplate = await createWhatsAppTemplate(
          session.user.id,
          templateName,
          message,
          Object.keys(parameters || {})
        )
        return NextResponse.json({ success: true, template: newTemplate })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('WhatsApp action error:', error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const contactId = searchParams.get('contactId')
    const brokerId = session.user.id

    switch (action) {
      case 'HISTORY':
        if (!contactId) return NextResponse.json({ error: 'Missing contactId' }, { status: 400 })
        const history = await getWhatsAppHistory(contactId)
        return NextResponse.json({ success: true, history })

      case 'STATS':
        const stats = await getWhatsAppStats(brokerId)
        return NextResponse.json({ success: true, stats })

      case 'TEMPLATES':
        const templates = await getWhatsAppTemplates(brokerId)
        return NextResponse.json({ success: true, templates })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('WhatsApp fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch WhatsApp data' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'INCOMING_MESSAGE') {
      const { phoneNumber, message, messageId } = await request.json()
      const result = await sendWhatsAppMessage(phoneNumber, '', message, session.user.id)
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('WhatsApp update error:', error)
    return NextResponse.json(
      { error: 'Failed to process WhatsApp update' },
      { status: 500 }
    )
  }
}
