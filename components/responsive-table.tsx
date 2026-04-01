'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface ResponsiveTableProps {
  columns: string[]
  data: any[]
  renderRow: (item: any, index: number) => ReactNode
  renderMobileCard: (item: any, index: number) => ReactNode
  className?: string
}

/**
 * Componente de tabla responsiva que:
 * - Muestra tabla completa en desktop (md+)
 * - Se convierte en cards apiladas en mobile y tablet
 * - Perfecto para listas de pagos, mantenciones, etc.
 */
export function ResponsiveTable({
  columns,
  data,
  renderRow,
  renderMobileCard,
  className
}: ResponsiveTableProps) {
  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-[#D5C3B6]/10">
        <table className="w-full text-sm">
          <thead className="bg-[#2D3C3C]/50 border-b border-[#D5C3B6]/10">
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-xs font-semibold text-[#B8965A] uppercase tracking-wider"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D5C3B6]/10">
            {data.map((item, idx) => (
              <tr key={idx} className="hover:bg-[#2D3C3C]/30 transition-colors">
                {renderRow(item, idx)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {data.map((item, idx) => renderMobileCard(item, idx))}
      </div>
    </>
  )
}
