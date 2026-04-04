'use client'

import { useNotifications } from '@/hooks/useNotifications'
import { Bell, Check, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleClick = async (id: string, link?: string | null, isRead?: boolean) => {
    if (!isRead) await markAsRead([id])
    if (link) router.push(link)
    setOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-xl text-[#9C8578] hover:text-[#D5C3B6] hover:bg-[#D5C3B6]/10 transition-all duration-300"
        aria-label="Notificaciones"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 rounded-full bg-[#C27F79] text-[#FAF6F2] text-[10px] font-bold flex items-center justify-center px-1 leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[#2D3C3C] border border-[#5E8B8C]/20 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#5E8B8C]/10">
            <span className="text-[#D5C3B6] font-medium text-sm">Notificaciones</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[#5E8B8C] text-xs hover:text-[#D5C3B6] flex items-center gap-1 transition-colors"
              >
                <Check className="w-3 h-3" /> Marcar todas leídas
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="w-8 h-8 text-[#9C8578]/40 mx-auto mb-2" />
                <p className="text-[#9C8578] text-sm">Sin notificaciones nuevas</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n.id, n.link, n.isRead)}
                  className={`w-full text-left px-4 py-3 border-b border-[#5E8B8C]/10 hover:bg-[#5E8B8C]/10 transition-colors flex gap-3 ${!n.isRead ? 'bg-[#5E8B8C]/5' : ''}`}
                >
                  <div className="w-2 h-2 mt-1.5 rounded-full flex-shrink-0" style={{ background: n.isRead ? 'transparent' : '#C27F79' }} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${!n.isRead ? 'text-[#D5C3B6] font-medium' : 'text-[#9C8578]'}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-[#9C8578] mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-[#9C8578]/50 mt-1">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: es })}
                    </p>
                  </div>
                  {n.link && <ExternalLink className="w-3 h-3 text-[#9C8578] flex-shrink-0 mt-1" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
