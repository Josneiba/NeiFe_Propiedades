'use client'

import { getNotificationVisual, type NotificationItem } from '@/components/layout/notification-visuals'
import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export function NotificationToast() {
  const [visible, setVisible] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handleNewNotification = (event: CustomEvent) => {
      const { notifications: newNotifications } = event.detail as { notifications: NotificationItem[] }
      setNotifications(newNotifications)
      setVisible(true)

      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        setVisible(false)
      }, 4000)
    }

    window.addEventListener('neife:new-notification', handleNewNotification as EventListener)

    return () => {
      window.removeEventListener('neife:new-notification', handleNewNotification as EventListener)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  if (!visible || notifications.length === 0) return null

  const count = notifications.length
  const single = notifications[0]
  const iconConfig = single ? getNotificationVisual(single.type) : null
  const IconComponent = iconConfig?.icon

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 max-w-sm w-full',
        'animate-in slide-in-from-bottom-4 fade-in duration-300',
        !visible && 'animate-out slide-out-to-bottom-4 fade-out duration-300'
      )}
    >
      <div
        style={iconConfig ? { borderLeftColor: iconConfig.color } : undefined}
        className="bg-[#2D3C3C] border-l-4 border-[#B8965A] rounded-lg shadow-lg p-4"
      >
        <div className="flex items-start gap-3">
          {iconConfig && IconComponent ? (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${iconConfig.color}20` }}
            >
              <IconComponent className="h-4 w-4" style={{ color: iconConfig.color }} />
            </div>
          ) : null}
          <div className="flex-1 min-w-0">
            {count === 1 && single ? (
              <>
                <p className="font-medium text-[#FAF6F2] text-sm">{single.title}</p>
                <p className="text-sm text-[#9C8578] mt-1 line-clamp-2">
                  {single.message.length > 80 ? single.message.substring(0, 80) + '...' : single.message}
                </p>
              </>
            ) : (
              <>
                <p className="font-medium text-[#FAF6F2] text-sm">
                  {count} notificaciones nuevas
                </p>
                <p className="text-sm text-[#9C8578] mt-1">
                  Tienes {count} notificaciones sin leer
                </p>
              </>
            )}
          </div>
          <button
            onClick={() => setVisible(false)}
            className="flex-shrink-0 text-[#9C8578] hover:text-[#FAF6F2] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
