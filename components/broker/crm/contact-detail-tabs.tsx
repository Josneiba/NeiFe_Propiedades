'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ActivityLogModal } from '@/components/broker/crm/activity-log-modal'
import { WhatsAppButton } from '@/components/broker/crm/whatsapp-button'
import { RecommendationsPanel } from '@/components/broker/crm/recommendations-panel'
import { Activity, Phone, Mail, Building2, Clock, CheckCircle2, MessageSquare, Sparkles, Zap, CalendarDays, MapPin, FileText, Share2, UserRound, ClipboardList, CircleAlert } from 'lucide-react'
import { formatDateCompact } from '@/lib/utils'
import { toast } from 'sonner'

interface ContactActivity {
  id: string
  type: string
  title: string
  description?: string | null
  scheduledAt?: string | Date | null
  completedAt?: string | Date | null
  outcome?: string | null
  isDone?: boolean
  createdAt: string | Date
}

interface ContactDealReference {
  deal: {
    id: string
    code: string
    title: string
    stage: string
    property?: { address: string } | null
    workflowInstance?: { id: string; stages: Array<{ id: string; isCompleted: boolean }> } | null
  }
}

interface ContactTask {
  id: string
  title: string
  description?: string | null
  type?: string | null
  dueDate?: string | Date | null
  isCompleted?: boolean | null
  priority?: number | null
}

interface ContactPayment {
  id: string
  amountCLP: number
  status: string
  month: number
  year: number
  createdAt: string | Date
  paidAt?: string | Date | null
}

interface ContactMandate {
  id: string
  expiresAt?: string | Date | null
  status?: string | null
  property?: { address?: string | null; code?: string | null } | null
}

interface ContactRelatedPerson {
  id: string
  name: string
  role?: string | null
  type?: string | null
  phone?: string | null
}

interface ContactAttachment {
  id: string
  fileName: string
  fileUrl: string
}

interface ContactScore {
  score: number
  recommendation: string | null
}

interface ContactDetailTabsProps {
  contact: {
    id: string
    code: string
    name: string
    email?: string | null
    phone?: string | null
    rut?: string | null
    type: string
    status: string
    priority: string
    notes?: string | null
    source?: string | null
    createdAt?: string | Date | null
    updatedAt?: string | Date | null
    preferredChannel?: string | null
    score?: ContactScore | null
    deals: ContactDealReference[]
    activities: ContactActivity[]
    tasks?: ContactTask[]
    payments?: ContactPayment[]
    mandates?: ContactMandate[]
    relatedContacts?: ContactRelatedPerson[]
    attachments?: ContactAttachment[]
    broker?: { name?: string | null }
  }
}

const sourceLabels: Record<string, string> = {
  PORTAL: 'Portal',
  REFERIDO: 'Referido',
  RRSS: 'RRSS',
  LLAMADA_DIRECTA: 'Llamada directa',
  LETRERO: 'Letrero',
  OTRO: 'Otro',
}

const channelLabels: Record<string, string> = {
  TELEFONO: 'Teléfono',
  WHATSAPP: 'WhatsApp',
  EMAIL: 'Email',
  PRESENCIAL: 'Presencial',
  VIDEO: 'Video',
}

const pipelineSteps = [
  { key: 'NUEVO_LEAD', label: 'Lead' },
  { key: 'CONTACTO_INICIADO', label: 'Contacto' },
  { key: 'VISITA_AGENDADA', label: 'Visita' },
  { key: 'PROPIEDAD_CAPTADA', label: 'Captación' },
  { key: 'PUBLICADA', label: 'Publicado' },
  { key: 'MOSTRANDO', label: 'Mostrando' },
  { key: 'OFERTA_RECIBIDA', label: 'Oferta' },
  { key: 'DOCS_REVISION', label: 'Documentos' },
  { key: 'NEGOCIANDO', label: 'Negociación' },
  { key: 'FIRMA_CONTRATO', label: 'Firma' },
  { key: 'ENTREGA_LLAVES', label: 'Entrega' },
  { key: 'ADMINISTRAR', label: 'Administrar' },
]

const timelineIconByType: Record<string, { icon: typeof Activity; color: string }> = {
  VISITA: { icon: CalendarDays, color: 'text-[#B8965A]' },
  LLAMADA: { icon: Phone, color: 'text-[#5E8B8C]' },
  WHATSAPP: { icon: MessageSquare, color: 'text-[#22c55e]' },
  EMAIL: { icon: Mail, color: 'text-[#60a5fa]' },
  CONTRATO: { icon: FileText, color: 'text-[#C27F79]' },
  PAGO: { icon: CheckCircle2, color: 'text-[#22c55e]' },
  MANTENCION: { icon: Building2, color: 'text-[#B8965A]' },
  REPROGRAMAR: { icon: Clock, color: 'text-[#ef4444]' },
  NUEVO_PROSPECTO: { icon: Sparkles, color: 'text-[#C27F79]' },
}

