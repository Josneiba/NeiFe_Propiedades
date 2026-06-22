import { prisma } from '@/lib/prisma'

export interface WhatsAppMessage {
  to: string
  message: string
  mediaUrl?: string
  templateName?: string
  parameters?: Record<string, string>
}

export interface WhatsAppProvider {
  name: string
  type: 'TWILIO' | 'WHATSAPP_BUSINESS_API' | 'WAHA'
  credentials: {
    accountSid?: string
    authToken?: string
    fromNumber?: string
    phoneNumberId?: string
    accessToken?: string
    businessAccountId?: string
  }
}

/**
 * Send WhatsApp message using configured provider
 */
export async function sendWhatsAppMessage(
  dealId: string,
  contactId: string,
  message: string,
  brokerId: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Get contact phone number
    const contact = await prisma.crmContact.findUnique({
      where: { id: contactId },
    })

    if (!contact || !contact.phone) {
      return { success: false, error: 'Contact phone number not found' }
    }

    // Get broker WhatsApp configuration
    const config = await getWhatsAppConfig(brokerId)
    if (!config) {
      return { success: false, error: 'WhatsApp not configured' }
    }

    // Send message via provider
    const messageId = await sendViaProvider(config, contact.phone, message)

    // Log activity
    await prisma.crmActivity.create({
      data: {
        dealId,
        contactId,
        type: 'WHATSAPP',
        title: `WhatsApp enviado a ${contact.name}`,
        description: message.substring(0, 200),
        brokerId,
        completedAt: new Date(),
        isDone: true,
      },
    })

    // Create message record
    await prisma.whatsAppMessage.create({
      data: {
        dealId,
        contactId,
        brokerId,
        message,
        phoneNumber: contact.phone,
        messageId,
        status: 'SENT',
        createdAt: new Date(),
      },
    })

    return { success: true, messageId }
  } catch (error) {
    console.error('WhatsApp send error:', error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Send bulk WhatsApp messages
 */
export async function sendBulkWhatsAppMessages(
  dealIds: string[],
  message: string,
  brokerId: string
): Promise<{ sent: number; failed: number; results: any[] }> {
  const results = []
  let sent = 0
  let failed = 0

  for (const dealId of dealIds) {
    const deal = await prisma.crmDeal.findUnique({
      where: { id: dealId },
      include: { contacts: { include: { contact: true } } },
    })

    if (deal && deal.contacts.length > 0) {
      const primaryContact = deal.contacts[0]
      const result = await sendWhatsAppMessage(
        dealId,
        primaryContact.contactId,
        message,
        brokerId
      )

      if (result.success) {
        sent++
      } else {
        failed++
      }

      results.push({ dealId, ...result })
    }
  }

  return { sent, failed, results }
}

/**
 * Send templated WhatsApp message
 */
export async function sendWhatsAppTemplate(
  dealId: string,
  contactId: string,
  templateName: string,
  parameters: Record<string, string>,
  brokerId: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const config = await getWhatsAppConfig(brokerId)
    if (!config) {
      return { success: false, error: 'WhatsApp not configured' }
    }

    const contact = await prisma.crmContact.findUnique({
      where: { id: contactId },
    })

    if (!contact || !contact.phone) {
      return { success: false, error: 'Contact phone number not found' }
    }

    // Send template message via provider
    const messageId = await sendTemplateViaProvider(
      config,
      contact.phone,
      templateName,
      parameters
    )

    // Log activity
    await prisma.crmActivity.create({
      data: {
        dealId,
        contactId,
        type: 'WHATSAPP',
        title: `Plantilla WhatsApp "${templateName}"`,
        description: `Enviada a ${contact.name}`,
        brokerId,
        completedAt: new Date(),
        isDone: true,
      },
    })

    return { success: true, messageId }
  } catch (error) {
    console.error('WhatsApp template send error:', error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Get WhatsApp conversation history
 */
export async function getWhatsAppHistory(contactId: string, limit = 50) {
  return await prisma.whatsAppMessage.findMany({
    where: { contactId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

/**
 * Get WhatsApp statistics
 */
export async function getWhatsAppStats(brokerId: string) {
  const messages = await prisma.whatsAppMessage.findMany({
    where: { brokerId },
  })

  const lastMonth = new Date()
  lastMonth.setMonth(lastMonth.getMonth() - 1)

  const thisMonthMessages = messages.filter((m) => m.createdAt > lastMonth)

  return {
    totalSent: messages.length,
    thisMonthSent: thisMonthMessages.length,
    uniqueContacts: new Set(messages.map((m) => m.contactId)).size,
    deliveryRate: messages.length > 0
      ? Math.round(
        (messages.filter((m) => m.status === 'DELIVERED').length / messages.length) * 100
      )
      : 0,
    failedMessages: messages.filter((m) => m.status === 'FAILED').length,
  }
}

/**
 * Get WhatsApp configuration for broker
 */
async function getWhatsAppConfig(brokerId: string): Promise<WhatsAppProvider | null> {
  const config = await prisma.brokerIntegration.findFirst({
    where: {
      brokerId,
      integationType: 'WHATSAPP',
    },
  })

  if (!config) return null

  return {
    name: 'WhatsApp Business',
    type: 'WHATSAPP_BUSINESS_API',
    credentials: config.credentials as any,
  }
}

/**
 * Configure WhatsApp for broker
 */
export async function configureWhatsApp(
  brokerId: string,
  provider: 'TWILIO' | 'WHATSAPP_BUSINESS_API' | 'WAHA',
  credentials: WhatsAppProvider['credentials']
) {
  return await prisma.brokerIntegration.upsert({
    where: {
      brokerId_integationType: {
        brokerId,
        integationType: 'WHATSAPP',
      },
    },
    create: {
      brokerId,
      integationType: 'WHATSAPP',
      provider,
      credentials,
      isActive: true,
    },
    update: {
      provider,
      credentials,
      isActive: true,
    },
  })
}

/**
 * Send message via provider (Twilio)
 */
async function sendViaProvider(
  config: WhatsAppProvider,
  phoneNumber: string,
  message: string
): Promise<string> {
  // Integration with Twilio or WhatsApp Business API
  // This is a placeholder implementation
  console.log(`Sending WhatsApp to ${phoneNumber}: ${message}`)

  if (config.type === 'TWILIO') {
    // Twilio integration would go here
    return `twilio_${Date.now()}`
  } else if (config.type === 'WHATSAPP_BUSINESS_API') {
    // WhatsApp Business API integration would go here
    return `wa_${Date.now()}`
  }

  return `message_${Date.now()}`
}

/**
 * Send template message via provider
 */
async function sendTemplateViaProvider(
  config: WhatsAppProvider,
  phoneNumber: string,
  templateName: string,
  parameters: Record<string, string>
): Promise<string> {
  console.log(
    `Sending WhatsApp template "${templateName}" to ${phoneNumber} with params:`,
    parameters
  )

  return `template_${Date.now()}`
}

/**
 * Webhook handler for incoming WhatsApp messages
 */
export async function handleIncomingWhatsApp(
  phoneNumber: string,
  message: string,
  messageId: string,
  brokerId: string
) {
  try {
    // Find contact by phone number
    const contact = await prisma.crmContact.findFirst({
      where: {
        phone: {
          contains: phoneNumber.replace(/\D/g, '').slice(-9),
        },
      },
    })

    if (contact) {
      // Create activity for incoming message
      const deals = await prisma.crmDeal.findMany({
        where: {
          contacts: {
            some: { contactId: contact.id },
          },
        },
        take: 1,
      })

      if (deals.length > 0) {
        await prisma.crmActivity.create({
          data: {
            dealId: deals[0].id,
            contactId: contact.id,
            type: 'WHATSAPP',
            title: `WhatsApp recibido de ${contact.name}`,
            description: message.substring(0, 200),
            brokerId,
            completedAt: new Date(),
            isDone: true,
          },
        })

        // Record incoming message
        await prisma.whatsAppMessage.create({
          data: {
            dealId: deals[0].id,
            contactId: contact.id,
            brokerId,
            message,
            phoneNumber,
            messageId,
            status: 'RECEIVED',
            createdAt: new Date(),
          },
        })
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error handling incoming WhatsApp:', error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Create message template
 */
export async function createWhatsAppTemplate(
  brokerId: string,
  name: string,
  content: string,
  variables: string[]
) {
  return await prisma.whatsAppTemplate.create({
    data: {
      brokerId,
      name,
      content,
      variables,
      isActive: true,
    },
  })
}

/**
 * Get message templates
 */
export async function getWhatsAppTemplates(brokerId: string) {
  return await prisma.whatsAppTemplate.findMany({
    where: { brokerId, isActive: true },
  })
}
