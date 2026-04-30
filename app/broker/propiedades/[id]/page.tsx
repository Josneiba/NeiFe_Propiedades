'use client'

import Link from "next/link"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ContractProgressChart } from "@/components/charts/contract-progress"
import { PropertyMiniMap } from "@/components/map/property-mini-map"
import { PropertyPublicationToggle } from "@/components/properties/property-publication-toggle"
import { ApplicationPortalManager } from "@/components/properties/application-portal-manager"
import { ConfirmPaymentButton } from "@/components/payments/confirm-payment-button"
import {
  ArrowLeft,
  Calendar,
  Download,
  CreditCard,
  ExternalLink,
  FileText,
  Mail,
  MapPin,
  Phone,
  TrendingUp,
  User,
  Users,
  Wrench,
  Building2,
} from "lucide-react"

const currencyFormatter = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  minimumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat("es-CL", {
  day: "numeric",
  month: "long",
  year: "numeric",
})

const monthFormatter = new Intl.DateTimeFormat("es-CL", {
  month: "long",
  year: "numeric",
})

const paymentStatusConfig: Record<string, { label: string; className: string }> = {
  PAID: { label: "Pagado", className: "bg-[#5E8B8C] text-white" },
  PENDING: { label: "Pendiente", className: "bg-[#C27F79] text-white" },
  OVERDUE: { label: "Atrasado", className: "bg-red-600 text-white" },
  PROCESSING: { label: "En revisión", className: "bg-[#F2C94C] text-[#1C1917]" },
  CANCELLED: { label: "Cancelado", className: "bg-[#9C8578] text-white" },
}

const maintenanceStatusConfig: Record<string, { label: string; className: string }> = {
  REQUESTED: { label: "Solicitada", className: "bg-[#F2C94C]/15 text-[#F2C94C]" },
  REVIEWING: { label: "En revisión", className: "bg-sky-500/15 text-sky-300" },
  APPROVED: { label: "Aprobada", className: "bg-emerald-500/15 text-emerald-300" },
  IN_PROGRESS: { label: "En curso", className: "bg-[#5E8B8C]/15 text-[#8FC4C5]" },
}

const inspectionTypeLabels: Record<string, string> = {
  ROUTINE: "Rutinaria",
  CHECKIN: "Ingreso",
  CHECKOUT: "Salida",
  MAINTENANCE: "Mantención",
  IPC_REVIEW: "Revisión IPC",
}

const inspectionStatusLabels: Record<string, string> = {
  SCHEDULED: "Programada",
  CONFIRMED: "Confirmada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  RESCHEDULED: "Reagendada",
}

function formatCurrency(value?: number | null) {
  if (value == null) return "No informado"
  return currencyFormatter.format(value)
}

function formatDate(value?: Date | null | string) {
  if (!value) return "No definida"
  try {
    const date = typeof value === 'string' ? new Date(value) : value
    if (isNaN(date.getTime())) return "No definida"
    return dateFormatter.format(date)
  } catch {
    return "No definida"
  }
}

function formatMonth(month: number, year: number) {
  return monthFormatter.format(new Date(year, month - 1, 1))
}

type Property = {
  id: string
  name: string | null
  address: string
  commune: string
  description: string | null
  monthlyRentCLP: number
  monthlyRentUF: number | null
  contractStart: Date | null
  contractEnd: Date | null
  nextIpcDate: Date | null
  ipcAdjustmentMonths: number | null
  lat: number | null
  lng: number | null
  isPublished: boolean
  publishedAt: Date | null
  applicationOpen: boolean
  applicationSlug: string | null
  landlord: {
    name: string | null
    email: string | null
    phone: string | null
  } | null
  tenant: {
    id: string
    name: string
    email: string
    phone: string | null
    rut: string | null
    documentType: string | null
    documentNumber: string | null
    documentNumberNormalized: string | null
  } | null
  tenantIdentity: {
    type: string
    value: string
  } | null
  payments: Array<{
    id: string
    status: string
    month: number
    year: number
    amountCLP: number
    receipt: string | null
  }>
  services: Array<{
    id: string
    month: number
    year: number
    water: number | null
    electricity: number | null
    gas: number | null
    garbage: number | null
    commonExpenses: number | null
    other: number | null
    otherLabel: string | null
  }>
  maintenance: Array<{
    id: string
    category: string
    description: string
    status: string
    createdAt: Date
  }>
  providers: Array<{
    provider: {
      id: string
      name: string
      specialty: string
      phone: string
      email: string | null
    }
  }>
  inspections: Array<{
    id: string
    scheduledAt: Date
    status: string
    type: string
  }>
  mandates: Array<{
    id: string
    startsAt: Date
    expiresAt: Date
    notes: string | null
    owner: {
      name: string
      email: string
    }
    broker: {
      name: string
      email: string
      company: string | null
    }
  }>
}

