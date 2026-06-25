import { Badge } from '@/components/ui/badge'
import { DealCardData } from './kanban-card'

export function AdminRequirements({ deal }: { deal: DealCardData }) {
  const missingRequirements = [
    {
      label: 'Vincular propiedad al deal',
      isMet: !!deal.property,
    },
    {
      label: 'Agregar contacto Propietario',
      isMet: !!deal.contacts.find((c) => c.role === 'PROPIETARIO'),
    },
    {
      label: 'Email del propietario',
      isMet: !!deal.contacts.find(
        (c) => c.role === 'PROPIETARIO' && c.contact.email,
      ),
    },
    {
      label: 'Definir valor del arriendo',
      isMet: !!deal.value,
    },
  ].filter((item) => !item.isMet)

  if (missingRequirements.length === 0) {
    return null
  }

  return (
    <div className="rounded-lg border border-red-500/30 bg-red-950/20 p-4 mb-4">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div>
          <p className="text-sm font-semibold text-red-200">Faltan requisitos para Administración</p>
          <p className="text-xs text-[#D5C3B6]">
            Completa estos datos antes de pasar a FIRMA_CONTRATO / ENTREGA_LLAVES.
          </p>
        </div>
        <Badge className="text-[10px] bg-red-500/10 text-red-200">ALERTA</Badge>
      </div>
      <ul className="space-y-1 text-xs text-[#F5DEDA]">
        {missingRequirements.map((requirement) => (
          <li key={requirement.label} className="flex items-center gap-2">
            <span className="text-red-300">✗</span>
            <span>{requirement.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
