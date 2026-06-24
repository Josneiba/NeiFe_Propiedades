'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building2, CreditCard, Wrench, FileText } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default function ClienteDetailPage() {
  const { landlordId } = useParams<{ landlordId: string }>()
  const [data, setData] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!landlordId) return
    fetch(`/api/broker/clientes/${landlordId}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [landlordId])

  if (loading) return (
    <div className="min-h-screen bg-[#1a2424] p-6 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#5E8B8C] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!data) return (
    <div className="min-h-screen bg-[#1a2424] p-6 text-[#FAF6F2]">
      <Link href="/broker/clientes">
        <Button variant="ghost" size="sm" className="text-[#D5C3B6]/60 hover:text-[#FAF6F2] mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
      </Link>
      <p>Cliente no encontrado o sin acceso.</p>
    </div>
  )

  const { owner, properties, statements, totalRecaudado, comisionEstimada } = data

  return (
    <div className="min-h-screen bg-[#1a2424] text-[#FAF6F2]">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Back + header */}
        <div className="flex items-center gap-3 mb-4">
          <Link href="/broker/clientes">
            <Button variant="ghost" size="sm" className="text-[#D5C3B6]/60 hover:text-[#FAF6F2]">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{owner.name}</h1>
            <p className="text-xs text-[#D5C3B6]/50">{owner.email} · {owner.phone ?? 'Sin teléfono'}</p>
          </div>
        </div>

        {/* Financial summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#1a2a2a] border border-[#2D3C3C] rounded-lg p-4">
            <p className="text-xs text-[#D5C3B6]/50">Recaudado este mes</p>
            <p className="text-xl font-bold text-[#FAF6F2]">
              ${new Intl.NumberFormat('es-CL').format(totalRecaudado)}
            </p>
          </div>
          <div className="bg-[#1a2a2a] border border-[#2D3C3C] rounded-lg p-4">
            <p className="text-xs text-[#D5C3B6]/50">Comisión estimada</p>
            <p className="text-xl font-bold text-[#B8965A]">
              {comisionEstimada ? `$${new Intl.NumberFormat('es-CL').format(comisionEstimada)}` : '—'}
            </p>
          </div>
          <div className="bg-[#1a2a2a] border border-[#2D3C3C] rounded-lg p-4">
            <p className="text-xs text-[#D5C3B6]/50">Propiedades</p>
            <p className="text-xl font-bold">{properties.length}</p>
          </div>
        </div>

        {/* Properties */}
        <section>
          <h2 className="text-sm font-semibold text-[#D5C3B6]/60 uppercase tracking-wide mb-3">
            Propiedades administradas
          </h2>
          <div className="space-y-2">
            {properties.length === 0 ? (
              <p className="text-sm text-[#D5C3B6]/40 italic">Sin propiedades</p>
            ) : (
              properties.map((p: any) => {
                const payment = p.payments?.[0]
                const statusColor = payment?.status === 'PAID' ? 'text-emerald-400' :
                  payment?.status === 'OVERDUE' ? 'text-red-400' : 'text-amber-400'
                return (
                  <Link key={p.id} href={`/broker/propiedades/${p.id}`}
                    className="flex items-center gap-3 p-3 bg-[#1a2a2a] border border-[#2D3C3C] rounded-lg hover:border-[#5E8B8C]/40 transition-colors">
                    <Building2 className="w-4 h-4 text-[#5E8B8C] shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.address}, {p.commune}</p>
                      <p className="text-xs text-[#D5C3B6]/50">{p.tenant?.name ?? 'Sin arrendatario'}</p>
                    </div>
                    <span className={`text-xs font-semibold ${statusColor}`}>
                      {payment?.status ?? 'Sin pago'}
                    </span>
                  </Link>
                )
              })
            )}
          </div>
        </section>

        {/* Statements */}
        {statements && statements.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-[#D5C3B6]/60 uppercase tracking-wide mb-3">
              Ultimas rendiciones
            </h2>
            <div className="space-y-1">
              {statements.map((s: any) => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-[#1a2a2a] border border-[#2D3C3C] rounded-lg text-sm">
                  <span className="text-[#D5C3B6]/60">{s.month}/{s.year}</span>
                  <span className="font-semibold">${new Intl.NumberFormat('es-CL').format(s.netTransferCLP)}</span>
                  <Badge variant="outline" className="text-xs border-[#2D3C3C]">{s.status}</Badge>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
