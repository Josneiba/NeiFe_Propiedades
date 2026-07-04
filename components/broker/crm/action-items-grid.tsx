'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Building2, Handshake, Users, Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuickAction {
  id: string
  label: string
  href: string
  count: number
  description: string
}

const ICONS: Record<string, typeof Building2> = {
  deals: Building2,
  mandates: Handshake,
  maintenance: Wrench,
  contacts: Users,
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
        <span className="text-[11px] text-[#9C8578]">Vista de seguimiento</span>
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-xl border border-[#2D3C3C] bg-[#1a2a2a] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((item) => {
            const Icon = ICONS[item.id] ?? Building2
            return (
              <Link
                key={item.id}
                href={item.href}
                className="group rounded-xl border border-[#2D3C3C] bg-[#1a2a2a] p-3.5 transition hover:border-[#5E8B8C]/40 hover:bg-[#1b2f2d]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="rounded-lg bg-[#243535] p-2 text-[#5E8B8C]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="rounded-full bg-[#2D3C3C] px-2 py-0.5 text-[10px] font-medium text-[#D5C3B6]">
                    {item.count}
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold text-[#FAF6F2]">{item.label}</p>
                <p className="mt-1 text-xs text-[#9C8578]">{item.description}</p>
                <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-[#C27F79]">
                  <span>Ver detalle</span>
                  <ArrowRight className={cn('h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5')} />
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}
