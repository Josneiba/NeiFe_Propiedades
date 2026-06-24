'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Building2, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react'

const STATUS_CONFIG = {
  GREEN: { icon: CheckCircle2, color: 'text-emerald-400', label: 'Al día', bg: 'bg-emerald-950/20' },
  ORANGE: { icon: AlertCircle, color: 'text-amber-400', label: 'Atención', bg: 'bg-amber-950/20' },
  RED: { icon: AlertTriangle, color: 'text-red-400', label: 'Urgente', bg: 'bg-red-950/20' },
}

export function ClientsTable() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/broker/clientes')
      .then((r) => r.json())
      .then(setClients)
      .finally(() => setLoading(false))
  }, [])

  if (loading)
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-[#1a2a2a] animate-pulse rounded-lg" />
        ))}
      </div>
    )

  return (
    <div className="space-y-2">
      {clients.map((c) => {
        const cfg = STATUS_CONFIG[c.status as keyof typeof STATUS_CONFIG]
        const Icon = cfg.icon
        return (
          <Link
            key={c.owner.id}
            href={`/broker/clientes/${c.owner.id}`}
            className={`flex items-center gap-4 p-4 rounded-lg border border-[#2D3C3C] ${cfg.bg} hover:border-[#5E8B8C]/50 transition-all cursor-pointer`}
          >
            <Icon className={`w-5 h-5 shrink-0 ${cfg.color}`} />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-[#FAF6F2]">{c.owner.name}</p>
              <p className="text-xs text-[#D5C3B6]/50">{c.owner.email}</p>
            </div>
            <div className="flex items-center gap-4 text-right">
              <div>
                <p className="text-xs text-[#D5C3B6]/50">Propiedades</p>
                <p className="text-sm font-semibold text-[#FAF6F2]">{c.totalProperties}</p>
              </div>
              <div>
                <p className="text-xs text-[#D5C3B6]/50">Pagos mes</p>
                <p className="text-sm font-semibold text-[#FAF6F2]">
                  {c.paidThisMonth}/{c.totalProperties}
                </p>
              </div>
              <Badge className={`text-xs ${cfg.color} border-current bg-transparent`}>
                {cfg.label}
              </Badge>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
