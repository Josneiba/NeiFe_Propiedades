'use client'

import Link from 'next/link'
import { AlertTriangle, BadgeDollarSign, CalendarClock, Wrench, FileText } from 'lucide-react'
import { useEffect, useState } from 'react'

interface UrgentSummary {
  overduePayments: number
  expiringContracts: number
  urgentMaintenance: number
  pendingApplications: number
}

const ITEMS = [
  { key: 'overduePayments', label: 'Pagos vencidos', href: '/broker/pagos?status=OVERDUE', icon: BadgeDollarSign },
  { key: 'expiringContracts', label: 'Contratos por vencer', href: '/broker/contratos?view=expiring', icon: CalendarClock },
  { key: 'urgentMaintenance', label: 'Mantenciones urgentes', href: '/broker/mantenciones?status=REQUESTED', icon: Wrench },
  { key: 'pendingApplications', label: 'Solicitudes sin responder', href: '/broker/postulaciones?status=PENDING', icon: FileText },
] as const

export function UrgentActionsSection() {
  const [summary, setSummary] = useState<UrgentSummary>({ overduePayments: 0, expiringContracts: 0, urgentMaintenance: 0, pendingApplications: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/broker/urgent-summary')
        if (res.ok) {
          setSummary(await res.json())
        }
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  return (
    <section className="space-y-3 rounded-2xl border border-[#C27F79]/30 bg-[#1a2a2a] p-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-[#C27F79]" />
        <div>
          <p className="text-sm font-semibold text-[#FAF6F2]">Urgente</p>
          <p className="text-[11px] text-[#9C8578]">Prioriza lo que requiere acción hoy</p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {ITEMS.map(({ key, label, href, icon: Icon }) => {
          const count = summary[key]
          return (
            <Link
              key={key}
              href={href}
              className="flex items-center justify-between rounded-xl border border-[#2D3C3C] bg-[#162121] px-3 py-3 transition hover:border-[#C27F79]/40"
            >
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-[#2D3C3C] p-2 text-[#C27F79]">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-sm text-[#D5C3B6]">{label}</span>
              </div>
              <span className="rounded-full bg-[#C27F79] px-2.5 py-1 text-[11px] font-semibold text-white">
                {loading ? '…' : count}
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
