import { auth } from '@/lib/auth-session'
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
          if (req.signal.aborted) return
          const notifications = await prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 30,
          })
          if (req.signal.aborted) return
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(notifications)}\n\n`))
          } catch (enqueueErr) {
            // controller may be closed; stop sending
            console.warn('notifications stream enqueue failed (controller closed?)', enqueueErr)
            try {
              controller.close()
            } catch (_) {
              // ignore
            }
          }
        } catch (err) {
          // keep silent but do not close
          console.error('notifications stream error', err)
        }
      }

      await send()
      const interval = setInterval(send, 8000)
      req.signal.addEventListener('abort', () => {
        clearInterval(interval)
        try {
          controller.close()
        } catch (_) {
          // ignore
        }
      })
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
