export const paymentStatusConfig = {
  PAID: {
    label: 'Pagado',
    className: 'bg-[#5E8B8C]/20 text-[#5E8B8C] border border-[#5E8B8C]/30',
  },
  PENDING: {
    label: 'Pendiente',
    className: 'bg-[#F2C94C]/15 text-[#F2C94C] border border-[#F2C94C]/30',
  },
  OVERDUE: {
    label: 'Atrasado',
    className: 'bg-[#C27F79]/20 text-[#C27F79] border border-[#C27F79]/30',
  },
  PROCESSING: {
    label: 'En revisión',
    className: 'bg-[#B8965A]/20 text-[#B8965A] border border-[#B8965A]/30',
  },
  CANCELLED: {
    label: 'Cancelado',
    className: 'bg-[#9C8578]/20 text-[#9C8578] border border-[#9C8578]/30',
  },
} as const

export const maintenanceStatusConfig = {
  REQUESTED: {
    label: 'Solicitado',
    className: 'bg-[#F2C94C]/15 text-[#F2C94C] border border-[#F2C94C]/30',
  },
  REVIEWING: {
    label: 'En revisión',
    className: 'bg-[#B8965A]/20 text-[#B8965A] border border-[#B8965A]/30',
  },
  REQUESTED_INFO: {
    label: 'Info requerida',
    className: 'bg-[#9C8578]/20 text-[#9C8578] border border-[#9C8578]/30',
  },
  APPROVED: {
    label: 'Aprobado',
    className: 'bg-[#5E8B8C]/20 text-[#5E8B8C] border border-[#5E8B8C]/30',
  },
  IN_PROGRESS: {
    label: 'En progreso',
    className: 'bg-[#5E8B8C]/30 text-[#5E8B8C] border border-[#5E8B8C]/40',
  },
  COMPLETED: {
    label: 'Completado',
    className: 'bg-[#5E8B8C]/20 text-[#5E8B8C] border border-[#5E8B8C]/30',
  },
  REJECTED: {
    label: 'Rechazado',
    className: 'bg-[#C27F79]/20 text-[#C27F79] border border-[#C27F79]/30',
  },
} as const

export const mandateStatusConfig = {
  PENDING: {
    label: 'Pendiente',
    className: 'bg-[#F2C94C]/15 text-[#F2C94C] border border-[#F2C94C]/30',
  },
  ACTIVE: {
    label: 'Activo',
    className: 'bg-[#5E8B8C]/20 text-[#5E8B8C] border border-[#5E8B8C]/30',
  },
  REVOKED: {
    label: 'Revocado',
    className: 'bg-[#C27F79]/20 text-[#C27F79] border border-[#C27F79]/30',
  },
  EXPIRED: {
    label: 'Vencido',
    className: 'bg-[#9C8578]/20 text-[#9C8578] border border-[#9C8578]/30',
  },
} as const
