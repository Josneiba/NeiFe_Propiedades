export const paymentStatus = {
  PAID: { label: 'Pagado', dot: 'bg-[#5E8B8C]', badge: 'bg-[#5E8B8C]/15 text-[#5E8B8C] border border-[#5E8B8C]/30' },
  PENDING: { label: 'Pendiente', dot: 'bg-[#F2C94C]', badge: 'bg-[#F2C94C]/15 text-[#F2C94C] border border-[#F2C94C]/30' },
  OVERDUE: { label: 'Atrasado', dot: 'bg-[#C27F79]', badge: 'bg-[#C27F79]/15 text-[#C27F79] border border-[#C27F79]/30' },
  PROCESSING: { label: 'En revisión', dot: 'bg-[#B8965A]', badge: 'bg-[#B8965A]/15 text-[#B8965A] border border-[#B8965A]/30' },
  CANCELLED: { label: 'Cancelado', dot: 'bg-[#9C8578]', badge: 'bg-[#9C8578]/15 text-[#9C8578] border border-[#9C8578]/30' },
} as const

export const maintenanceStatus = {
  REQUESTED: { label: 'Solicitado', badge: 'bg-[#F2C94C]/15 text-[#F2C94C] border border-[#F2C94C]/30' },
  REVIEWING: { label: 'En revisión', badge: 'bg-[#B8965A]/15 text-[#B8965A] border border-[#B8965A]/30' },
  REQUESTED_INFO: { label: 'Info pedida', badge: 'bg-[#9C8578]/15 text-[#9C8578] border border-[#9C8578]/30' },
  APPROVED: { label: 'Aprobado', badge: 'bg-[#5E8B8C]/15 text-[#5E8B8C] border border-[#5E8B8C]/30' },
  IN_PROGRESS: { label: 'En progreso', badge: 'bg-[#5E8B8C]/25 text-[#5E8B8C] border border-[#5E8B8C]/40' },
  COMPLETED: { label: 'Completado', badge: 'bg-[#5E8B8C]/15 text-[#5E8B8C] border border-[#5E8B8C]/30' },
  REJECTED: { label: 'Rechazado', badge: 'bg-[#C27F79]/15 text-[#C27F79] border border-[#C27F79]/30' },
} as const

export const mandateStatus = {
  PENDING: { label: 'Pendiente', badge: 'bg-[#F2C94C]/15 text-[#F2C94C] border border-[#F2C94C]/30' },
  ACTIVE: { label: 'Activo', badge: 'bg-[#5E8B8C]/15 text-[#5E8B8C] border border-[#5E8B8C]/30' },
  REVOKED: { label: 'Revocado', badge: 'bg-[#C27F79]/15 text-[#C27F79] border border-[#C27F79]/30' },
  EXPIRED: { label: 'Vencido', badge: 'bg-[#9C8578]/15 text-[#9C8578] border border-[#9C8578]/30' },
} as const

export const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
