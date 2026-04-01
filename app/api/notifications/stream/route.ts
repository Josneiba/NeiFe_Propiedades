import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return new Response('No autorizado', { status: 401 })
  }

  const encoder = new TextEncoder()
  let isConnected = true

  const stream = new ReadableStream({
    async start(controller) {
      const send = async () => {
        if (!isConnected) return

        try {
          const notifications = await prisma.notification.findMany({
            where: { userId: session.user.id, isRead: false },
            orderBy: { createdAt: 'desc' },
            take: 20,
          })

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(notifications)}\n\n`)
          )
        } catch (error) {
          console.error('Error sending notifications:', error)
          isConnected = false
          controller.close()
        }
      }

      // Enviar la primera vez
      await send()

      // Poll cada 8 segundos
      const interval = setInterval(send, 8000)

      // Limpiar al desconectar
      req.signal.addEventListener('abort', () => {
        isConnected = false
        clearInterval(interval)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
