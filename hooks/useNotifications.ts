'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  link?: string | null
  isRead: boolean
  createdAt: string
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const esRef = useRef<EventSource | null>(null)
  const retryRef = useRef<NodeJS.Timeout>()
  const retryCount = useRef(0)

  const connect = useCallback(() => {
    esRef.current?.close()
    const es = new EventSource('/api/notifications/stream')
    esRef.current = es

    es.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data)
        if (Array.isArray(parsed)) {
          setNotifications(parsed)
          setUnreadCount(parsed.filter((n) => !n.isRead).length)
        }
      } catch {
        // ignore parse errors
      }
    }

    es.onerror = () => {
      es.close()
      const delay = Math.min(1000 * 2 ** retryCount.current, 30000)
      retryCount.current += 1
      retryRef.current = setTimeout(connect, delay)
    }
  }, [])

  useEffect(() => {
    connect()
    return () => {
      esRef.current?.close()
      if (retryRef.current) clearTimeout(retryRef.current)
    }
  }, [connect])

  const markAsRead = useCallback(async (ids: string[]) => {
    if (!ids.length) return
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    })
    setNotifications((prev) =>
      prev.map((n) => (ids.includes(n.id) ? { ...n, isRead: true } : n))
    )
    setUnreadCount((prev) => Math.max(0, prev - ids.length))
  }, [])

  const markAllAsRead = useCallback(async () => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    })
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setUnreadCount(0)
  }, [])

  return { notifications, unreadCount, markAsRead, markAllAsRead }
}
