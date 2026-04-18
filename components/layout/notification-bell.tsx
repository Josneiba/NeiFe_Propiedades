'use client'

import { useNotifications } from '@/hooks/useNotifications'
import { Bell, Check, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({})

  useEffect(() => {
    setMounted(true)
  }, [])

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return

    const update = () => {
      const btn = buttonRef.current
      if (!btn) return
      const r = btn.getBoundingClientRect()
      const maxW = Math.min(380, window.innerWidth - 24)
      const maxH = Math.min(window.innerHeight * 0.72, 440)
      let left = r.right - maxW
      if (left < 12) left = 12
      if (left + maxW > window.innerWidth - 12) {
        left = Math.max(12, window.innerWidth - maxW - 12)
      }
      const top = Math.min(r.bottom + 8, window.innerHeight - maxH - 12)
      setPanelStyle({
        position: 'fixed',
        top: Math.max(12, top),
        left,
        width: maxW,
        maxHeight: maxH,
        zIndex: 99999,
      })
    }

    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const t = e.target as Node
      if (
        buttonRef.current?.contains(t) ||
        panelRef.current?.contains(t)
      ) {
        return
      }
      setOpen(false)
    }
    if (open) {
      document.addEventListener('mousedown', handler)
    }
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const resolveNotificationLink = (link?: string | null, title?: string, message?: string) => {
    if (!link) return link

    const isBrokerPermissionNotification =
      title?.toLowerCase().includes('corredor') ||
      title?.toLowerCase().includes('permiso') ||
      message?.toLowerCase().includes('administrar tus propiedades')

    // Compatibilidad con notificaciones antiguas que abrían propiedades
    // cuando en realidad debían abrir la sección para aprobar corredores.
    if (isBrokerPermissionNotification && link.startsWith('/dashboard/propiedades')) {
      return '/dashboard/solicitudes-corredores'
    }

    return link
  }

  const handleClick = async (
    id: string,
    link?: string | null,
    isRead?: boolean,
    title?: string,
    message?: string
  ) => {
    if (!isRead) await markAsRead([id])
    const nextLink = resolveNotificationLink(link, title, message)
    if (nextLink) router.push(nextLink)
    setOpen(false)
  }

  const panel =
    open && mounted ? (
      <div
        ref={panelRef}
        style={panelStyle}
        className="flex flex-col bg-[#2D3C3C] border border-[#5E8B8C]/25 rounded-xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#5E8B8C]/10 shrink-0">
          <span className="text-[#D5C3B6] font-medium text-sm">Notificaciones</span>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="text-[#5E8B8C] text-xs hover:text-[#D5C3B6] flex items-center gap-1 transition-colors"
            >
              <Check className="w-3 h-3" /> Marcar todas leídas
            </button>
          )}
        </div>

        <div className="overflow-y-auto flex-1 min-h-0 overscroll-contain">
          {notifications.length === 0 ? (
            <div className="py-10 text-center px-4">
              <Bell className="w-8 h-8 text-[#9C8578]/40 mx-auto mb-2" />
              <p className="text-[#9C8578] text-sm">Sin notificaciones nuevas</p>
            </div>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => handleClick(n.id, n.link, n.isRead, n.title, n.message)}
                className={`w-full text-left px-4 py-3 border-b border-[#5E8B8C]/10 hover:bg-[#5E8B8C]/10 transition-colors flex gap-3 ${
                  !n.isRead ? 'bg-[#5E8B8C]/5' : ''
                }`}
              >
                <div
                  className="w-2 h-2 mt-1.5 rounded-full flex-shrink-0"
                  style={{ background: n.isRead ? 'transparent' : '#C27F79' }}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm break-words ${
                      !n.isRead ? 'text-[#D5C3B6] font-medium' : 'text-[#9C8578]'
                    }`}
                  >
                    {n.title}
                  </p>
                  <p className="text-xs text-[#9C8578] mt-0.5 line-clamp-3 break-words">{n.message}</p>
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
    ) : null

  return (
    <>
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="relative p-2 rounded-xl text-[#9C8578] hover:text-[#D5C3B6] hover:bg-[#D5C3B6]/10 transition-all duration-300"
          aria-label="Notificaciones"
          aria-expanded={open}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 rounded-full bg-[#C27F79] text-[#FAF6F2] text-[10px] font-bold flex items-center justify-center px-1 leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </div>
      {mounted && panel ? createPortal(panel, document.body) : null}
    </>
  )
}
