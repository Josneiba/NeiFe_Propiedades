'use client'

import type { NotificationType } from '@prisma/client'
import type { LucideIcon } from 'lucide-react'
import {
  AlertTriangle,
  Bell,
  Briefcase,
  CheckCircle2,
  Clock,
  FileCheck,
  FileText,
  ShieldX,
  Upload,
  UserPlus,
  Wrench,
} from 'lucide-react'

export interface NotificationItem {
  id: string
  type: NotificationType
  title: string
  message: string
  link?: string | null
  isRead: boolean
  createdAt: string
}

type NotificationVisual = {
  icon: LucideIcon
  color: string
}

const notificationVisualMap = {
  PAYMENT_RECEIVED: { icon: CheckCircle2, color: '#5E8B8C' },
  PAYMENT_OVERDUE: { icon: AlertTriangle, color: '#C27F79' },
  PAYMENT_DUE: { icon: Clock, color: '#F2C94C' },
  MANDATE_REQUESTED: { icon: Briefcase, color: '#B8965A' },
  MANDATE_SIGNED: { icon: FileCheck, color: '#5E8B8C' },
  MANDATE_REVOKED: { icon: ShieldX, color: '#C27F79' },
  MAINTENANCE_NEW: { icon: Wrench, color: '#F2C94C' },
  MAINTENANCE_UPDATE: { icon: Wrench, color: '#5E8B8C' },
  CONTRACT_EXPIRING: { icon: FileText, color: '#B8965A' },
  CONTRACT_SIGNED: { icon: FileText, color: '#5E8B8C' },
  SERVICE_UPLOADED: { icon: Upload, color: '#5E8B8C' },
  INVITATION_RECEIVED: { icon: UserPlus, color: '#5E8B8C' },
  SYSTEM: { icon: Bell, color: '#9C8578' },
} satisfies Record<NotificationType, NotificationVisual>

export function getNotificationVisual(type: NotificationType): NotificationVisual {
  return notificationVisualMap[type] ?? notificationVisualMap.SYSTEM
}
