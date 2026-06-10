'use client'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { DealCardData } from './kanban-card'

interface Props {
  deal: DealCardData
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function AdminConfirmModal({ deal, open, onConfirm, onCancel }: Props) {
  const propietario = deal.contacts.find((c) => c.role === 'PROPIETARIO')
  const arrendatario = deal.contacts.find((c) => c.role === 'ARRENDATARIO')

  return (
    <AlertDialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <AlertDialogContent className="bg-[#1C2828] border-[#D5C3B6]/15 text-[#FAF6F2]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-[#B8965A]">🎉 Pasar a Administración</AlertDialogTitle>
          <AlertDialogDescription className="text-[#9C8578]">
            Esta acción creará automáticamente la propiedad en el sistema de administración.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2 py-2 text-sm">
          <p><span className="text-[#9C8578]">Oportunidad:</span> <span className="text-[#FAF6F2]">{deal.title}</span></p>
          {deal.property && <p><span className="text-[#9C8578]">Propiedad:</span> <span className="text-[#FAF6F2]">{deal.property.address}</span></p>}
          {propietario && <p><span className="text-[#9C8578]">Propietario:</span> <span className="text-[#FAF6F2]">[{propietario.contact.code}] {propietario.contact.name}</span></p>}
          {arrendatario && <p><span className="text-[#9C8578]">Arrendatario:</span> <span className="text-[#FAF6F2]">[{arrendatario.contact.code}] {arrendatario.contact.name}</span></p>}
          {deal.value && <p><span className="text-[#9C8578]">Valor:</span> <span className="text-[#FAF6F2]">${new Intl.NumberFormat('es-CL').format(deal.value)}/mes</span></p>}
          <div className="mt-3 p-3 bg-[#B8965A]/10 rounded-lg border border-[#B8965A]/20 text-[10px] text-[#B8965A]">
            ⚠️ Asegúrate de tener el contrato firmado antes de continuar.
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} className="border-[#D5C3B6]/20 text-[#9C8578] bg-transparent">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-[#B8965A] hover:bg-[#B8965A]/80 text-[#FAF6F2]">
            Confirmar y crear →
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
