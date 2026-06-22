'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TopContact } from '@/lib/crm-metrics-enhanced'
import Link from 'next/link'

interface TopContactsTableProps {
  data: TopContact[]
}

export function TopContactsTable({ data }: TopContactsTableProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
        <CardHeader>
          <CardTitle className="text-[#FAF6F2] text-lg">👥 Contactos principales</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[#9C8578]">Sin contactos con deals activos</p>
        </CardContent>
      </Card>
    )
  }

  function formatCLP(amount: number) {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  function getScoreBadge(score: number) {
    if (score >= 70) return 'bg-[#5E8B8C]/20 text-[#5E8B8C] border border-[#5E8B8C]/30'
    if (score >= 50) return 'bg-[#B8965A]/20 text-[#B8965A] border border-[#B8965A]/30'
    return 'bg-[#C27F79]/20 text-[#C27F79] border border-[#C27F79]/30'
  }

  return (
    <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
      <CardHeader>
        <CardTitle className="text-[#FAF6F2] text-lg">👥 Contactos principales</CardTitle>
        <p className="text-xs text-[#9C8578] mt-1">Top contactos por valor de deals ganados</p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="border-b border-[#D5C3B6]/10">
              <tr>
                <th className="text-left py-2 px-2 text-[#9C8578] font-semibold">Nombre</th>
                <th className="text-center py-2 px-2 text-[#9C8578] font-semibold">Deals</th>
                <th className="text-center py-2 px-2 text-[#9C8578] font-semibold">Valor</th>
                <th className="text-center py-2 px-2 text-[#9C8578] font-semibold">Score</th>
              </tr>
            </thead>
            <tbody>
              {data.map((contact) => (
                <tr key={contact.id} className="border-b border-[#D5C3B6]/10 hover:bg-[#1C1917]">
                  <td className="py-2 px-2">
                    <Link href={`/broker/crm/contactos/${contact.id}`} className="hover:text-[#5E8B8C]">
                      <div className="text-[#D5C3B6] font-semibold">{contact.name}</div>
                      <div className="text-[#9C8578]">{contact.code}</div>
                    </Link>
                  </td>
                  <td className="py-2 px-2 text-center">
                    <Badge variant="outline" className="text-[9px] border-[#D5C3B6]/20 text-[#9C8578]">
                      {contact.dealsCount}
                    </Badge>
                  </td>
                  <td className="py-2 px-2 text-center font-semibold text-[#B8965A]">
                    {formatCLP(contact.totalValue)}
                  </td>
                  <td className="py-2 px-2 text-center">
                    <Badge className={`text-[9px] font-semibold ${getScoreBadge(contact.score)}`}>
                      {Math.round(contact.score)}/100
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
