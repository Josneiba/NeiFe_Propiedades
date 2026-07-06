'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  CalendarClock,
  CircleEllipsis,
  ClipboardList,
  FileQuestion,
  FileText,
  NotebookPen,
  Repeat2,
  Sparkles,
  Users,
} from 'lucide-react'

interface QuickAction {
  id: string
  label: string
  href: string
  count: number
}

const ICONS: Record<string, typeof CalendarClock> = {
  visits: CalendarClock,
  referrals: Users,
  tasks: ClipboardList,
  withoutReport: FileQuestion,
  notes: NotebookPen,
  followUps: Repeat2,
  loyalty: Sparkles,
  templates: FileText,
}

const ICON_COLORS: Record<string, string> = {
  visits: 'text-[#E8A559]',
  referrals: 'text-[#7FB8B9]',
  tasks: 'text-[#7FB8B9]',
  withoutReport: 'text-[#E8A559]',
  notes: 'text-[#7FB8B9]',
  followUps: 'text-[#7FB8B9]',
  loyalty: 'text-[#E8A5A0]',
  templates: 'text-[#7FB8B9]',
}

export function ActionItemsGrid() {
  const [items, setItems] = useState<QuickAction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/broker/quick-actions')
        if (res.ok) {
          const data = await res.json()
          setItems(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  return (
    <section className="space-y-3">
      <div className="border-b border-[#2D3C3C] pb-2">
        <h2 className="text-base font-semibold text-[#FAF6F2]">Acciones Pendientes</h2>
      </div>

      {loading ? (
        <div className="grid grid-cols-4 gap-x-3 gap-y-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="flex flex-col items-center gap-2">
              <div className="h-12 w-12 rounded-2xl bg-[#1a2a2a] animate-pulse" />
              <div className="h-2.5 w-12 rounded bg-[#1a2a2a] animate-pulse" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-[#2D3C3C] bg-[#1a2a2a] p-6 text-center text-[#D5C3B6]">
          <p className="font-semibold text-[#FAF6F2]">Sin accesos rápidos</p>
          <p className="mt-2 text-sm text-[#9C8578]">
            No hay elementos destacados todavía. Usa el workspace CRM para explorar
            oportunidades, contactos y plantillas que aparecen aquí.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-x-3 gap-y-6">
          {items.map((item) => {
            const Icon = ICONS[item.id] ?? CircleEllipsis
            const iconColor = ICON_COLORS[item.id] ?? 'text-[#7FB8B9]'
            return (
              <Link
                key={item.id}
                href={item.href}
                className="group flex flex-col items-center gap-2 text-center"
              >
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#2D3C3C]/80 transition group-hover:border-[#5E8B8C]/60">
                    <Icon className={`h-6 w-6 ${iconColor}`} strokeWidth={1.75} />
                  </div>
                  {item.count > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#C27F79] px-1 text-[10px] font-bold text-white">
                      {item.count > 99 ? '99+' : item.count}
                    </span>
                  )}
                </div>
                <p className="line-clamp-2 text-[11px] font-medium leading-tight text-[#FAF6F2]">
                  {item.label}
                </p>
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}
