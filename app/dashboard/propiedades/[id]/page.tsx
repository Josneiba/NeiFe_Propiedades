"use client"

import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
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
  ExternalLink
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ContractProgressChart } from "@/components/charts/contract-progress"
import { PropertyMiniMap } from "@/components/map/property-mini-map"
import { InviteTenantButton } from "@/components/dashboard/invite-tenant-button"
import { PropertyProvidersPanel } from "@/components/dashboard/property-providers-panel"

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
  landlordId: string
  tenant?: {
    id: string
    name: string
    email: string
    phone: string | null
    rut: string | null
  } | null
  agentName: string | null
  agentRut: string | null
  agentEmail: string | null
  agentPhone: string | null
  agentCompany: string | null
  commissionRate: number | null
  commissionType: string | null
  payments: any[]
}

export default function PropertyDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const propertyId = params.id as string
  const currentTab = searchParams.get("tab") || "resumen"

  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingAgent, setEditingAgent] = useState(false)
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
    const loadProperty = async () => {
      try {
        const res = await fetch(`/api/properties/${propertyId}`)
        if (!res.ok) throw new Error("Failed to load property")
        const json = await res.json()
        const data = json.property as Property
        if (!data) throw new Error("Failed to load property")
        setProperty(data)
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
        toast({
          title: "Error",
          description: "No se pudo cargar la propiedad",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    loadProperty()
  }, [propertyId, toast])

  // Handle agent save
  const handleSaveAgent = async () => {
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
        description: "No se pudo actualizar la información",
        variant: "destructive"
      })
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
    router.push(`?tab=${tab}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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
          {!property.tenant && (
            <InviteTenantButton
              propertyId={propertyId}
              propertyLabel={property.name || property.address}
            />
          )}
        <Link href={`/dashboard/propiedades/${propertyId}/editar`}>
          <Button variant="outline" className="gap-2 text-foreground">
            <Edit className="h-4 w-4" />
            Editar
          </Button>
        </Link>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="bg-muted w-full justify-start overflow-x-auto">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="pagos">Pagos</TabsTrigger>
          <TabsTrigger value="servicios">Servicios</TabsTrigger>
          <TabsTrigger value="mantenciones">Mantenciones</TabsTrigger>
          <TabsTrigger value="contrato">Contrato</TabsTrigger>
          <TabsTrigger value="corredor">Corredor</TabsTrigger>
          <TabsTrigger value="inspecciones">Inspecciones</TabsTrigger>
          <TabsTrigger value="reajuste">Reajuste IPC</TabsTrigger>
          <TabsTrigger value="proveedores">Proveedores</TabsTrigger>
        </TabsList>

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
                          <p className="text-2xl font-bold text-foreground">
                            {property.monthlyRentCLP ? `$${property.monthlyRentCLP.toLocaleString("es-CL")}` : "No especificado"}
                          </p>
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
                        {property.tenant.rut && (
                          <p className="text-sm text-muted-foreground">RUT: {property.tenant.rut}</p>
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
                    <InviteTenantButton
                      propertyId={propertyId}
                      propertyLabel={property.name || property.address}
                    />
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
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Corredor Tab */}
        <TabsContent value="corredor" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#5E8B8C]" />
                  Información del Corredor
                </CardTitle>
                <CardDescription>Datos del agente o corredor de propiedades</CardDescription>
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
                      <Label htmlFor="agentRut" className="text-foreground">RUT</Label>
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
                    <Button onClick={handleSaveAgent} className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-white">
                      Guardar
                    </Button>
                    <Button onClick={() => setEditingAgent(false)} variant="outline" className="text-foreground border-border">
                      Cancelar
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  {agentData.agentName ? (
                    <>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Nombre</p>
                          <p className="text-foreground font-semibold">{agentData.agentName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">RUT</p>
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
                    </>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">No hay información de corredor registrada</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
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
              <Button className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-white gap-2" asChild>
                <Link href={`/dashboard/servicios?property=${propertyId}`}>
                  <FileText className="h-4 w-4" />
                  Abrir servicios de esta propiedad
                  <ExternalLink className="h-4 w-4 opacity-80" />
                </Link>
              </Button>
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
              <Button className="bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-white gap-2" asChild>
                <Link href={`/dashboard/mantenciones?property=${propertyId}`}>
                  <Wrench className="h-4 w-4" />
                  Abrir mantenciones de esta propiedad
                  <ExternalLink className="h-4 w-4 opacity-80" />
                </Link>
              </Button>
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
      </Tabs>
    </div>
  )
}
