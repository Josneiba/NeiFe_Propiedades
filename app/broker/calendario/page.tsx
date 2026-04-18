import { auth } from "@/lib/auth-session"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import {
  Calendar,
  Clock,
  AlertCircle,
  DollarSign,
  FileText,
  Wrench,
  TrendingUp,
  Loader2,
  Plus,
  Bell,
  Edit2,
  Trash2,
} from "lucide-react"
import BrokerCalendarClient from "./client"

interface CalendarEvent {
  id: string
  type: "INSPECTION" | "IPC" | "CONTRACT" | "PAYMENT"
  date: string
  title: string
  description: string
  propertyAddress: string
  icon: any
  color: string
  badgeColor: string
}

const EVENT_STYLES = {
  INSPECTION: {
    card: "bg-[#233334]/80 border-[#5E8B8C]/50",
    badge: "bg-[#5E8B8C]/18 text-[#5E8B8C]",
    icon: "text-[#5E8B8C]",
  },
  IPC: {
    card: "bg-[#2E3C35]/80 border-[#5E8B8C]/45",
    badge: "bg-[#5E8B8C]/16 text-[#5E8B8C]",
    icon: "text-[#5E8B8C]",
  },
  IPC_ADJUSTMENT: {
    card: "bg-[#2E3C35]/80 border-[#5E8B8C]/45",
    badge: "bg-[#5E8B8C]/16 text-[#5E8B8C]",
    icon: "text-[#5E8B8C]",
  },
  CONTRACT: {
    card: "bg-[#32282E]/80 border-[#D5C3B6]/40",
    badge: "bg-[#D5C3B6]/20 text-[#D5C3B6]",
    icon: "text-[#D5C3B6]",
  },
  CONTRACT_RENEWAL: {
    card: "bg-[#32282E]/80 border-[#D5C3B6]/40",
    badge: "bg-[#D5C3B6]/20 text-[#D5C3B6]",
    icon: "text-[#D5C3B6]",
  },
  PAYMENT: {
    card: "bg-[#3D3221]/80 border-[#B8965A]/45",
    badge: "bg-[#B8965A]/20 text-[#B8965A]",
    icon: "text-[#B8965A]",
  },
  PAYMENT_DUE: {
    card: "bg-[#3D3221]/80 border-[#B8965A]/45",
    badge: "bg-[#B8965A]/20 text-[#B8965A]",
    icon: "text-[#B8965A]",
  },
  PAYMENT_OVERDUE: {
    card: "bg-[#402728]/85 border-[#C27F79]/55",
    badge: "bg-[#C27F79]/20 text-[#C27F79]",
    icon: "text-[#C27F79]",
  },
  MAINTENANCE: {
    card: "bg-[#3A2E24]/80 border-[#B8965A]/45",
    badge: "bg-[#B8965A]/20 text-[#B8965A]",
    icon: "text-[#B8965A]",
  },
  TENANT_REMINDER: {
    card: "bg-[#3C2B2B]/80 border-[#C27F79]/45",
    badge: "bg-[#C27F79]/22 text-[#C27F79]",
    icon: "text-[#C27F79]",
  },
  DEFAULT: {
    card: "bg-[#2D3C3C]/70 border-[#D5C3B6]/30",
    badge: "bg-[#D5C3B6]/18 text-[#D5C3B6]",
    icon: "text-[#D5C3B6]",
  },
}

type StyleVariant = "OVERDUE" | "PENDING" | undefined
const getStyle = (type: string, variant?: StyleVariant) => {
  if (type === "PAYMENT" && variant === "OVERDUE") return EVENT_STYLES.PAYMENT_OVERDUE
  if (type === "PAYMENT_DUE") return EVENT_STYLES.PAYMENT_DUE
  if (type === "PAYMENT") return EVENT_STYLES.PAYMENT
  if (type === "PAYMENT_OVERDUE") return EVENT_STYLES.PAYMENT_OVERDUE
  if (type === "INSPECTION") return EVENT_STYLES.INSPECTION
  if (type === "IPC_ADJUSTMENT") return EVENT_STYLES.IPC_ADJUSTMENT
  if (type === "IPC") return EVENT_STYLES.IPC
  if (type === "CONTRACT_RENEWAL") return EVENT_STYLES.CONTRACT_RENEWAL
  if (type === "CONTRACT") return EVENT_STYLES.CONTRACT
  if (type === "MAINTENANCE") return EVENT_STYLES.MAINTENANCE
  if (type === "TENANT_REMINDER") return EVENT_STYLES.TENANT_REMINDER
  return EVENT_STYLES.DEFAULT
}

const getInspectionType = (type: string) => {
  const types: Record<string, string> = {
    ROUTINE: "Rutina",
    MOVE_IN: "Entrada",
    MOVE_OUT: "Salida",
    EMERGENCY: "Emergencia",
  }
  return types[type] || type
}

export default async function BrokerCalendarioPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (session.user.role !== "BROKER" && session.user.role !== "OWNER") {
    redirect("/dashboard")
  }

  // Get property IDs managed by this broker
  const mandates = await prisma.mandate.findMany({
    where: { 
      brokerId: session.user.id, 
      status: 'ACTIVE' 
    },
    select: { propertyId: true }
  })
  const propertyIds = mandates.map(m => m.propertyId)

  return <BrokerCalendarClient propertyIds={propertyIds} />
}
