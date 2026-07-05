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
    <section className="space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[#FAF6F2]">Acciones rápidas</p>
        <span className="text-[11px] text-[#9C8578]">Accesos clave</span>
      </div>

      {loading ? (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="aspect-square rounded-xl border border-[#2D3C3C] bg-[#1a2a2a] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          {items.length === 0 ? (
            <div className="col-span-full rounded-xl border border-[#2D3C3C] bg-[#1a2a2a] p-6 text-center text-[#D5C3B6]">
              <p className="font-semibold text-[#FAF6F2]">Sin accesos rápidos</p>
              <p className="mt-2 text-sm text-[#9C8578]">No hay elementos destacados todavía. Usa el workspace CRM para explorar oportunidades, contactos y plantillas que aparecen aquí.</p>
            </div>
          ) : items.map((item) => {
            const Icon = ICONS[item.id] ?? CircleEllipsis
            return (
              <Link
                key={item.id}
                href={item.href}
                className="group relative flex aspect-square flex-col items-center justify-center rounded-xl border border-[#2D3C3C] bg-[#1a2a2a] p-2 text-center transition hover:border-[#5E8B8C]/40 hover:bg-[#1b2f2d]"
              >
                <div className="rounded-lg bg-[#243535] p-2 text-[#5E8B8C]">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="mt-2 text-[11px] font-semibold leading-tight text-[#FAF6F2]">{item.label}</p>
                {item.count > 0 && (
                  <span className="absolute right-1.5 top-1.5 min-w-[18px] rounded-full bg-[#C27F79] px-1 py-0.5 text-[9px] font-bold text-white">
                    {item.count > 99 ? '99+' : item.count}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}
