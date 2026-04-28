"use client"

import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { getSession } from "next-auth/react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin,
  CreditCard,
  Wrench,
  FileText,
  Calendar,
  Users,
  TrendingUp,
  Loader2,
  Edit,
  ExternalLink,
  AlertTriangle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ContractProgressChart } from "@/components/charts/contract-progress"
import { PropertyMiniMap } from "@/components/map/property-mini-map"
import { InviteTenantButton } from "@/components/dashboard/invite-tenant-button"
import { PropertyProvidersPanel } from "@/components/dashboard/property-providers-panel"
import { AdministrationSection } from "@/components/dashboard/property-administration"
import { PropertyAccessRequestButton } from "@/components/dashboard/property-access-request-button"
import { PropertyAccessRequestsPanel } from "@/components/dashboard/property-access-requests-panel"
import { BrokerRequestButton } from "@/components/dashboard/broker-request-button"
import { PropertyPublicationToggle } from "@/components/properties/property-publication-toggle"
import { ApplicationPortalManager } from "@/components/properties/application-portal-manager"
import { PropertyChecklist } from "@/components/dashboard/property-checklist"
import { SecurityDepositPanel } from "@/components/dashboard/security-deposit-panel"
import { IpcAdjustmentDialog } from "@/components/dashboard/ipc-adjustment-dialog"
import { getUserIdentity } from "@/lib/identity-documents"

interface Property {
  id: string
  name?: string
  address: string
  commune: string
  lat?: number | null
  lng?: number | null
  description: string | null
  monthlyRentCLP: number | null
  monthlyRentUF: number | null
  contractStart: string
  contractEnd: string
  nextIpcDate?: string | null
  landlordId: string
  isPublished: boolean
  publishedAt?: string | null
  applicationOpen: boolean
  applicationSlug?: string | null
  tenant?: {
    id: string
    name: string
    email: string
    phone: string | null
    rut: string | null
    documentType?: string | null
    documentNumber?: string | null
    documentNumberNormalized?: string | null
  } | null
  agentName: string | null
  agentRut: string | null
  agentEmail: string | null
  agentPhone: string | null
  agentCompany: string | null
  commissionRate: number | null
  commissionType: string | null
  payments: any[]
  activeMandate?: {
    brokerId: string
    status: string
    broker: {
      name: string | null
      email: string
      company?: string | null
    }
  } | null
  hasActiveMandate?: boolean
}

