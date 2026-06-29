'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ActivityLogModal } from '@/components/broker/crm/activity-log-modal'
import { WhatsAppButton } from '@/components/broker/crm/whatsapp-button'
import { RecommendationsPanel } from '@/components/broker/crm/recommendations-panel'
import { Activity, Phone, Mail, Copy, Building2, Clock, CheckCircle2, MessageSquare, Sparkles, Zap } from 'lucide-react'
import { formatDateCompact } from '@/lib/utils'
import { toast } from 'sonner'

interface ContactActivity {
  id: string
  type: string
  title: string
  description?: string | null
  scheduledAt?: string | Date | null
  completedAt?: string | Date | null
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
  }
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
    score?: ContactScore | null
    deals: ContactDealReference[]
    activities: ContactActivity[]
  }
}

export function ContactDetailTabs({ contact }: ContactDetailTabsProps) {
  const [activities, setActivities] = useState<ContactActivity[]>(contact.activities)
  const [loadingTimeline, setLoadingTimeline] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [refreshIndex, setRefreshIndex] = useState(0)

  const lastActivity = useMemo(() => {
    return activities[0]
  }, [activities])

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
    const diff = Math.floor((new Date().getTime() - new Date(lastContactDate).getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }, [lastContactDate])

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

  const handleRefreshTimeline = () => {
    setRefreshIndex((current) => current + 1)
  }

  const handleWhatsAppAction = async () => {
    if (!contact.phone) return

    try {
      await fetch('/api/crm/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'WHATSAPP',
          title: `WhatsApp a ${contact.name}`,
          description: `Mensaje enviado a ${contact.name}`,
          contactId: contact.id,
          isDone: false,
        }),
      })
      handleRefreshTimeline()
      toast.success('Actividad de WhatsApp registrada')
    } catch (error) {
      console.error(error)
      toast.error('No se pudo registrar la actividad de WhatsApp')
    }
  }

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
            <Link href="/broker/crm/contactos" className="text-sm text-[#9C8578] hover:text-[#FAF6F2]">
              Volver a contactos
            </Link>
            {contact.phone && (
              <WhatsAppButton
                phone={contact.phone}
                message={`Hola ${contact.name}, te escribo desde NeiFe CRM para avanzar en tu operación.`}
                onAction={handleWhatsAppAction}
              />
            )}
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
              <p className="mt-3 text-3xl font-semibold text-[#FAF6F2]">
                {lastContactDate ? formatDateCompact(lastContactDate, { day: '2-digit', month: 'short' }) : 'Nunca'}
              </p>
            </div>
            <div className="rounded-2xl border border-[#D5C3B6]/10 bg-[#212E2E] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#9C8578]">Prioridad</p>
              <Badge variant="outline" className="mt-3 text-xs border-[#D5C3B6]/20 text-[#9C8578]">
                {contact.priority}
              </Badge>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-[#9C8578]">Estado</p>
              <Badge variant="outline" className="mt-2 text-xs border-[#D5C3B6]/20 text-[#9C8578]">
                {contact.status}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-[#9C8578]">Score</p>
              <p className="mt-2 text-2xl font-semibold" style={{ color: contact.score?.score ? contact.score.score > 70 ? '#22c55e' : contact.score.score > 40 ? '#f59e0b' : '#ef4444' : '#D5C3B6' }}>
                {contact.score?.score ?? '—'}
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-[#1C2828] border border-[#D5C3B6]/10 rounded-full p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#5E8B8C] data-[state=active]:text-[#FAF6F2] text-sm text-[#9C8578]">
              Resumen
            </TabsTrigger>
            <TabsTrigger value="progress" className="data-[state=active]:bg-[#5E8B8C] data-[state=active]:text-[#FAF6F2] text-sm text-[#9C8578]">
              Progreso
            </TabsTrigger>
            <TabsTrigger value="timeline" className="data-[state=active]:bg-[#5E8B8C] data-[state=active]:text-[#FAF6F2] text-sm text-[#9C8578]">
              Línea de tiempo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
              <section className="space-y-4 bg-[#1C2828] border border-[#D5C3B6]/10 rounded-3xl p-6">
                <div className="flex items-center gap-2 text-[#9C8578] text-xs uppercase tracking-[0.2em]">
                  <Activity className="h-4 w-4 text-[#5E8B8C]" />
                  <span>Detalles</span>
                </div>
                <div className="space-y-3 text-sm text-[#D5C3B6]">
                  {contact.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-[#5E8B8C]" />
                      <a href={`tel:${contact.phone}`} className="hover:text-[#FAF6F2]">{contact.phone}</a>
                    </div>
                  )}
                  {contact.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-[#5E8B8C]" />
                      <a href={`mailto:${contact.email}`} className="hover:text-[#FAF6F2]">{contact.email}</a>
                    </div>
                  )}
                  {contact.rut && (
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-[#B8965A]">RUT</span>
                      <span>{contact.rut}</span>
                    </div>
                  )}
                  {contact.notes && (
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-[#9C8578] mb-2">Notas</p>
                      <p className="rounded-2xl border border-[#D5C3B6]/10 bg-[#212E2E] p-4 text-sm text-[#D5C3B6] whitespace-pre-line">{contact.notes}</p>
                    </div>
                  )}
                </div>
              </section>

              <section className="space-y-4 bg-[#1C2828] border border-[#D5C3B6]/10 rounded-3xl p-6">
                <div className="flex items-center gap-2 text-[#9C8578] text-xs uppercase tracking-[0.2em]">
                  <Building2 className="h-4 w-4 text-[#5E8B8C]" />
                  <span>Deals asociados</span>
                </div>
                <div className="space-y-3">
                  {contact.deals.length === 0 ? (
                    <p className="text-sm text-[#9C8578]">Sin ofertas vinculadas.</p>
                  ) : (
                    contact.deals.map(({ deal }) => (
                      <Link
                        key={deal.id}
                        href="/broker/crm/workspace"
                        className="block rounded-2xl border border-[#D5C3B6]/10 bg-[#212E2E] p-4 transition-colors hover:border-[#5E8B8C]/40"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-xs text-[#B8965A]">{deal.code}</p>
                            <p className="text-sm font-semibold text-[#FAF6F2] truncate">{deal.title}</p>
                          </div>
                          <Badge variant="outline" className="text-[10px] border-[#D5C3B6]/20 text-[#9C8578]">
                            {deal.stage}
                          </Badge>
                        </div>
                        {deal.property?.address && (
                          <p className="mt-2 text-xs text-[#9C8578]">{deal.property.address}</p>
                        )}
                      </Link>
                    ))
                  )}
                </div>
              </section>
            </div>
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            <section className="bg-[#1C2828] border border-[#D5C3B6]/10 rounded-3xl p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#9C8578]">Progreso clave</p>
                  <h3 className="mt-2 text-lg font-semibold text-[#FAF6F2]">Avance de contacto</h3>
                </div>
                <Button size="sm" variant="outline" className="border-[#D5C3B6]/20 text-[#9C8578]" onClick={handleRefreshTimeline}>
                  Actualizar línea de tiempo
                </Button>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-[#D5C3B6]/10 bg-[#212E2E] p-5">
                  <div className="flex items-center gap-2 text-[#9C8578] text-xs uppercase tracking-[0.2em]">
                    <Sparkles className="h-4 w-4 text-[#5E8B8C]" />
                    <span>Semana</span>
                  </div>
                  <p className="mt-4 text-4xl font-semibold text-[#FAF6F2]">{weekProgress}%</p>
                  <p className="mt-2 text-sm text-[#9C8578]">Objetivo de interacción semanal</p>
                </div>
                <div className="rounded-3xl border border-[#D5C3B6]/10 bg-[#212E2E] p-5">
                  <div className="flex items-center gap-2 text-[#9C8578] text-xs uppercase tracking-[0.2em]">
                    <Clock className="h-4 w-4 text-[#5E8B8C]" />
                    <span>Recencia</span>
                  </div>
                  <p className="mt-4 text-4xl font-semibold text-[#FAF6F2]">{daysSinceLastContact !== null ? `${daysSinceLastContact}d` : '—'}</p>
                  <p className="mt-2 text-sm text-[#9C8578]">Días desde la última interacción</p>
                </div>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#9C8578]">Registro</p>
                <h3 className="text-lg font-semibold text-[#FAF6F2]">Línea de tiempo de actividades</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => setIsModalOpen(true)}>
                  Registrar actividad
                </Button>
                {contact.phone && (
                  <WhatsAppButton
                    phone={contact.phone}
                    message={`Hola ${contact.name}, te escribo desde NeiFe CRM para avanzar en tu operación.`}
                    onAction={handleWhatsAppAction}
                  />
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-[#D5C3B6]/10 bg-[#1C2828] p-6">
              {loadingTimeline ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-4 w-1/3 bg-[#2D3C3C] rounded" />
                  <div className="h-4 w-full bg-[#2D3C3C] rounded" />
                  <div className="h-4 w-5/6 bg-[#2D3C3C] rounded" />
                </div>
              ) : activities.length === 0 ? (
                <div className="py-10 text-center text-sm text-[#9C8578]">No hay actividades registradas para este contacto.</div>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="rounded-2xl border border-[#D5C3B6]/10 bg-[#212E2E] p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-[#FAF6F2]">{activity.title}</p>
                          <p className="text-xs text-[#9C8578]">{activity.type} · {formatDateCompact(activity.createdAt, { day:'2-digit', month:'short', year:'numeric' })}</p>
                        </div>
                        <Badge variant="outline" className="text-[10px] border-[#D5C3B6]/20 text-[#9C8578]">
                          {activity.isDone ? 'Completado' : 'Pendiente'}
                        </Badge>
                      </div>
                      {activity.description && (
                        <p className="mt-3 text-sm text-[#D5C3B6]">{activity.description}</p>
                      )}
                    </div>
                  ))}
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
              <p className="mt-1 text-xs text-[#9C8578]">{lastActivity ? formatDateCompact(lastActivity.createdAt, { day:'2-digit', month:'short', year:'numeric' }) : '—'}</p>
            </div>
            {contact.score && (
              <div className="rounded-2xl border border-[#D5C3B6]/10 bg-[#212E2E] p-4">
                <p className="text-xs text-[#9C8578]">Recomendación</p>
                <p className="mt-2 text-sm text-[#D5C3B6]">{contact.score.recommendation}</p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-[#D5C3B6]/10 bg-[#1C2828] p-6">
          <div className="flex items-center gap-3 text-[#9C8578] text-xs uppercase tracking-[0.2em] mb-4">
            <MessageSquare className="h-4 w-4 text-[#5E8B8C]" />
            <span>Acciones rápidas</span>
          </div>
          <div className="flex flex-col gap-3">
            {contact.phone && (
              <Button
                variant="outline"
                size="sm"
                className="border-[#D5C3B6]/20 text-[#9C8578]"
                onClick={handleWhatsAppAction}
              >
                Iniciar chat WhatsApp
              </Button>
            )}
            {contact.email && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-[#D5C3B6]/20 text-[#9C8578]"
              >
                <a href={`mailto:${contact.email}`}>Enviar email</a>
              </Button>
            )}
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

      <ActivityLogModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={() => {
          setIsModalOpen(false)
          handleRefreshTimeline()
        }}
        contactId={contact.id}
      />
    </div>
  )
}