function formatRelativeDate(value?: string | Date | null) {
  if (!value) return null
  const date = new Date(value)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffDays = Math.round(diffMs / 86_400_000)
  if (diffDays === 0) return 'Hoy'
  if (diffDays === 1) return 'Mañana'
  if (diffDays === -1) return 'Ayer'
  if (Math.abs(diffDays) < 7) return diffDays > 0 ? `En ${diffDays} días` : `Hace ${Math.abs(diffDays)} días`
  return date.toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })
}

function buildMapUrl(address?: string | null) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address ?? '')}`
}

function buildWhatsAppUrl(phone?: string | null) {
  if (!phone) return null
  const clean = phone.replace(/\D/g, '')
  const withCountry = clean.startsWith('56') ? clean : `56${clean}`
  return `https://wa.me/${withCountry}`
}

function capitalize(str?: string | null) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function ContactDetailTabs({ contact }: ContactDetailTabsProps) {
  const [activities, setActivities] = useState<ContactActivity[]>(contact.activities)
  const [loadingTimeline, setLoadingTimeline] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [refreshIndex, setRefreshIndex] = useState(0)
  const [selectedTaskFilter, setSelectedTaskFilter] = useState<'all' | 'pending' | 'inProgress' | 'completed' | 'cancelled' | 'reprogrammed'>('all')

  const lastActivity = useMemo(() => activities[0], [activities])

  const weekProgress = useMemo(() => {
    const total = activities.length
    const target = 6
    return Math.min(100, Math.round((total / target) * 100))
  }, [activities.length])

  const dealCount = contact.deals.length
  const totalActivities = activities.length
  const lastContactDate = lastActivity?.createdAt
  const daysSinceLastContact = useMemo(() => {
    if (!lastContactDate) return null
    return Math.floor((new Date().getTime() - new Date(lastContactDate).getTime()) / (1000 * 60 * 60 * 24))
  }, [lastContactDate])

  const preferredTimes = useMemo(() => {
    const items = activities || []
    if (!items || items.length < 3) return null

    const counts: Record<string, number> = {}
    items.forEach((a) => {
      const raw = a.scheduledAt ? new Date(a.scheduledAt as string) : new Date(a.createdAt as string)
      if (isNaN(raw.getTime())) return
      const day = raw.toLocaleDateString('es-CL', { weekday: 'long' })
      const hour = raw.getHours()
      let block = ''
      if (hour >= 6 && hour < 12) block = 'Mañana'
      else if (hour >= 12 && hour < 18) block = 'Tarde'
      else block = 'Noche'
      const key = `${day}|${block}`
      counts[key] = (counts[key] ?? 0) + 1
    })

    const arr = Object.entries(counts).map(([k, v]) => ({ key: k, count: v }))
    arr.sort((a, b) => b.count - a.count)
    return arr.slice(0, 3).map((it) => {
      const [day, block] = it.key.split('|')
      return { day: capitalize(day), block, count: it.count }
    })
  }, [activities])

  const dealStage = contact.deals.find(({ deal }) => deal.stage)?.deal.stage ?? 'NUEVO_LEAD'
  const currentPipelineIndex = pipelineSteps.findIndex((step) => step.key === dealStage)
  const currentStageLabel = pipelineSteps[Math.max(0, currentPipelineIndex)].label
  const workflowProgress = useMemo(() => {
    const deal = contact.deals.find(({ deal }) => deal.workflowInstance?.stages?.length)
    if (!deal?.deal.workflowInstance?.stages?.length) return null
    const stages = deal.deal.workflowInstance.stages
    const completed = stages.filter((stage) => stage.isCompleted).length
    return {
      dealId: deal.deal.id,
      title: deal.deal.title,
      completed,
      total: stages.length,
      percent: Math.round((completed / stages.length) * 100),
    }
  }, [contact.deals])

  const taskItems = useMemo(() => {
    const items = (contact.tasks ?? []).map((task) => {
      const dueDate = task.dueDate ? new Date(task.dueDate) : null
      const now = new Date()
      let status: 'pending' | 'inProgress' | 'completed' | 'cancelled' | 'reprogrammed' = 'pending'
      if (task.isCompleted) status = 'completed'
      else if (dueDate && dueDate < now) status = 'inProgress'
      return { ...task, status, kind: 'task' as const, date: dueDate }
    })
    const activityItems = activities.map((activity) => {
      let status: 'pending' | 'inProgress' | 'completed' | 'cancelled' | 'reprogrammed' = 'pending'
      if (activity.isDone) status = 'completed'
      else if (activity.outcome === 'REPROGRAMAR') status = 'reprogrammed'
      else if (activity.outcome === 'NO_CONTESTO') status = 'cancelled'
      else if (activity.scheduledAt && new Date(activity.scheduledAt) < new Date()) status = 'inProgress'
      return { ...activity, status, kind: 'activity' as const, date: activity.scheduledAt ? new Date(activity.scheduledAt) : new Date(activity.createdAt) }
    })
    return [...items, ...activityItems]
  }, [activities, contact.tasks])

  const actionStats = useMemo(() => {
    const pending = taskItems.filter((item) => item.status === 'pending').length
    const inProgress = taskItems.filter((item) => item.status === 'inProgress').length
    const completed = taskItems.filter((item) => item.status === 'completed').length
    const cancelled = taskItems.filter((item) => item.status === 'cancelled').length
    const reprogrammed = taskItems.filter((item) => item.status === 'reprogrammed').length
    return { pending, inProgress, completed, cancelled, reprogrammed }
  }, [taskItems])

  const filteredActionItems = useMemo(() => {
    if (selectedTaskFilter === 'all') return taskItems
    return taskItems.filter((item) => item.status === selectedTaskFilter)
  }, [selectedTaskFilter, taskItems])

  const upcomingItems = useMemo(() => {
    const upcoming = taskItems
      .filter((item) => (item.kind === 'task' ? !item.isCompleted : !item.isDone))
      .filter((item) => item.date && item.date.getTime() >= Date.now())
      .sort((a, b) => (a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0))
    return upcoming.slice(0, 4)
  }, [taskItems])

  const bannerState = useMemo(() => {
    const expiringMandate = contact.mandates?.find((mandate) => mandate.expiresAt && new Date(mandate.expiresAt).getTime() <= Date.now() + 15 * 86_400_000)
    const overduePayment = contact.payments?.find((payment) => payment.status === 'OVERDUE' || (payment.status === 'PENDING' && new Date(payment.createdAt).getTime() <= Date.now() - 30 * 86_400_000))
    const signingTask = taskItems.find((item) => /firma|contrato/i.test(item.title))
    const nextVisit = taskItems.find((item) => item.kind === 'activity' && item.type === 'VISITA' && !item.isDone)

    if (expiringMandate) {
      return { tone: 'danger', icon: CircleAlert, title: `Contrato vence ${formatRelativeDate(expiringMandate.expiresAt)}`, description: expiringMandate.property?.address ?? 'Revisa el contrato' }
    }
    if (overduePayment) {
      return { tone: 'warning', icon: Clock, title: `Pago pendiente desde ${formatRelativeDate(overduePayment.createdAt)}`, description: `Monto CLP ${overduePayment.amountCLP.toLocaleString('es-CL')}` }
    }
    if (signingTask) {
      return { tone: 'accent', icon: FileText, title: `Firma de contrato programada — ${formatRelativeDate(signingTask.date)}`, description: signingTask.title }
    }
    if (nextVisit) {
      return { tone: 'info', icon: CalendarDays, title: `Visita programada — ${formatRelativeDate(nextVisit.date)}`, description: nextVisit.title }
    }

    return { tone: 'neutral', icon: CheckCircle2, title: 'Sin acciones urgentes', description: 'El cliente está estable y sin hitos críticos por ahora.' }
  }, [contact.mandates, contact.payments, taskItems])

  useEffect(() => {
    async function fetchTimeline() {
      if (!contact.id) return
      setLoadingTimeline(true)
      try {
        const res = await fetch(`/api/crm/activities?contactId=${contact.id}`)
        if (!res.ok) throw new Error('No se pudo cargar la línea de tiempo')
        const data = await res.json()
        setActivities(data)
      } catch (error) {
        console.error(error)
        toast.error('No se pudo cargar la línea de tiempo del contacto')
      } finally {
        setLoadingTimeline(false)
      }
    }

    fetchTimeline()
  }, [contact.id, refreshIndex])

  const handleRefreshTimeline = () => setRefreshIndex((current) => current + 1)

  const handleWhatsAppAction = async () => {
    if (!contact.phone) return
    try {
      await fetch('/api/crm/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'WHATSAPP', title: `WhatsApp a ${contact.name}`, description: `Mensaje enviado a ${contact.name}`, contactId: contact.id, isDone: false }),
      })
      handleRefreshTimeline()
      toast.success('Actividad de WhatsApp registrada')
    } catch (error) {
      console.error(error)
      toast.error('No se pudo registrar la actividad de WhatsApp')
    }
  }

  const handleShareAction = async (kind: 'ficha' | 'propiedad' | 'contrato' | 'documentos') => {
    const shareUrl = `${window.location.origin}/broker/crm/contactos/${contact.id}`
    const propertyAddress = contact.deals.find(({ deal }) => deal.property?.address)?.deal.property?.address
    const shareText = kind === 'propiedad'
      ? `Propiedad relacionada con ${contact.name}: ${propertyAddress ?? 'revisar en CRM'}`
      : kind === 'contrato'
        ? `Contrato relacionado con ${contact.name}: ${shareUrl}`
        : kind === 'documentos'
          ? `Documentos de ${contact.name}: ${shareUrl}`
          : `Ficha de ${contact.name}: ${shareUrl}`

    try {
      if (navigator.share) {
        await navigator.share({ title: `NeiFe CRM · ${contact.name}`, text: shareText, url: shareUrl })
      } else {
        await navigator.clipboard.writeText(shareText)
      }
      toast.success('Se compartió la información')
    } catch {
      toast.error('No se pudo compartir la información')
    }
  }

  const BannerIcon = bannerState.icon
  const bannerColor = bannerState.tone === 'danger' ? 'border-red-500/30 bg-red-500/10 text-red-200' : bannerState.tone === 'warning' ? 'border-[#B8965A]/30 bg-[#B8965A]/10 text-[#F8D291]' : bannerState.tone === 'accent' ? 'border-[#C27F79]/30 bg-[#C27F79]/10 text-[#F9D5D0]' : bannerState.tone === 'info' ? 'border-[#5E8B8C]/30 bg-[#5E8B8C]/10 text-[#D8F0EE]' : 'border-[#2D3C3C] bg-[#212E2E] text-[#D5C3B6]'

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm text-[#9C8578]">Perfil CRM</p>
            <h2 className="text-2xl font-semibold text-[#FAF6F2]">{contact.name}</h2>
            <p className="text-xs text-[#B8965A] mt-1">{contact.code}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/broker/crm/contactos" className="text-sm text-[#9C8578] hover:text-[#FAF6F2]">Volver a contactos</Link>
            {contact.phone && <WhatsAppButton phone={contact.phone} message={`Hola ${contact.name}, te escribo desde NeiFe CRM para avanzar en tu operación.`} onAction={handleWhatsAppAction} />}
          </div>
        </div>

        <div className={`rounded-3xl border p-4 ${bannerColor}`}>
          <div className="flex items-start gap-3">
            <div className="rounded-2xl border border-current/20 bg-black/10 p-2">
              <BannerIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] opacity-80">Hito crítico</p>
              <h3 className="mt-1 text-lg font-semibold">{bannerState.title}</h3>
              <p className="mt-1 text-sm opacity-90">{bannerState.description}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#1C2828] border border-[#D5C3B6]/10 rounded-3xl p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-[#D5C3B6]/10 bg-[#212E2E] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#9C8578]">Deals</p>
              <p className="mt-3 text-3xl font-semibold text-[#FAF6F2]">{dealCount}</p>
            </div>
            <div className="rounded-2xl border border-[#D5C3B6]/10 bg-[#212E2E] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#9C8578]">Interacciones</p>
              <p className="mt-3 text-3xl font-semibold text-[#FAF6F2]">{totalActivities}</p>
            </div>
            <div className="rounded-2xl border border-[#D5C3B6]/10 bg-[#212E2E] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#9C8578]">Último contacto</p>
              <p className="mt-3 text-3xl font-semibold text-[#FAF6F2]">{lastContactDate ? formatDateCompact(lastContactDate, { day: '2-digit', month: 'short' }) : 'Nunca'}</p>
            </div>
            <div className="rounded-2xl border border-[#D5C3B6]/10 bg-[#212E2E] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#9C8578]">Prioridad</p>
              <Badge variant="outline" className="mt-3 text-xs border-[#D5C3B6]/20 text-[#9C8578]">{contact.priority}</Badge>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs text-[#9C8578]">Estado</p>
              <Badge variant="outline" className="mt-2 text-xs border-[#D5C3B6]/20 text-[#9C8578]">{contact.status}</Badge>
            </div>
            <div>
              <p className="text-xs text-[#9C8578]">Score</p>
              <p className="mt-2 text-2xl font-semibold" style={{ color: contact.score?.score ? contact.score.score > 70 ? '#22c55e' : contact.score.score > 40 ? '#f59e0b' : '#ef4444' : '#D5C3B6' }}>{contact.score?.score ?? '—'}</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-[#1C2828] border border-[#D5C3B6]/10 rounded-full p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#5E8B8C] data-[state=active]:text-[#FAF6F2] text-sm text-[#9C8578]">Perfil</TabsTrigger>
            <TabsTrigger value="progress" className="data-[state=active]:bg-[#5E8B8C] data-[state=active]:text-[#FAF6F2] text-sm text-[#9C8578]">Progreso</TabsTrigger>
            <TabsTrigger value="timeline" className="data-[state=active]:bg-[#5E8B8C] data-[state=active]:text-[#FAF6F2] text-sm text-[#9C8578]">Historial</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
              <section className="space-y-4 bg-[#1C2828] border border-[#D5C3B6]/10 rounded-3xl p-6">
                <div className="flex items-center gap-2 text-[#9C8578] text-xs uppercase tracking-[0.2em]">
                  <Activity className="h-4 w-4 text-[#5E8B8C]" />
                  <span>Información de contacto</span>
                </div>
                <div className="space-y-3 text-sm text-[#D5C3B6]">
                  {contact.phone && (
                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#D5C3B6]/10 bg-[#212E2E] p-3">
                      <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-[#5E8B8C]" /><span>{contact.phone}</span></div>
                      <a href={`tel:${contact.phone}`} className="rounded-full border border-[#D5C3B6]/10 px-3 py-1 text-xs text-[#FAF6F2]"> <Phone className="h-3.5 w-3.5 mr-1 inline" /> Llamar</a>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#D5C3B6]/10 bg-[#212E2E] p-3">
                      <div className="flex items-center gap-3"><MessageSquare className="h-4 w-4 text-[#25D366]" /><span>WhatsApp</span></div>
                      <a href={buildWhatsAppUrl(contact.phone) ?? '#'} target="_blank" rel="noreferrer" className="rounded-full border border-[#D5C3B6]/10 px-3 py-1 text-xs text-[#FAF6F2]"> <MessageSquare className="h-3.5 w-3.5 mr-1 inline" /> WhatsApp</a>
                    </div>
                  )}
                  {contact.email && (
                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#D5C3B6]/10 bg-[#212E2E] p-3">
                      <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-[#60a5fa]" /><span>{contact.email}</span></div>
                      <a href={`mailto:${contact.email}`} className="rounded-full border border-[#D5C3B6]/10 px-3 py-1 text-xs text-[#FAF6F2]">✉ Correo</a>
                    </div>
                  )}
                  {(contact.deals.find(({ deal }) => deal.property?.address)?.deal.property?.address || contact.notes) && (
                    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#D5C3B6]/10 bg-[#212E2E] p-3">
                      <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-[#B8965A]" /><span>{contact.deals.find(({ deal }) => deal.property?.address)?.deal.property?.address ?? 'Sin ubicación disponible'}</span></div>
                      <a href={buildMapUrl(contact.deals.find(({ deal }) => deal.property?.address)?.deal.property?.address)} target="_blank" rel="noreferrer" className="rounded-full border border-[#D5C3B6]/10 px-3 py-1 text-xs text-[#FAF6F2]"> <MapPin className="h-3.5 w-3.5 mr-1 inline" /> Ver ubicación</a>
                    </div>
                  )}
                  {/* Horarios preferidos: muestra las 2-3 combinaciones día+franja con más actividad histórica */}
                  {preferredTimes ? (
                    <div className="mt-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-[#9C8578]">Horarios preferidos</p>
                      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                        {preferredTimes.map((pt) => (
                          <div key={`${pt.day}-${pt.block}`} className="rounded-2xl border border-[#D5C3B6]/10 bg-[#212E2E] p-3 text-sm text-[#D5C3B6]">
                            <p className="text-xs text-[#9C8578]">{pt.day}</p>
                            <p className="mt-1 text-sm font-semibold text-[#FAF6F2]">{pt.block}</p>
                            <p className="mt-1 text-xs text-[#9C8578]">{pt.count} interacciones</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : activities.length < 3 ? (
                    <div className="mt-3 text-sm text-[#9C8578]">Aún no hay suficientes interacciones para calcular horarios preferidos.</div>
                  ) : null}
                </div>
              </section>

              <section className="space-y-4 bg-[#1C2828] border border-[#D5C3B6]/10 rounded-3xl p-6">
                <div className="flex items-center gap-2 text-[#9C8578] text-xs uppercase tracking-[0.2em]">
                  <UserRound className="h-4 w-4 text-[#5E8B8C]" />
                  <span>Registro y asignación</span>
                </div>
                <div className="space-y-3 text-sm text-[#D5C3B6]">
                  <div className="rounded-2xl border border-[#D5C3B6]/10 bg-[#212E2E] p-3">
                    <p className="text-xs text-[#9C8578]">Origen</p>
                    <p className="mt-1 text-[#FAF6F2]">{sourceLabels[contact.source ?? 'OTRO'] ?? contact.source}</p>
                  </div>
                  <div className="rounded-2xl border border-[#D5C3B6]/10 bg-[#212E2E] p-3">
                    <p className="text-xs text-[#9C8578]">Creado</p>
                    <p className="mt-1 text-[#FAF6F2]">{contact.createdAt ? formatDateCompact(contact.createdAt, { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</p>
                  </div>
                  <div className="rounded-2xl border border-[#D5C3B6]/10 bg-[#212E2E] p-3">
                    <p className="text-xs text-[#9C8578]">Responsable</p>
                    <p className="mt-1 text-[#FAF6F2]">{contact.broker?.name ?? 'Sin asignación'}</p>
                  </div>
                  <div className="rounded-2xl border border-[#D5C3B6]/10 bg-[#212E2E] p-3">
                    <p className="text-xs text-[#9C8578]">Canal preferido</p>
                    <p className="mt-1 text-[#FAF6F2]">{contact.preferredChannel ? channelLabels[contact.preferredChannel] ?? contact.preferredChannel : 'No definido'}</p>
                  </div>
                  <div className="rounded-2xl border border-[#D5C3B6]/10 bg-[#212E2E] p-3">
                    <p className="text-xs text-[#9C8578]">Última actualización</p>
                    <p className="mt-1 text-[#FAF6F2]">{contact.updatedAt ? formatDateCompact(contact.updatedAt, { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</p>
                  </div>
                </div>
              </section>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <section className="bg-[#1C2828] border border-[#D5C3B6]/10 rounded-3xl p-6">
                <div className="flex items-center gap-2 text-[#9C8578] text-xs uppercase tracking-[0.2em]">
                  <ClipboardList className="h-4 w-4 text-[#5E8B8C]" />
                  <span>Etiquetas / grupos inteligentes</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="outline" className="border-[#D5C3B6]/20 text-[#9C8578]">{contact.priority}</Badge>
                  <Badge variant="outline" className="border-[#D5C3B6]/20 text-[#9C8578]">{contact.status}</Badge>
                  {daysSinceLastContact !== null && daysSinceLastContact > 30 ? <Badge variant="outline" className="border-[#B8965A]/20 text-[#B8965A]">Sin contacto reciente</Badge> : null}
                  {contact.type ? <Badge variant="outline" className="border-[#5E8B8C]/20 text-[#5E8B8C]">{contact.type}</Badge> : null}
                </div>
              </section>

              <section className="bg-[#1C2828] border border-[#D5C3B6]/10 rounded-3xl p-6">
                <div className="flex items-center gap-2 text-[#9C8578] text-xs uppercase tracking-[0.2em]">
                  <Building2 className="h-4 w-4 text-[#5E8B8C]" />
                  <span>Deals asociados</span>
                </div>
                <div className="mt-4 space-y-3">
                  {contact.deals.length === 0 ? <p className="text-sm text-[#9C8578]">Sin ofertas vinculadas.</p> : contact.deals.map(({ deal }) => (
                    <Link key={deal.id} href="/broker/crm/workspace" className="block rounded-2xl border border-[#D5C3B6]/10 bg-[#212E2E] p-3 text-sm text-[#FAF6F2]">
                      <div className="flex items-center justify-between gap-2">
                        <span>{deal.title}</span>
                        <Badge variant="outline" className="text-[10px] border-[#D5C3B6]/20 text-[#9C8578]">{deal.stage}</Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            </div>
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            <section className="bg-[#1C2828] border border-[#D5C3B6]/10 rounded-3xl p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#9C8578]">Resumen del proceso</p>
                  <h3 className="mt-2 text-lg font-semibold text-[#FAF6F2]">Paso actual: {currentStageLabel}</h3>
                </div>
                <Button size="sm" variant="outline" className="border-[#D5C3B6]/20 text-[#9C8578]" onClick={handleRefreshTimeline}>Actualizar</Button>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-6">
                {pipelineSteps.map((step, index) => {
                  const active = index <= currentPipelineIndex
                  return <div key={step.key} className={`rounded-2xl border px-3 py-2 text-center text-sm ${active ? 'border-[#5E8B8C]/40 bg-[#5E8B8C]/10 text-[#FAF6F2]' : 'border-[#D5C3B6]/10 bg-[#212E2E] text-[#9C8578]'}`}>{step.label}</div>
                })}
              </div>
              {workflowProgress ? (
                <Link href="/broker/crm/workspace" className="mt-5 block rounded-2xl border border-[#5E8B8C]/30 bg-[#5E8B8C]/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-[#9C8578]">Workflow configurable</p>
                      <p className="mt-1 text-sm font-semibold text-[#FAF6F2]">{workflowProgress.title}</p>
                    </div>
                    <Badge variant="outline" className="border-[#5E8B8C]/30 text-[#D8F0EE]">
                      {workflowProgress.percent}% · {workflowProgress.completed}/{workflowProgress.total}
                    </Badge>
                  </div>
                </Link>
              ) : null}
            </section>

            <section className="bg-[#1C2828] border border-[#D5C3B6]/10 rounded-3xl p-6">
              <div className="flex items-center gap-2 text-[#9C8578] text-xs uppercase tracking-[0.2em]">
                <CheckCircle2 className="h-4 w-4 text-[#5E8B8C]" />
                <span>Acciones pendientes</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  { key: 'all', label: 'Todas' },
                  { key: 'pending', label: 'Pendientes' },
                  { key: 'inProgress', label: 'En proceso' },
                  { key: 'completed', label: 'Completadas' },
                  { key: 'cancelled', label: 'Canceladas' },
                  { key: 'reprogrammed', label: 'Reprogramadas' },
                ].map((option) => {
                  const count = option.key === 'all' ? taskItems.length : actionStats[option.key as keyof typeof actionStats]
                  return (
                    <button key={option.key} onClick={() => setSelectedTaskFilter(option.key as typeof selectedTaskFilter)} className={`rounded-full px-3 py-1.5 text-sm ${selectedTaskFilter === option.key ? 'bg-[#5E8B8C] text-[#FAF6F2]' : 'bg-[#212E2E] text-[#D5C3B6]'}`}>
                      {option.label} · {count}
                    </button>
                  )
                })}
              </div>
              <div className="mt-4 space-y-3">
                {filteredActionItems.length === 0 ? <p className="text-sm text-[#9C8578]">No hay registros para esta vista.</p> : filteredActionItems.map((item) => (
                  <div key={`${item.kind}-${item.id}`} className="rounded-2xl border border-[#D5C3B6]/10 bg-[#212E2E] p-3 text-sm text-[#D5C3B6]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[#FAF6F2]">{item.title}</span>
                      <Badge variant="outline" className="text-[10px] border-[#D5C3B6]/20 text-[#9C8578]">{item.status}</Badge>
                    </div>
                    {item.description ? <p className="mt-2 text-sm">{item.description}</p> : null}
                    {item.date ? <p className="mt-2 text-xs text-[#9C8578]">{formatDateCompact(item.date, { day: '2-digit', month: 'short', year: 'numeric' })}</p> : null}
                  </div>
                ))}
              </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <section className="bg-[#1C2828] border border-[#D5C3B6]/10 rounded-3xl p-6">
                <div className="flex items-center gap-2 text-[#9C8578] text-xs uppercase tracking-[0.2em]">
                  <FileText className="h-4 w-4 text-[#5E8B8C]" />
                  <span>Documentación</span>
                </div>
                <div className="mt-4 space-y-3">
                  {(contact.attachments ?? []).length > 0 ? contact.attachments?.map((attachment) => (
                    <a key={attachment.id} href={attachment.fileUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-2xl border border-[#D5C3B6]/10 bg-[#212E2E] p-3 text-sm text-[#FAF6F2]">
                      <span>{attachment.fileName}</span>
                      <Badge variant="outline" className="text-[10px] border-[#5E8B8C]/20 text-[#5E8B8C]">Entregado</Badge>
                    </a>
                  )) : <p className="text-sm text-[#9C8578]">Aún no hay documentos cargados para este cliente.</p>}
                </div>
              </section>

              <section className="bg-[#1C2828] border border-[#D5C3B6]/10 rounded-3xl p-6">
                <div className="flex items-center gap-2 text-[#9C8578] text-xs uppercase tracking-[0.2em]">
                  <CalendarDays className="h-4 w-4 text-[#5E8B8C]" />
                  <span>Visitas</span>
                </div>
                <div className="mt-4 space-y-3">
                  {activities.filter((activity) => activity.type === 'VISITA').length === 0 ? <p className="text-sm text-[#9C8578]">No hay visitas registradas.</p> : activities.filter((activity) => activity.type === 'VISITA').map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between rounded-2xl border border-[#D5C3B6]/10 bg-[#212E2E] p-3 text-sm text-[#FAF6F2]">
                      <span>{activity.title}</span>
                      {activity.isDone ? <CheckCircle2 className="h-4 w-4 text-[#22c55e]" /> : <Clock className="h-4 w-4 text-[#B8965A]" />}
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <section className="bg-[#1C2828] border border-[#D5C3B6]/10 rounded-3xl p-6">
              <div className="flex items-center gap-2 text-[#9C8578] text-xs uppercase tracking-[0.2em]">
                <UserRound className="h-4 w-4 text-[#5E8B8C]" />
                <span>Personas relacionadas</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {(contact.relatedContacts ?? []).length === 0 ? <p className="text-sm text-[#9C8578]">No hay personas vinculadas en este deal.</p> : (contact.relatedContacts ?? []).map((person) => (
                  <Badge key={person.id} variant="outline" className="border-[#D5C3B6]/20 text-[#9C8578]">{person.name} · {person.role ?? 'Relación'}</Badge>
                ))}
              </div>
            </section>

            <section className="bg-[#1C2828] border border-[#D5C3B6]/10 rounded-3xl p-6">
              <div className="flex items-center gap-2 text-[#9C8578] text-xs uppercase tracking-[0.2em]">
                <Share2 className="h-4 w-4 text-[#5E8B8C]" />
                <span>Compartir información</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" className="border-[#D5C3B6]/20 text-[#9C8578]" onClick={() => void handleShareAction('ficha')}>Enviar Ficha</Button>
                <Button size="sm" variant="outline" className="border-[#D5C3B6]/20 text-[#9C8578]" onClick={() => void handleShareAction('propiedad')}>Compartir Propiedad</Button>
                <Button size="sm" variant="outline" className="border-[#D5C3B6]/20 text-[#9C8578]" onClick={() => void handleShareAction('contrato')}>Enviar Contrato</Button>
                <Button size="sm" variant="outline" className="border-[#D5C3B6]/20 text-[#9C8578]" onClick={() => void handleShareAction('documentos')}>Enviar Documentos</Button>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            <section className="bg-[#1C2828] border border-[#D5C3B6]/10 rounded-3xl p-6">
              <div className="flex items-center gap-2 text-[#9C8578] text-xs uppercase tracking-[0.2em]">
                <CalendarDays className="h-4 w-4 text-[#5E8B8C]" />
                <span>Próximas actividades</span>
              </div>
              <div className="mt-4 space-y-3">
                {upcomingItems.length === 0 ? <p className="text-sm text-[#9C8578]">No hay actividades próximas registradas.</p> : upcomingItems.map((item) => (
                  <Link key={`${item.kind}-${item.id}`} href={`#${item.kind}-${item.id}`} className="flex items-center justify-between rounded-2xl border border-[#D5C3B6]/10 bg-[#212E2E] p-3 text-sm text-[#FAF6F2]">
                    <span>{item.title}</span>
                    <span className="text-xs text-[#9C8578]">{formatRelativeDate(item.date)}</span>
                  </Link>
                ))}
              </div>
            </section>

            <div className="rounded-3xl border border-[#D5C3B6]/10 bg-[#1C2828] p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#9C8578]">Historial cronológico</p>
                  <h3 className="text-lg font-semibold text-[#FAF6F2]">Registro completo</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => setIsModalOpen(true)}>Registrar actividad</Button>
                  {contact.phone && <WhatsAppButton phone={contact.phone} message={`Hola ${contact.name}, te escribo desde NeiFe CRM para avanzar en tu operación.`} onAction={handleWhatsAppAction} />}
                </div>
              </div>

              {loadingTimeline ? (
                <div className="mt-4 space-y-3 animate-pulse"><div className="h-4 w-1/3 bg-[#2D3C3C] rounded" /><div className="h-4 w-full bg-[#2D3C3C] rounded" /><div className="h-4 w-5/6 bg-[#2D3C3C] rounded" /></div>
              ) : activities.length === 0 ? (
                <div className="mt-4 py-10 text-center text-sm text-[#9C8578]">No hay actividades registradas para este contacto.</div>
              ) : (
                <div className="mt-4 space-y-4">
                  {activities.map((activity) => {
                    const entry = timelineIconByType[activity.type] ?? timelineIconByType.NUEVO_PROSPECTO
                    const Icon = entry.icon
                    return (
                      <div key={activity.id} id={`activity-${activity.id}`} className="rounded-2xl border border-[#D5C3B6]/10 bg-[#212E2E] p-4">
                        <div className="flex items-start gap-3">
                          <div className={`rounded-2xl border border-current/20 bg-black/10 p-2 ${entry.color}`}><Icon className="h-4 w-4" /></div>
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-[#FAF6F2]">{activity.title}</p>
                              <Badge variant="outline" className="text-[10px] border-[#D5C3B6]/20 text-[#9C8578]">{activity.isDone ? 'Completado' : 'Pendiente'}</Badge>
                            </div>
                            <p className="mt-1 text-xs text-[#9C8578]">{activity.type} · {formatDateCompact(activity.createdAt, { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                            {activity.description ? <p className="mt-3 text-sm text-[#D5C3B6]">{activity.description}</p> : null}
                            {activity.outcome ? <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[#9C8578]">Resultado: {activity.outcome}</p> : null}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <aside className="space-y-6">
        <div className="rounded-3xl border border-[#D5C3B6]/10 bg-[#1C2828] p-6">
          <div className="flex items-center gap-3 text-[#9C8578] text-xs uppercase tracking-[0.2em] mb-4">
            <CheckCircle2 className="h-4 w-4 text-[#5E8B8C]" />
            <span>Prioridades rápidas</span>
          </div>
          <div className="space-y-4 text-sm text-[#D5C3B6]">
            <div className="rounded-2xl border border-[#D5C3B6]/10 bg-[#212E2E] p-4">
              <p className="text-xs text-[#9C8578]">Última actividad</p>
              <p className="mt-2 text-sm font-semibold text-[#FAF6F2]">{lastActivity?.title ?? 'Sin registro'}</p>
              <p className="mt-1 text-xs text-[#9C8578]">{lastActivity ? formatDateCompact(lastActivity.createdAt, { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</p>
            </div>
            {contact.score ? <div className="rounded-2xl border border-[#D5C3B6]/10 bg-[#212E2E] p-4"><p className="text-xs text-[#9C8578]">Recomendación</p><p className="mt-2 text-sm text-[#D5C3B6]">{contact.score.recommendation}</p></div> : null}
          </div>
        </div>

        <div className="rounded-3xl border border-[#D5C3B6]/10 bg-[#1C2828] p-6">
          <div className="flex items-center gap-3 text-[#9C8578] text-xs uppercase tracking-[0.2em] mb-4">
            <MessageSquare className="h-4 w-4 text-[#5E8B8C]" />
            <span>Acciones rápidas</span>
          </div>
          <div className="flex flex-col gap-3">
            {contact.phone ? <Button variant="outline" size="sm" className="border-[#D5C3B6]/20 text-[#9C8578]" onClick={handleWhatsAppAction}>Iniciar chat WhatsApp</Button> : null}
            {contact.email ? <Button asChild variant="outline" size="sm" className="border-[#D5C3B6]/20 text-[#9C8578]"><a href={`mailto:${contact.email}`}>Enviar email</a></Button> : null}
          </div>
        </div>

        <div className="rounded-3xl border border-[#D5C3B6]/10 bg-[#1C2828] p-6">
          <div className="flex items-center gap-3 text-[#9C8578] text-xs uppercase tracking-[0.2em] mb-4">
            <Zap className="h-4 w-4 text-[#5E8B8C]" />
            <span>Recomendaciones</span>
          </div>
          <RecommendationsPanel contactId={contact.id} />
        </div>
      </aside>

      <ActivityLogModal open={isModalOpen} onClose={() => setIsModalOpen(false)} onCreated={() => { setIsModalOpen(false); handleRefreshTimeline() }} contactId={contact.id} />
    </div>
  )
}