export default function BrokerPropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const searchParams = useSearchParams()
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('personas')
  const [propertyId, setPropertyId] = useState<string>('')

  useEffect(() => {
    params.then(resolvedParams => {
      setPropertyId(resolvedParams.id)
    })
  }, [params])

  useEffect(() => {
    if (!propertyId) return

    const fetchProperty = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/broker/properties/${propertyId}`)
        if (!response.ok) {
          throw new Error('Error al cargar propiedad')
        }
        const data = await response.json()
        setProperty(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setLoading(false)
      }
    }

    fetchProperty()
  }, [propertyId])

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['personas', 'financiero', 'operacion', 'mandato'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-[#9C8578]">Cargando propiedad...</p>
      </div>
    )
  }

  if (error || !property) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-[#C27F79]">{error || 'Propiedad no encontrada'}</p>
      </div>
    )
  }

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const currentPayment =
    property.payments.find(
      (payment) => payment.month === currentMonth && payment.year === currentYear
    ) ?? property.payments[0] ?? null
  const currentPaymentStatus = currentPayment
    ? paymentStatusConfig[currentPayment.status] ?? {
        label: currentPayment.status,
        className: "bg-[#9C8578] text-white",
      }
    : { label: "Sin registro", className: "bg-[#9C8578] text-white" }
  const activeMandate = property.mandates[0] ?? null
  const latestService = property.services[0] ?? null
  const nextInspection =
    property.inspections.find((inspection) => inspection.scheduledAt >= now) ??
    property.inspections[0] ??
    null

  return (
    <div className="space-y-6">
      {/* SECCIÓN 1 — Header compacto */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/broker/propiedades" className="inline-flex items-center gap-1.5 text-xs text-[#9C8578] hover:text-[#D5C3B6] mb-2">
            <ArrowLeft className="h-3 w-3" /> Volver
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-[#FAF6F2]">{property.name || property.address}</h1>
            <Badge className="bg-[#5E8B8C]/20 text-[#5E8B8C] border border-[#5E8B8C]/30">Mandato activo</Badge>
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-[#9C8578]">
            <MapPin className="h-3.5 w-3.5" />{property.address}, {property.commune}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm" className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-white">
            <Link href={`/broker/propiedades/${property.id}/inspecciones`}>
              <Calendar className="mr-1.5 h-3.5 w-3.5" />Inspecciones
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="border-[#D5C3B6]/20 text-[#FAF6F2]">
            <Link href={`/broker/propiedades/${property.id}/reajustes`}>
              <TrendingUp className="mr-1.5 h-3.5 w-3.5" />IPC
            </Link>
          </Button>
        </div>
      </div>

      {/* SECCIÓN 2 — Barra de KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className={`rounded-xl border p-4 ${
          currentPayment?.status === 'PAID' ? 'border-[#5E8B8C]/30 bg-[#5E8B8C]/5' :
          currentPayment?.status === 'OVERDUE' ? 'border-[#C27F79]/30 bg-[#C27F79]/5' :
          'border-[#D5C3B6]/10 bg-[#1C1917]'
        }`}>
          <p className="text-xs text-[#9C8578] uppercase tracking-wider mb-1">Pago {currentMonth}/{currentYear}</p>
          <p className="text-xl font-bold text-[#FAF6F2]">{formatCurrency(currentPayment?.amountCLP)}</p>
          <Badge className={`mt-1 text-xs ${currentPaymentStatus.className}`}>{currentPaymentStatus.label}</Badge>
        </div>

        <div className="rounded-xl border border-[#D5C3B6]/10 bg-[#1C1917] p-4">
          <p className="text-xs text-[#9C8578] uppercase tracking-wider mb-1">Renta mensual</p>
          <p className="text-xl font-bold text-[#FAF6F2]">{formatCurrency(property.monthlyRentCLP)}</p>
          {property.monthlyRentUF && <p className="mt-1 text-xs text-[#9C8578]">UF {property.monthlyRentUF.toFixed(2)}</p>}
        </div>

        <div className={`rounded-xl border p-4 ${property.maintenance.length > 0 ? 'border-[#F2C94C]/30 bg-[#F2C94C]/5' : 'border-[#D5C3B6]/10 bg-[#1C1917]'}`}>
          <p className="text-xs text-[#9C8578] uppercase tracking-wider mb-1">Mantenciones</p>
          <p className="text-xl font-bold text-[#FAF6F2]">{property.maintenance.length}</p>
          <p className="mt-1 text-xs text-[#9C8578]">{property.maintenance.length === 1 ? 'solicitud abierta' : 'solicitudes abiertas'}</p>
        </div>

        <div className="rounded-xl border border-[#D5C3B6]/10 bg-[#1C1917] p-4">
          <p className="text-xs text-[#9C8578] uppercase tracking-wider mb-1">Próxima inspección</p>
          {nextInspection ? (
            <>
              <p className="text-sm font-semibold text-[#FAF6F2]">{formatDate(nextInspection.scheduledAt)}</p>
              <p className="mt-1 text-xs text-[#9C8578]">{inspectionTypeLabels[nextInspection.type]}</p>
            </>
          ) : (
            <p className="text-sm text-[#9C8578]">Sin programar</p>
          )}
        </div>
      </div>

      {/* SECCIÓN 3 — Layout de dos columnas con tabs */}
      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div className="space-y-0">
          <div className="border-b border-[#D5C3B6]/10 mb-6">
            <div className="flex gap-1 overflow-x-auto pb-0">
              {['personas', 'financiero', 'operacion', 'mandato'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab 
                      ? 'border-[#5E8B8C] text-[#FAF6F2]' 
                      : 'border-transparent text-[#9C8578] hover:text-[#D5C3B6]'
                  }`}>
                  {tab === 'personas' ? 'Personas' : tab === 'financiero' ? 'Financiero' : tab === 'operacion' ? 'Operación' : 'Mandato'}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Personas */}
          {activeTab === 'personas' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
                <CardHeader>
                  <CardTitle className="text-sm text-[#9C8578] uppercase tracking-wide">Propietario</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold text-[#FAF6F2]">{property.landlord?.name || 'Sin nombre'}</p>
                  <div className="mt-3 space-y-2 text-sm text-[#D5C3B6]">
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-[#5E8B8C]" />
                      {property.landlord?.email || 'Sin correo'}
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-[#5E8B8C]" />
                      {property.landlord?.phone || 'Sin teléfono'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
                <CardHeader>
                  <CardTitle className="text-sm text-[#9C8578] uppercase tracking-wide">Arrendatario</CardTitle>
                </CardHeader>
                <CardContent>
                  {property.tenant ? (
                    <>
                      <p className="font-semibold text-[#FAF6F2]">{property.tenant.name}</p>
                      <div className="mt-3 space-y-2 text-sm text-[#D5C3B6]">
                        <p className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-[#5E8B8C]" />
                          {property.tenant.email}
                        </p>
                        <p className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-[#5E8B8C]" />
                          {property.tenant.phone || 'Sin teléfono'}
                        </p>
                        <p className="flex items-center gap-2">
                          <User className="h-4 w-4 text-[#5E8B8C]" />
                          {property.tenantIdentity?.value || 'Sin documento'}
                        </p>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-[#9C8578]">Sin arrendatario asignado</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tab Financiero */}
          {activeTab === 'financiero' && (
            <div className="space-y-4">
              <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
                <CardHeader>
                  <CardTitle className="text-[#FAF6F2]">Historial de pagos</CardTitle>
                </CardHeader>
                <CardContent>
                  {property.payments.length === 0 ? (
                    <p className="text-sm text-[#9C8578]">Aún no hay pagos cargados.</p>
                  ) : (
                    <div className="space-y-2">
                      {property.payments.map((payment) => {
                        const status = paymentStatusConfig[payment.status] ?? {
                          label: payment.status,
                          className: "bg-[#9C8578] text-white",
                        }
                        return (
                          <div key={payment.id} className="rounded-xl border border-[#D5C3B6]/10 bg-[#1C1917] px-4 py-3">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                              <div>
                                <p className="text-sm font-medium text-[#FAF6F2]">{formatMonth(payment.month, payment.year)}</p>
                                <p className="text-sm text-[#9C8578]">{formatCurrency(payment.amountCLP)}</p>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                {payment.receipt && (
                                  <Button variant="outline" size="sm" className="border-[#D5C3B6]/20 text-[#D5C3B6] hover:bg-[#D5C3B6]/10" asChild>
                                    <a href={payment.receipt} target="_blank" rel="noopener noreferrer">
                                      <Download className="mr-2 h-4 w-4" />Comprobante
                                    </a>
                                  </Button>
                                )}
                                {payment.status === 'PROCESSING' && payment.receipt && (
                                  <ConfirmPaymentButton paymentId={payment.id} label="Confirmar pago" className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-white" />
                                )}
                                <Badge className={status.className}>{status.label}</Badge>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {latestService && (
                <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
                  <CardHeader>
                    <CardTitle className="text-[#FAF6F2]">Servicios del último período</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-[#9C8578] mb-3">Último período cargado: {formatMonth(latestService.month, latestService.year)}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-[#1C1917] p-3">
                        <p className="text-xs text-[#9C8578]">Agua</p>
                        <p className="mt-1 font-semibold text-[#FAF6F2]">{formatCurrency(latestService.water)}</p>
                      </div>
                      <div className="rounded-xl bg-[#1C1917] p-3">
                        <p className="text-xs text-[#9C8578]">Luz</p>
                        <p className="mt-1 font-semibold text-[#FAF6F2]">{formatCurrency(latestService.electricity)}</p>
                      </div>
                      <div className="rounded-xl bg-[#1C1917] p-3">
                        <p className="text-xs text-[#9C8578]">Gas</p>
                        <p className="mt-1 font-semibold text-[#FAF6F2]">{formatCurrency(latestService.gas)}</p>
                      </div>
                      <div className="rounded-xl bg-[#1C1917] p-3">
                        <p className="text-xs text-[#9C8578]">Gasto común</p>
                        <p className="mt-1 font-semibold text-[#FAF6F2]">{formatCurrency(latestService.commonExpenses)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Tab Operación */}
          {activeTab === 'operacion' && (
            <div className="space-y-4">
              <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
                <CardHeader>
                  <CardTitle className="text-[#FAF6F2]">Mantenciones activas</CardTitle>
                </CardHeader>
                <CardContent>
                  {property.maintenance.length === 0 ? (
                    <p className="text-sm text-[#9C8578]">No hay mantenciones abiertas.</p>
                  ) : (
                    <div className="space-y-3">
                      {property.maintenance.map((maintenance) => {
                        const status = maintenanceStatusConfig[maintenance.status] ?? {
                          label: maintenance.status,
                          className: "bg-[#9C8578]/15 text-[#D5C3B6]",
                        }
                        return (
                          <div key={maintenance.id} className="rounded-xl border border-[#D5C3B6]/10 bg-[#1C1917] p-4">
                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                              <div>
                                <p className="font-medium text-[#FAF6F2]">{maintenance.description}</p>
                                <p className="mt-1 text-sm text-[#9C8578]">{maintenance.category} • abierta desde {formatDate(maintenance.createdAt)}</p>
                              </div>
                              <Badge className={status.className}>{status.label}</Badge>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
                <CardHeader>
                  <CardTitle className="text-[#FAF6F2]">Proveedores asignados</CardTitle>
                </CardHeader>
                <CardContent>
                  {property.providers.length === 0 ? (
                    <p className="text-sm text-[#9C8578]">Esta propiedad aún no tiene proveedores vinculados.</p>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      {property.providers.map(({ provider }) => (
                        <div key={provider.id} className="rounded-xl border border-[#D5C3B6]/10 bg-[#1C1917] p-4">
                          <p className="font-medium text-[#FAF6F2]">{provider.name}</p>
                          <p className="mt-1 text-sm text-[#9C8578]">{provider.specialty}</p>
                          <div className="mt-3 space-y-2 text-sm text-[#D5C3B6]">
                            <p className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-[#5E8B8C]" />
                              {provider.phone}
                            </p>
                            <p className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-[#5E8B8C]" />
                              {provider.email || 'Sin correo'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tab Mandato */}
          {activeTab === 'mandato' && (
            <div className="space-y-4">
              {activeMandate && (
                <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
                  <CardHeader>
                    <CardTitle className="text-[#FAF6F2]">Información del mandato</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-xl bg-[#1C1917] p-4">
                      <p className="text-xs uppercase tracking-wide text-[#9C8578]">Corredor</p>
                      <p className="mt-2 font-semibold text-[#FAF6F2]">{activeMandate.broker.name}</p>
                      <p className="mt-1 text-sm text-[#9C8578]">{activeMandate.broker.email}</p>
                      {activeMandate.broker.company && <p className="mt-1 text-sm text-[#D5C3B6]">{activeMandate.broker.company}</p>}
                    </div>
                    <div className="rounded-xl bg-[#1C1917] p-4">
                      <p className="text-xs uppercase tracking-wide text-[#9C8578]">Vigencia</p>
                      <p className="mt-2 text-sm text-[#FAF6F2]">Desde {formatDate(activeMandate.startsAt)} hasta {formatDate(activeMandate.expiresAt)}</p>
                    </div>
                    {activeMandate.notes && (
                      <div className="rounded-xl bg-[#1C1917] p-4">
                        <p className="text-xs uppercase tracking-wide text-[#9C8578]">Notas</p>
                        <p className="mt-2 text-sm text-[#D5C3B6]">{activeMandate.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {property.contractStart && property.contractEnd && (
                <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
                  <CardHeader>
                    <CardTitle className="text-[#FAF6F2]">Progreso del contrato</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ContractProgressChart startDate={property.contractStart} endDate={property.contractEnd} size="large" />
                  </CardContent>
                </Card>
              )}

              {property.lat != null && property.lng != null && (
                <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
                  <CardHeader>
                    <CardTitle className="text-[#FAF6F2]">Ubicación</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-hidden rounded-xl border border-[#D5C3B6]/10">
                      <PropertyMiniMap lat={property.lat} lng={property.lng} address={`${property.address}, ${property.commune}`} />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA: Acciones rápidas */}
        <div className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
            <CardHeader>
              <CardTitle className="text-[#FAF6F2]">Acciones rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-white">
                <Link href={`/broker/propiedades/${property.id}/inspecciones`}>
                  <Calendar className="mr-2 h-4 w-4" />Inspecciones
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full border-[#D5C3B6]/20 text-[#FAF6F2] hover:bg-[#D5C3B6]/10">
                <Link href={`/broker/propiedades/${property.id}/reajustes`}>
                  <TrendingUp className="mr-2 h-4 w-4" />Reajustes
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full border-[#D5C3B6]/20 text-[#FAF6F2] hover:bg-[#D5C3B6]/10">
                <Link href={`/broker/pagos?property=${property.id}`}>
                  <CreditCard className="mr-2 h-4 w-4" />Pagos
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full border-[#D5C3B6]/20 text-[#FAF6F2] hover:bg-[#D5C3B6]/10">
                <Link href={`/broker/servicios?property=${property.id}`}>
                  <FileText className="mr-2 h-4 w-4" />Servicios
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
            <CardHeader>
              <CardTitle className="text-[#FAF6F2]">Publicación</CardTitle>
            </CardHeader>
            <CardContent>
              <PropertyPublicationToggle
                propertyId={property.id}
                isPublished={property.isPublished}
                publishedAt={property.publishedAt}
                disabled={Boolean(property.tenant) && !property.isPublished}
              />
            </CardContent>
          </Card>

          <ApplicationPortalManager
            propertyId={property.id}
            propertyAddress={`${property.address}, ${property.commune}`}
            applicationOpen={property.applicationOpen}
            applicationSlug={property.applicationSlug}
            hasTenant={Boolean(property.tenant)}
          />
        </div>
      </div>
    </div>
  )
}