export default function PropertyDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const propertyId = params.id as string
  const rawTab = searchParams.get("tab") || "resumen"
  const currentTab = rawTab === "corredor" ? "administracion" : rawTab

  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingAgent, setEditingAgent] = useState(false)
  const [hasBroker, setHasBroker] = useState(false)
  const [brokerInfo, setBrokerInfo] = useState<any>(null)
  const [showRevokeModal, setShowRevokeModal] = useState(false)
  const [savingAgent, setSavingAgent] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [brokerPermissionStatus, setBrokerPermissionStatus] = useState<'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED'>('NONE')
  const [hasPendingRequest, setHasPendingRequest] = useState(false)
  const [agentData, setAgentData] = useState({
    agentName: "",
    agentRut: "",
    agentEmail: "",
    agentPhone: "",
    agentCompany: "",
    commissionRate: "",
    commissionType: "MONTHLY"
  })

  // Load property data
  useEffect(() => {
    const controller = new AbortController()

    const loadPropertyData = async () => {
      try {
        let currentRole: string | null = null

        // Get user session first
        const session = await getSession()
        currentRole = session?.user?.role || null
        setUserRole(currentRole)

        if (currentRole === 'BROKER') {
          router.replace(`/broker/propiedades/${propertyId}`)
          return
        }

        const [propertyRes, accessRequestsRes] = await Promise.all([
          fetch(`/api/properties/${propertyId}`, { signal: controller.signal }),
          fetch(`/api/property-access-requests?propertyId=${propertyId}`, {
            signal: controller.signal,
          }),
        ])

        if (!propertyRes.ok) throw new Error("Failed to load property")
        const propertyJson = await propertyRes.json()
        const data = propertyJson.property as Property
        if (!data) throw new Error("Failed to load property")
        setProperty(data)
        setBrokerPermissionStatus('NONE')
        setHasBroker(Boolean(data.hasActiveMandate || data.activeMandate))
        setBrokerInfo(data.activeMandate?.broker ?? null)

        // Load access requests
        if (accessRequestsRes.ok) {
          const accessData = await accessRequestsRes.json()
          const requests = accessData.requests || []
          const pendingRequest = requests.find((req: any) => req.status === 'PENDING')
          setHasPendingRequest(!!pendingRequest)
        } else {
          setHasPendingRequest(false)
        }

        setAgentData({
          agentName: data.agentName || "",
          agentRut: data.agentRut || "",
          agentEmail: data.agentEmail || "",
          agentPhone: data.agentPhone || "",
          agentCompany: data.agentCompany || "",
          commissionRate: data.commissionRate?.toString() || "",
          commissionType: data.commissionType || "MONTHLY"
        })
      } catch (error) {
        if (controller.signal.aborted) return
        toast({
          title: "Error",
          description: "No se pudo cargar la propiedad",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    loadPropertyData()

    return () => controller.abort()
  }, [propertyId, router, toast])

  // Handle agent save
  const handleSaveAgent = async () => {
    setSavingAgent(true)
    try {
      const res = await fetch(`/api/properties/${propertyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentName: agentData.agentName || null,
          agentRut: agentData.agentRut || null,
          agentEmail: agentData.agentEmail || null,
          agentPhone: agentData.agentPhone || null,
          agentCompany: agentData.agentCompany || null,
          commissionRate: agentData.commissionRate ? parseFloat(agentData.commissionRate) : null,
          commissionType: agentData.commissionType
        })
      })

      if (!res.ok) throw new Error("Failed to update agent info")
      
      const updated = await res.json()
      setProperty(updated.property ?? updated)
      setEditingAgent(false)
      
      toast({
        title: "Éxito",
        description: "Información de corredor actualizada"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al actualizar la información",
        variant: "destructive"
      })
    } finally {
      setSavingAgent(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#5E8B8C]" />
      </div>
    )
  }

  if (!property) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No se encontró la propiedad</p>
      </div>
    )
  }

  const handleTabChange = (tab: string) => {
    router.replace(`?tab=${tab}`, { scroll: false })
  }
  const tenantIdentity = property.tenant ? getUserIdentity(property.tenant) : null

  const landlordDelegatedToBroker = userRole !== 'BROKER' && hasBroker
  const brokerCanRequestPropertyAccess =
    userRole === 'BROKER' && !hasBroker && brokerPermissionStatus === 'APPROVED'
  const brokerNeedsLandlordPermission =
    userRole === 'BROKER' && !hasBroker && brokerPermissionStatus !== 'APPROVED'
  const canManageProperty = userRole === 'BROKER' ? hasBroker : !landlordDelegatedToBroker
  const canEditProperty = userRole === 'BROKER' ? hasBroker : !landlordDelegatedToBroker

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/propiedades">
            <Button variant="ghost" size="icon" className="text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {property.name || property.address}
            </h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {property.address}, {property.commune}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          {canManageProperty && (
            <PropertyPublicationToggle
              propertyId={propertyId}
              isPublished={property.isPublished}
              publishedAt={property.publishedAt}
              disabled={Boolean(property.tenant) && !property.isPublished}
              onUpdated={(next) =>
                setProperty((current) =>
                  current
                    ? {
                        ...current,
                        isPublished: next.isPublished,
                        publishedAt: next.publishedAt,
                      }
                    : current
                )
              }
            />
          )}
          {userRole !== 'BROKER' && !property.tenant && !hasBroker && (
            <InviteTenantButton
              propertyId={propertyId}
              propertyLabel={property.name || property.address}
            />
          )}
          {brokerCanRequestPropertyAccess && (
            <PropertyAccessRequestButton
              propertyId={propertyId}
              propertyName={property.name || property.address}
              propertyAddress={`${property.address}, ${property.commune}`}
              landlordId={property.landlordId}
              hasActiveMandate={hasBroker}
              hasPendingRequest={hasPendingRequest}
            />
          )}
          {brokerNeedsLandlordPermission && (
            <BrokerRequestButton
              landlordId={property.landlordId}
              hasActivePermission={false}
              hasPendingRequest={brokerPermissionStatus === 'PENDING'}
            />
          )}
          {canEditProperty ? (
            <Link href={`/dashboard/propiedades/${propertyId}/editar`}>
              <Button variant="outline" className="gap-2 text-foreground">
                <Edit className="h-4 w-4" />
                Editar
              </Button>
            </Link>
          ) : (
            <Button
              variant="outline"
              className="gap-2 text-muted-foreground cursor-not-allowed"
              disabled
              title="La edición está deshabilitada cuando la propiedad es administrada por un corredor"
            >
              <Edit className="h-4 w-4" />
              Editar
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
        <div className="hidden md:block">
          <TabsList className="bg-muted w-full justify-start overflow-x-auto">
            <TabsTrigger value="resumen">Resumen</TabsTrigger>
            <TabsTrigger value="administracion">Administración</TabsTrigger>
            {userRole === 'LANDLORD' && (
              <TabsTrigger value="solicitudes">Solicitudes</TabsTrigger>
            )}
            <TabsTrigger value="pagos">Pagos</TabsTrigger>
            <TabsTrigger value="servicios">Servicios</TabsTrigger>
            <TabsTrigger value="mantenciones">Mantenciones</TabsTrigger>
            <TabsTrigger value="contrato">Contrato</TabsTrigger>
            <TabsTrigger value="inspecciones">Inspecciones</TabsTrigger>
            <TabsTrigger value="reajuste">Reajuste IPC</TabsTrigger>
            <TabsTrigger value="historial-renta">Historial de renta</TabsTrigger>
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
            <TabsTrigger value="garantia">Garantía</TabsTrigger>
            <TabsTrigger value="postulaciones">Postulaciones</TabsTrigger>
            <TabsTrigger value="proveedores">Proveedores</TabsTrigger>
          </TabsList>
        </div>
        <div className="md:hidden">
          <div className="space-y-2">
            <label htmlFor="property-tab-select" className="text-sm font-semibold text-foreground">Ver sección</label>
            <select
              id="property-tab-select"
              value={currentTab}
              onChange={(event) => handleTabChange(event.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-ring/50 focus-visible:ring-2"
            >
              <option value="resumen">Resumen</option>
              <option value="administracion">Administración</option>
              {userRole === 'LANDLORD' && (
                <option value="solicitudes">Solicitudes</option>
              )}
              <option value="pagos">Pagos</option>
              <option value="servicios">Servicios</option>
              <option value="mantenciones">Mantenciones</option>
              <option value="contrato">Contrato</option>
              <option value="inspecciones">Inspecciones</option>
              <option value="reajuste">Reajuste IPC</option>
              <option value="historial-renta">Historial de renta</option>
              <option value="checklist">Checklist</option>
              <option value="garantia">Garantía</option>
              <option value="postulaciones">Postulaciones</option>
              <option value="proveedores">Proveedores</option>
            </select>
          </div>
        </div>

        {/* Resumen Tab */}
        <TabsContent value="resumen" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Property Card */}
              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-48 h-48 bg-[#2D3C3C] rounded-lg flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-16 w-16 text-[#D5C3B6]/50" />
                    </div>
                    <div className="flex-1 space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Descripción</p>
                        <p className="text-foreground">{property.description}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Arriendo mensual (CLP)</p>
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-2xl font-bold text-foreground">
                            {property.monthlyRentCLP ? `$${property.monthlyRentCLP.toLocaleString("es-CL")}` : "No especificado"}
                          </p>
                          {property.tenant && property.contractEnd && new Date(property.contractEnd) > new Date() && property.monthlyRentCLP ? (
                            <IpcAdjustmentDialog
                              propertyId={propertyId}
                              currentRentCLP={property.monthlyRentCLP}
                              onSuccess={(newRent) =>
                                setProperty((current) =>
                                  current ? { ...current, monthlyRentCLP: newRent } : current
                                )
                              }
                            />
                          ) : null}
                        </div>
                      </div>
                        {property.monthlyRentUF && (
                          <div>
                            <p className="text-sm text-muted-foreground">Arriendo en UF</p>
                            <p className="text-2xl font-bold text-foreground">
                              UF {property.monthlyRentUF.toFixed(2)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tenant Info */}
              {property.tenant ? (
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <User className="h-5 w-5 text-[#5E8B8C]" />
                      Arrendatario
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-[#5E8B8C] flex items-center justify-center">
                        <span className="text-white font-semibold">
                          {property.tenant.name?.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{property.tenant.name}</p>
                        {tenantIdentity?.value && (
                          <p className="text-sm text-muted-foreground">
                            {tenantIdentity.label}: {tenantIdentity.value}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span className="text-sm">{property.tenant.email}</span>
                      </div>
                      {property.tenant.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span className="text-sm">{property.tenant.phone}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-card border-border border-dashed">
                  <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2 text-base">
                      <User className="h-5 w-5 text-[#5E8B8C]" />
                      Arrendatario
                    </CardTitle>
                    <CardDescription>Sin arrendatario asignado</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center gap-3 py-4">
                    <p className="text-sm text-muted-foreground text-center">
                      Invita por correo o comparte un enlace para que acepte la propiedad en NeiFe.
                    </p>
                    {userRole !== 'BROKER' && (
                      <InviteTenantButton
                        propertyId={propertyId}
                        propertyLabel={property.name || property.address}
                      />
                    )}
                  </CardContent>
                </Card>
              )}

              {property.lat != null && property.lng != null && (
                <Card className="bg-card border-border overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2 text-base">
                      <MapPin className="h-4 w-4 text-[#5E8B8C]" />
                      Ubicación
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <PropertyMiniMap
                      lat={property.lat}
                      lng={property.lng}
                      address={`${property.address}, ${property.commune}`}
                    />
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contract Progress */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-[#5E8B8C]" />
                    Estado del contrato
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {property.contractStart && property.contractEnd ? (
                    <ContractProgressChart 
                      startDate={new Date(property.contractStart)}
                      endDate={new Date(property.contractEnd)}
                      size="large"
                    />
                  ) : (
                    <p className="text-muted-foreground">Sin fechas de contrato definidas</p>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Acciones rápidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {canManageProperty ? (
                    <>
                      <Link href={`?tab=inspecciones`} className="block">
                        <Button size="sm" className="w-full bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-white">
                          <Calendar className="h-4 w-4 mr-2" />
                          Programar inspección
                        </Button>
                      </Link>
                      <Link href={`?tab=reajuste`} className="block">
                        <Button size="sm" variant="outline" className="w-full text-foreground border-border">
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Aplicar IPC
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        className="w-full text-muted-foreground cursor-not-allowed"
                        disabled
                        title={userRole === 'BROKER'
                          ? "Primero necesitas acceso activo a esta propiedad"
                          : "Las acciones están deshabilitadas cuando la propiedad es administrada por un corredor"}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Programar inspección
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-muted-foreground cursor-not-allowed border-border"
                        disabled
                        title={userRole === 'BROKER'
                          ? "Primero necesitas acceso activo a esta propiedad"
                          : "Las acciones están deshabilitadas cuando la propiedad es administrada por un corredor"}
                      >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Aplicar IPC
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Administración Tab */}
        <TabsContent value="administracion" className="space-y-6">
          {landlordDelegatedToBroker ? (
            <div className="bg-[#5E8B8C]/10 border border-[#5E8B8C]/20 rounded-xl p-3 mb-4">
              <p className="text-sm text-[#5E8B8C]">
                Tu corredor gestiona la administración de esta propiedad.
              </p>
            </div>
          ) : userRole !== 'BROKER' ? (
            <AdministrationSection propertyId={propertyId} />
          ) : (
            <div className="bg-[#5E8B8C]/10 border border-[#5E8B8C]/20 rounded-xl p-3 mb-4">
              <p className="text-sm text-[#5E8B8C]">
                {hasBroker
                  ? "Tienes acceso activo a esta propiedad y compartes la misma ficha con el arrendador y el arrendatario."
                  : brokerPermissionStatus === 'APPROVED'
                    ? "Ya tienes permiso del arrendador. Ahora puedes solicitar acceso específico a esta propiedad."
                    : "Primero necesitas la aprobación general del arrendador antes de solicitar acceso a esta propiedad."}
              </p>
            </div>
          )}

          {(userRole === 'BROKER' || !hasBroker) && (
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Users className="h-5 w-5 text-[#5E8B8C]" />
                    Información del agente / corredor
                  </CardTitle>
                  <CardDescription>Datos del agente o corredor de propiedades (registro propio)</CardDescription>
                </div>
                {!editingAgent && (
                  <Button
                    onClick={() => setEditingAgent(true)}
                    size="sm"
                    className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-white"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {editingAgent ? (
                  <>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="agentName" className="text-foreground">Nombre</Label>
                        <Input
                          id="agentName"
                          value={agentData.agentName}
                          onChange={(e) => setAgentData(prev => ({ ...prev, agentName: e.target.value }))}
                          className="bg-background border-input text-foreground"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="agentRut" className="text-foreground">Identificacion</Label>
                        <Input
                          id="agentRut"
                          value={agentData.agentRut}
                          onChange={(e) => setAgentData(prev => ({ ...prev, agentRut: e.target.value }))}
                          className="bg-background border-input text-foreground"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="agentEmail" className="text-foreground">Email</Label>
                        <Input
                          id="agentEmail"
                          type="email"
                          value={agentData.agentEmail}
                          onChange={(e) => setAgentData(prev => ({ ...prev, agentEmail: e.target.value }))}
                          className="bg-background border-input text-foreground"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="agentPhone" className="text-foreground">Teléfono</Label>
                        <Input
                          id="agentPhone"
                          value={agentData.agentPhone}
                          onChange={(e) => setAgentData(prev => ({ ...prev, agentPhone: e.target.value }))}
                          className="bg-background border-input text-foreground"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="agentCompany" className="text-foreground">Empresa</Label>
                        <Input
                          id="agentCompany"
                          value={agentData.agentCompany}
                          onChange={(e) => setAgentData(prev => ({ ...prev, agentCompany: e.target.value }))}
                          className="bg-background border-input text-foreground"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="commissionRate" className="text-foreground">Comisión (%)</Label>
                        <Input
                          id="commissionRate"
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={agentData.commissionRate}
                          onChange={(e) => setAgentData(prev => ({ ...prev, commissionRate: e.target.value }))}
                          className="bg-background border-input text-foreground"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleSaveAgent} 
                        disabled={savingAgent}
                        className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-white"
                      >
                        {savingAgent ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          <>Guardar</>
                        )}
                      </Button>
                      <Button onClick={() => setEditingAgent(false)} variant="outline" className="text-foreground border-border">
                        Cancelar
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    {agentData.agentName ? (
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Nombre</p>
                          <p className="text-foreground font-semibold">{agentData.agentName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Identificacion</p>
                          <p className="text-foreground font-semibold">{agentData.agentRut}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="text-foreground font-semibold">{agentData.agentEmail}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Teléfono</p>
                          <p className="text-foreground font-semibold">{agentData.agentPhone}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Empresa</p>
                          <p className="text-foreground font-semibold">{agentData.agentCompany}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Comisión</p>
                          <p className="text-foreground font-semibold">{agentData.commissionRate}% ({agentData.commissionType})</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">No hay información de corredor registrada</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Inspecciones Tab */}
        <TabsContent value="inspecciones">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Inspecciones</CardTitle>
              <CardDescription>Ver y administrar inspecciones de la propiedad</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={`/dashboard/propiedades/${propertyId}/inspecciones`}>
                <Button className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-white">
                  Ir a inspecciones
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reajuste IPC Tab */}
        <TabsContent value="reajuste">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Reajuste por IPC</CardTitle>
              <CardDescription>Ver y administrar reajustes de arriendo</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={`/dashboard/propiedades/${propertyId}/reajustes`}>
                <Button className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-white">
                  Ir a reajustes
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historial-renta">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Historial de renta</CardTitle>
              <CardDescription>Traza reajustes IPC, acuerdos y correcciones sobre la renta.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={`/dashboard/propiedades/${propertyId}/historial-renta`}>
                <Button className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-white">
                  Ver historial completo
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checklist" className="space-y-6">
          <PropertyChecklist propertyId={propertyId} />
        </TabsContent>

        <TabsContent value="garantia" className="space-y-6">
          <SecurityDepositPanel propertyId={propertyId} />
        </TabsContent>

        <TabsContent value="postulaciones" className="space-y-6">
          <ApplicationPortalManager
            propertyId={propertyId}
            propertyAddress={`${property.address}, ${property.commune}`}
            applicationOpen={property.applicationOpen}
            applicationSlug={property.applicationSlug}
            hasTenant={Boolean(property.tenant)}
          />
        </TabsContent>

        <TabsContent value="pagos">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Pagos</CardTitle>
              <CardDescription>
                Misma vista que en la lista de propiedades, filtrada por esta unidad.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-white gap-2" asChild>
                <Link href={`/dashboard/pagos?property=${propertyId}`}>
                  <CreditCard className="h-4 w-4" />
                  Abrir pagos de esta propiedad
                  <ExternalLink className="h-4 w-4 opacity-80" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="servicios">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Servicios</CardTitle>
              <CardDescription>
                Consumos mensuales (agua, luz, gas) registrados para esta propiedad.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {landlordDelegatedToBroker ? (
                <div className="bg-[#5E8B8C]/10 border border-[#5E8B8C]/20 rounded-xl p-3 mb-4">
                  <p className="text-sm text-[#5E8B8C]">
                    Tu corredor gestiona los servicios de esta propiedad.
                  </p>
                </div>
              ) : (
                <Button className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-white gap-2" asChild>
                  <Link href={`/dashboard/servicios?property=${propertyId}`}>
                    <FileText className="h-4 w-4" />
                    Abrir servicios de esta propiedad
                    <ExternalLink className="h-4 w-4 opacity-80" />
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mantenciones">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Mantenciones</CardTitle>
              <CardDescription>
                Solicitudes y estados de mantención filtrados por esta propiedad.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {landlordDelegatedToBroker ? (
                <div className="bg-[#5E8B8C]/10 border border-[#5E8B8C]/20 rounded-xl p-3 mb-4">
                  <p className="text-sm text-[#5E8B8C]">
                    Tu corredor gestiona las mantenciones de esta propiedad.
                  </p>
                </div>
              ) : (
                <Button className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-white gap-2" asChild>
                  <Link href={`/dashboard/mantenciones?property=${propertyId}`}>
                    <Wrench className="h-4 w-4" />
                    Abrir mantenciones de esta propiedad
                    <ExternalLink className="h-4 w-4 opacity-80" />
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contrato">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Contrato</CardTitle>
              <CardDescription>
                PDF y fechas del contrato asociados a esta propiedad.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-white gap-2" asChild>
                <Link href={`/dashboard/contratos?property=${propertyId}`}>
                  <FileText className="h-4 w-4" />
                  Abrir contratos y documentos
                  <ExternalLink className="h-4 w-4 opacity-80" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="proveedores" className="space-y-6">
          <PropertyProvidersPanel propertyId={propertyId} />
        </TabsContent>

        {userRole === 'LANDLORD' && (
          <TabsContent value="solicitudes" className="space-y-6">
            <PropertyAccessRequestsPanel propertyId={propertyId} showOnlyPending={false} />
          </TabsContent>
        )}
      </Tabs>

      {/* Revoke Mandate Modal */}
      {showRevokeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-foreground">Revocar mandato</CardTitle>
              <CardDescription>
                ¿Estás seguro que deseas revocar el mandato de {brokerInfo?.name || brokerInfo?.email}?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Una vez revocado, volverás a tener control total sobre la administración de esta propiedad.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/mandates/revoke`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ propertyId })
                      })

                      if (!res.ok) throw new Error('Failed to revoke mandate')
                      setShowRevokeModal(false)
                      setHasBroker(false)
                      setBrokerInfo(null)

                      toast({
                        title: 'Mandato revocado',
                        description: 'Ahora tienes control total de la propiedad'
                      })
                    } catch (error) {
                      toast({
                        title: 'Error',
                        description: 'No se pudo revocar el mandato',
                        variant: 'destructive'
                      })
                    }
                  }}
                  disabled={showRevokeModal ? false : undefined}
                  className="bg-[#C27F79] hover:bg-[#C27F79]/90 text-white"
                >
                  {showRevokeModal ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Revocando...
                    </>
                  ) : (
                    <>
                      Revocar mandato
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setShowRevokeModal(false)}
                  variant="outline"
                  className="text-foreground border-border"
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
