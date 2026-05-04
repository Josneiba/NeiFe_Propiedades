import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  FileText,
  Camera,
  CheckCircle2,
  AlertCircle,
  Send,
  PenSquare,
} from "lucide-react"
import { ContractProgressChart } from "@/components/charts/contract-progress"
import { ContractPdfActions } from '@/components/dashboard/contract-pdf-actions'
import { PropertyPhotosTab } from '@/components/dashboard/property-photos-tab'
import { getManagedPropertiesWhere } from '@/lib/contracts'
import { ContractRenewalDialog } from '@/components/contracts/contract-renewal-dialog'

type Props = {
  actorRole: 'LANDLORD' | 'OWNER' | 'BROKER'
  userId: string
  propertyFilterId?: string | null
  basePath: '/dashboard/contratos' | '/broker/contratos'
  propertyDetailBasePath: '/dashboard/propiedades' | '/broker/propiedades'
}

function formatStatus(property: {
  contractEnd: Date | null
  contracts: Array<{
    status: string
    landlordSign: string | null
    tenantSign: string | null
  }>
}) {
  const latest = property.contracts[0] ?? null
  if (!latest) return { label: 'Sin contrato', className: 'bg-[#9C8578]/15 text-[#9C8578] border border-[#9C8578]/30', hint: 'Sube un borrador PDF para comenzar.' }
  if (latest.status === 'DRAFT') {
    return {
      label: 'Borrador',
      className: 'bg-[#9C8578]/15 text-[#9C8578] border border-[#9C8578]/30',
      hint: 'Aun no se ha enviado al arrendatario.',
    }
  }
  if (latest.status === 'PENDING_SIGNATURES') {
    return {
      label: 'En firma',
      className: 'bg-[#F2C94C]/15 text-[#F2C94C] border border-[#F2C94C]/30',
      hint: latest.landlordSign
        ? 'Enviado al arrendatario. Esperando copia firmada.'
        : 'Pendiente de envio.',
    }
  }
  if (latest.status === 'ACTIVE' && latest.tenantSign) {
    return {
      label: 'Firmado',
      className: 'bg-[#B8965A]/15 text-[#B8965A] border border-[#B8965A]/30',
      hint: 'La copia final firmada es la version vigente.',
    }
  }

  const end = property.contractEnd
  if (!end) return { label: 'Borrador', className: 'bg-[#9C8578]/15 text-[#9C8578] border border-[#9C8578]/30', hint: 'Completa fechas para tener trazabilidad del contrato.' }
  const now = new Date()
  if (end < now) return { label: 'Vencido', className: 'bg-[#C27F79]/15 text-[#C27F79] border border-[#C27F79]/30', hint: 'El contrato ya vencio.' }
  return { label: 'Activo', className: 'bg-[#5E8B8C]/15 text-[#5E8B8C] border border-[#5E8B8C]/30', hint: 'Contrato vigente.' }
}

