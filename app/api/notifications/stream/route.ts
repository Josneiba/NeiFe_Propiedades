import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return new Response('No autorizado', { status: 401 })
  }

  const encoder = new TextEncoder()
  const userId = session.user.id

  const stream = new ReadableStream({
    async start(controller) {
      const send = async () => {
        try {
          const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 30,
          })
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(notifications)}\n\n`))
        } catch (err) {
          // keep silent but do not close
          console.error('notifications stream error', err)
        }
      }

      await send()
      const interval = setInterval(send, 8000)
      req.signal.addEventListener('abort', () => clearInterval(interval))
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
