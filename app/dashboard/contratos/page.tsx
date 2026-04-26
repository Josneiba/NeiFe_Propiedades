import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FileText, 
  Camera,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import { ContractProgressChart } from "@/components/charts/contract-progress"
import { ContractPdfActions } from '@/components/dashboard/contract-pdf-actions'
import { PropertyPhotosTab } from '@/components/dashboard/property-photos-tab'

export default async function ContratosPage({
  searchParams,
}: {
  searchParams: Promise<{ property?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.role === 'BROKER') {
    redirect('/broker')
  }
  if (session.user.role !== 'LANDLORD' && session.user.role !== 'OWNER') {
    redirect('/mi-arriendo')
  }

  const { property: filterPropertyId } = await searchParams

  const filterProperty =
    filterPropertyId != null && filterPropertyId !== ''
      ? await prisma.property.findFirst({
          where: {
            id: filterPropertyId,
            landlordId: session.user.id,
            isActive: true,
          },
          select: { id: true, name: true, address: true },
        })
      : null

  if (filterPropertyId && !filterProperty) {
    redirect('/dashboard/contratos')
  }

  const properties = await prisma.property.findMany({
    where: {
      landlordId: session.user.id,
      isActive: true,
      ...(filterProperty ? { id: filterProperty.id } : {}),
    },
    include: {
      tenant: {
        select: { id: true, name: true },
      },
      contracts: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const contractDocStatus = (p: (typeof properties)[0]) => {
    const end = p.contractEnd
    if (!end) return { label: 'Borrador', className: 'bg-muted text-foreground' }
    const now = new Date()
    if (end < now) return { label: 'Vencido', className: 'bg-red-600 text-white' }
    const soon = new Date()
    soon.setDate(soon.getDate() + 90)
    if (end < soon) return { label: 'Por vencer', className: 'bg-[#F2C94C] text-[#2D3C3C]' }
    return { label: 'Activo', className: 'bg-[#5E8B8C] text-white' }
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Contratos y Documentos</h1>
        <p className="text-muted-foreground">Gestiona contratos digitales y registros fotográficos</p>
        {filterProperty && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
            <span className="text-foreground">
              Filtrado por:{' '}
              <strong>{filterProperty.name || filterProperty.address}</strong>
            </span>
            <Button variant="outline" size="sm" className="border-border" asChild>
              <Link href="/dashboard/contratos">Ver todas las propiedades</Link>
            </Button>
            <Button variant="outline" size="sm" className="border-border" asChild>
              <Link href={`/dashboard/propiedades/${filterProperty.id}`}>Ir al detalle</Link>
            </Button>
          </div>
        )}
      </div>

      <Tabs defaultValue="contracts" className="space-y-6">
        <TabsList className="bg-muted">
          <TabsTrigger value="contracts" className="data-[state=active]:bg-card">
            <FileText className="h-4 w-4 mr-2" />
            Contratos
          </TabsTrigger>
          <TabsTrigger value="photos" className="data-[state=active]:bg-card">
            <Camera className="h-4 w-4 mr-2" />
            Registro Fotográfico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contracts" className="space-y-4">
          {properties.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground mb-4">No tienes propiedades registradas</p>
                <Button className="bg-[#75524C] hover:bg-[#75524C]/90 text-[#D5C3B6]" asChild>
                  <Link href="/dashboard/propiedades/nueva">Agregar propiedad</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            properties.map((property) => (
              <Card key={property.id} className="bg-card border-border">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Contract Info */}
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-[#75524C]/20 flex items-center justify-center">
                            <FileText className="h-6 w-6 text-[#75524C]" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{property.name || property.address}</h3>
                            <p className="text-sm text-muted-foreground">
                              {property.tenant?.name ?? 'Sin arrendatario asignado'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Arriendo</p>
                          <p className="font-semibold text-foreground">
                            ${property.monthlyRentCLP?.toLocaleString("es-CL") || '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Inicio</p>
                          <p className="text-sm text-foreground">
                            {property.contractStart ? new Date(property.contractStart).toLocaleDateString('es-CL') : '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Término</p>
                          <p className="text-sm text-foreground">
                            {property.contractEnd ? new Date(property.contractEnd).toLocaleDateString('es-CL') : '—'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Estado contrato</p>
                          {(() => {
                            const s = contractDocStatus(property)
                            return (
                              <Badge className={s.className}>
                                <CheckCircle2 className="h-3 w-3 mr-1" /> {s.label}
                              </Badge>
                            )
                          })()}
                        </div>
                      </div>

                      <ContractPdfActions
                        key={`${property.id}-${property.contracts[0]?.pdfUrl ?? 'none'}`}
                        propertyId={property.id}
                        initialPdfUrl={property.contracts[0]?.pdfUrl ?? null}
                      />
                      <p className="text-xs text-muted-foreground flex items-start gap-1">
                        <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                        El PDF queda asociado a esta propiedad. Puedes subir una nueva versión cuando quieras.
                      </p>
                    </div>

                    {/* Contract Progress */}
                    {property.contractStart && property.contractEnd && (
                      <div className="lg:w-72 p-4 rounded-lg bg-muted/50">
                        <ContractProgressChart 
                          startDate={property.contractStart}
                          endDate={property.contractEnd}
                          size="large"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          <Card className="bg-card border-border border-dashed">
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-foreground mb-2">Más propiedades</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Cada propiedad tiene su propio PDF de contrato arriba. Puedes crear nuevas propiedades desde Propiedades.
              </p>
              <Button className="bg-[#75524C] hover:bg-[#75524C]/90 text-[#D5C3B6]" asChild>
                <Link href="/dashboard/propiedades">Ir a propiedades</Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="photos" className="space-y-6">
          {properties.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="p-12 text-center">
                <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground mb-4">No tienes propiedades registradas</p>
                <Button className="bg-[#75524C] hover:bg-[#75524C]/90 text-[#D5C3B6]" asChild>
                  <Link href="/dashboard/propiedades/nueva">Agregar propiedad</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            properties.map((property) => (
              <Card key={`photos-${property.id}`} className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Camera className="h-5 w-5 text-[#75524C]" />
                    {property.name || property.address}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {property.tenant?.name ?? 'Sin arrendatario asignado'}
                  </p>
                </CardHeader>
                <CardContent>
                  <PropertyPhotosTab propertyId={property.id} />
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