export async function ContractWorkspace({
  actorRole,
  userId,
  propertyFilterId,
  basePath,
  propertyDetailBasePath,
}: Props) {
  const where = getManagedPropertiesWhere(userId, actorRole)

  const filterProperty =
    propertyFilterId != null && propertyFilterId !== ''
      ? await prisma.property.findFirst({
          where: {
            ...where,
            id: propertyFilterId,
          },
          select: { id: true, name: true, address: true },
        })
      : null

  const properties = await prisma.property.findMany({
    where: {
      ...where,
      ...(filterProperty ? { id: filterProperty.id } : {}),
    },
    include: {
      tenant: {
        select: { id: true, name: true, email: true },
      },
      managedByUser: {
        select: { id: true, name: true, email: true },
      },
      contracts: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const isBroker = actorRole === 'BROKER'

  return (
    <div className="space-y-6">
      {filterProperty && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[#D5C3B6]/10 bg-[#2A2520] px-4 py-3 text-sm">
          <span className="text-[#FAF6F2]">
            Filtrado por: <strong>{filterProperty.name || filterProperty.address}</strong>
          </span>
          <Button variant="outline" size="sm" className="border-[#D5C3B6]/20 text-[#D5C3B6]" asChild>
            <Link href={basePath}>Ver todas las propiedades</Link>
          </Button>
          <Button variant="outline" size="sm" className="border-[#D5C3B6]/20 text-[#D5C3B6]" asChild>
            <Link href={`${propertyDetailBasePath}/${filterProperty.id}`}>Ir al detalle</Link>
          </Button>
        </div>
      )}

      <Tabs defaultValue="contracts" className="space-y-6">
        <TabsList className="bg-[#2A2520] border border-[#D5C3B6]/10">
          <TabsTrigger value="contracts" className="text-[#9C8578] data-[state=active]:bg-[#5E8B8C] data-[state=active]:text-[#FAF6F2]">
            <FileText className="h-4 w-4 mr-2" />
            Contratos
          </TabsTrigger>
          <TabsTrigger value="photos" className="text-[#9C8578] data-[state=active]:bg-[#5E8B8C] data-[state=active]:text-[#FAF6F2]">
            <Camera className="h-4 w-4 mr-2" />
            Registro Fotográfico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contracts" className="space-y-4">
          {properties.length === 0 ? (
            <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 text-[#9C8578] mx-auto mb-3 opacity-50" />
                <p className="text-[#9C8578] mb-4">
                  {isBroker ? 'No tienes propiedades gestionadas' : 'No tienes propiedades registradas'}
                </p>
                <Button className="bg-[#75524C] hover:bg-[#75524C]/90 text-[#D5C3B6]" asChild>
                  <Link href={isBroker ? '/broker/propiedades' : '/dashboard/propiedades/nueva'}>
                    {isBroker ? 'Ir a propiedades' : 'Agregar propiedad'}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            properties.map((property) => {
              const status = formatStatus(property)
              const latestContract = property.contracts[0] ?? null

              return (
                <Card key={property.id} className="bg-[#2D3C3C] border-[#D5C3B6]/10">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-[#75524C]/20 flex items-center justify-center">
                              <FileText className="h-6 w-6 text-[#75524C]" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-[#FAF6F2]">{property.name || property.address}</h3>
                              <p className="text-sm text-[#9C8578]">
                                {property.tenant?.name ?? 'Sin arrendatario asignado'}
                              </p>
                              {isBroker && property.landlordId ? (
                                <p className="text-xs text-[#9C8578]">
                                  Gestionada por corredor en nombre del propietario.
                                </p>
                              ) : null}
                            </div>
                          </div>
                          <Badge className={status.className}>
                            <CheckCircle2 className="h-3 w-3 mr-1" /> {status.label}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-[#9C8578]">Arriendo</p>
                            <p className="font-semibold text-[#FAF6F2]">
                              ${property.monthlyRentCLP?.toLocaleString("es-CL") || '—'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-[#9C8578]">Inicio</p>
                            <p className="text-sm text-[#FAF6F2]">
                              {property.contractStart ? new Date(property.contractStart).toLocaleDateString('es-CL') : '—'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-[#9C8578]">Término</p>
                            <p className="text-sm text-[#FAF6F2]">
                              {property.contractEnd ? new Date(property.contractEnd).toLocaleDateString('es-CL') : '—'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-[#9C8578]">Flujo</p>
                            <p className="text-sm text-[#FAF6F2]">{status.hint}</p>
                          </div>
                        </div>

                        <div className="rounded-lg border border-[#D5C3B6]/10 bg-[#1C1917] p-4">
                          <div className="flex flex-wrap items-center gap-4 text-sm">
                            <div className="inline-flex items-center gap-2 text-[#FAF6F2]">
                              <UploadFlowIcon status={latestContract?.status ?? 'NONE'} />
                              <span>
                                {latestContract?.status === 'ACTIVE'
                                  ? 'Solo se mantiene una copia final firmada como version vigente.'
                                  : 'Sube un borrador, envialo al arrendatario y luego consolida la copia firmada.'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <ContractPdfActions
                          key={`${property.id}-${latestContract?.pdfUrl ?? 'none'}-${latestContract?.status ?? 'none'}`}
                          propertyId={property.id}
                          initialPdfUrl={latestContract?.pdfUrl ?? null}
                          initialStatus={latestContract?.status ?? null}
                          tenantName={property.tenant?.name ?? null}
                          actorRole={actorRole}
                        />

                        <ContractRenewalDialog
                          propertyId={property.id}
                          propertyName={property.name || property.address}
                          currentStartDate={property.contractStart}
                          currentEndDate={property.contractEnd}
                          currentRentCLP={property.monthlyRentCLP}
                          currentRentUF={property.monthlyRentUF}
                          hasTenant={Boolean(property.tenant?.id)}
                        />

                        <p className="text-xs text-[#9C8578] flex items-start gap-1">
                          <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                          Cuando el arrendatario sube la copia firmada, esa version reemplaza al borrador en la base y pasa a ser la copia autoritativa.
                        </p>
                      </div>

                      {property.contractStart && property.contractEnd && (
                        <div className="lg:w-72 p-4 rounded-lg bg-[#1C1917]">
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
              )
            })
          )}
        </TabsContent>

        <TabsContent value="photos" className="space-y-6">
          {properties.length === 0 ? (
            <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
              <CardContent className="p-12 text-center">
                <Camera className="h-12 w-12 text-[#9C8578] mx-auto mb-3 opacity-50" />
                <p className="text-[#9C8578] mb-4">
                  {isBroker ? 'No tienes propiedades gestionadas' : 'No tienes propiedades registradas'}
                </p>
              </CardContent>
            </Card>
          ) : (
            properties.map((property) => (
              <Card key={`photos-${property.id}`} className="bg-[#2D3C3C] border-[#D5C3B6]/10">
                <CardHeader>
                  <CardTitle className="text-[#FAF6F2] flex items-center gap-2">
                    <Camera className="h-5 w-5 text-[#75524C]" />
                    {property.name || property.address}
                  </CardTitle>
                  <p className="text-sm text-[#9C8578]">
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

function UploadFlowIcon({ status }: { status: string }) {
  if (status === 'PENDING_SIGNATURES') return <Send className="h-4 w-4 text-[#B8965A]" />
  if (status === 'ACTIVE') return <CheckCircle2 className="h-4 w-4 text-[#5E8B8C]" />
  return <PenSquare className="h-4 w-4 text-[#75524C]" />
}
