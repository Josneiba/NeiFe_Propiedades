import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  FileText,
  Download,
  Eye,
  CheckCircle2,
  Camera,
  Image as ImageIcon,
  Calendar,
  AlertCircle,
} from "lucide-react"
import { auth } from "@/lib/auth-session"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ContractProgressChart } from "@/components/charts/contract-progress"
import { getUserIdentity } from "@/lib/identity-documents"

function formatContractDate(date: Date | null | undefined) {
  if (!date) return "No disponible"
  return date.toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  })
}

function formatTimestamp(date: Date | null | undefined) {
  if (!date) return "No disponible"
  return date.toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export default async function ContratoPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (session.user.role !== "TENANT") redirect("/mi-arriendo")

  const property = await prisma.property.findFirst({
    where: { tenantId: session.user.id },
    select: {
      id: true,
      address: true,
      commune: true,
      monthlyRentCLP: true,
      contractStart: true,
      contractEnd: true,
      landlord: {
        select: {
          name: true,
          rut: true,
          documentType: true,
          documentNumber: true,
          documentNumberNormalized: true,
          email: true,
          phone: true,
        },
      },
      contracts: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          pdfUrl: true,
          status: true,
          createdAt: true,
          signedAt: true,
          landlordSign: true,
          tenantSign: true,
        },
      },
      photos: {
        where: {
          type: {
            in: ["CHECKIN", "CHECKOUT"],
          },
        },
        orderBy: [{ type: "asc" }, { order: "asc" }, { takenAt: "desc" }],
        select: {
          id: true,
          url: true,
          room: true,
          caption: true,
          type: true,
          takenAt: true,
        },
      },
    },
  })

  if (!property) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mi Contrato</h1>
          <p className="text-muted-foreground">Información de tu contrato de arriendo</p>
        </div>
        <Card className="bg-[#2A2520] border-border">
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">No tienes un contrato asignado</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const latestContract = property.contracts[0] ?? null
  const pdfUrl = latestContract?.pdfUrl ?? null
  const landlordSigned =
    Boolean(latestContract?.landlordSign) ||
    latestContract?.status === "ACTIVE" ||
    latestContract?.status === "EXPIRING_SOON"
  const tenantSigned =
    Boolean(latestContract?.tenantSign) ||
    latestContract?.status === "ACTIVE" ||
    latestContract?.status === "EXPIRING_SOON"
  const signedReferenceDate =
    landlordSigned || tenantSigned
      ? latestContract?.signedAt ?? latestContract?.createdAt ?? property.contractStart ?? null
      : null
  const checkInPhotos = property.photos.filter((photo) => photo.type === "CHECKIN")
  const checkOutPhotos = property.photos.filter((photo) => photo.type === "CHECKOUT")

  const contract = {
    id: property.id,
    property: `${property.address}${property.commune ? `, ${property.commune}` : ""}`,
    landlord: property.landlord.name,
    landlordIdentity: getUserIdentity(property.landlord),
    tenant: session.user.name || "Usuario",
    tenantIdentity: getUserIdentity({
      rut: session.user.rut,
      documentType: session.user.documentType,
      documentNumber: session.user.documentNumber,
      documentNumberNormalized: session.user.documentNumberNormalized,
    }),
    startDate: property.contractStart,
    endDate: property.contractEnd,
    monthlyRent: property.monthlyRentCLP || 0,
    deposit: property.monthlyRentCLP || 0,
    signedAt: formatTimestamp(signedReferenceDate),
  }

  const today = new Date()
  const contractEnd = property.contractEnd ? new Date(property.contractEnd) : null
  const daysLeft = contractEnd
    ? Math.floor((contractEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : 0
  const isActive = daysLeft > 0
  const contractDates =
    contract.startDate && contract.endDate
      ? {
          start: contract.startDate,
          end: contract.endDate,
        }
      : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mi Contrato</h1>
        <p className="text-muted-foreground">Información de tu contrato de arriendo</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="contract" className="space-y-6">
            <TabsList className="bg-muted">
              <TabsTrigger value="contract" className="data-[state=active]:bg-card">
                <FileText className="h-4 w-4 mr-2" />
                Contrato
              </TabsTrigger>
              <TabsTrigger value="photos" className="data-[state=active]:bg-card">
                <Camera className="h-4 w-4 mr-2" />
                Fotos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="contract" className="space-y-6">
              <Card className="bg-[#2A2520] border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-foreground">Contrato de Arriendo</CardTitle>
                    <Badge className={isActive ? "bg-[#5E8B8C] text-white" : "bg-[#C27F79]/20 text-[#C27F79]"}>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {isActive ? "Vigente" : "Vencido"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground mb-1">Arrendador</p>
                      <p className="font-medium text-foreground">{contract.landlord}</p>
                      <p className="text-sm text-muted-foreground">
                        {contract.landlordIdentity.label}: {contract.landlordIdentity.value || "No especificado"}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground mb-1">Arrendatario</p>
                      <p className="font-medium text-foreground">{contract.tenant}</p>
                      <p className="text-sm text-muted-foreground">
                        {contract.tenantIdentity.label}: {contract.tenantIdentity.value || "No especificado"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Propiedad</p>
                      <p className="font-medium text-foreground text-sm">{contract.property}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Arriendo mensual</p>
                      <p className="font-medium text-foreground">
                        ${contract.monthlyRent.toLocaleString("es-CL")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Garantía</p>
                      <p className="font-medium text-foreground">
                        ${contract.deposit.toLocaleString("es-CL")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Fecha de firma</p>
                      <p className="font-medium text-foreground">{contract.signedAt}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-3">Estado de firmas</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div
                        className={`flex items-center gap-3 p-3 rounded-lg ${
                          landlordSigned ? "bg-[#5E8B8C]/10" : "bg-[#F2C94C]/10"
                        }`}
                      >
                        {landlordSigned ? (
                          <CheckCircle2 className="h-5 w-5 text-[#5E8B8C]" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-[#F2C94C]" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-foreground">Firma Arrendador</p>
                          <p className="text-xs text-muted-foreground">
                            {landlordSigned ? `Firmado el ${contract.signedAt}` : "Pendiente de firma"}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`flex items-center gap-3 p-3 rounded-lg ${
                          tenantSigned ? "bg-[#5E8B8C]/10" : "bg-[#F2C94C]/10"
                        }`}
                      >
                        {tenantSigned ? (
                          <CheckCircle2 className="h-5 w-5 text-[#5E8B8C]" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-[#F2C94C]" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-foreground">Firma Arrendatario</p>
                          <p className="text-xs text-muted-foreground">
                            {tenantSigned ? `Firmado el ${contract.signedAt}` : "Pendiente de firma"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {pdfUrl ? (
                    <div className="flex gap-3 flex-wrap">
                      <a
                        href={pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-[#FAF6F2] px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        Ver contrato
                      </a>
                      <a
                        href={pdfUrl}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 border border-[#D5C3B6]/20 text-[#D5C3B6] hover:bg-[#D5C3B6]/5 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        Descargar PDF
                      </a>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-[#F2C94C]/10 border border-[#F2C94C]/20">
                      <AlertCircle className="h-4 w-4 text-[#F2C94C]" />
                      <p className="text-sm text-[#D5C3B6]">
                        El propietario aún no ha subido el contrato PDF.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-[#2A2520] border-border">
                <CardHeader>
                  <CardTitle className="text-foreground text-lg">Información Legal</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    Este contrato se rige por la <strong className="text-foreground">Ley 18.101</strong> sobre
                    arrendamiento de predios urbanos y la <strong className="text-foreground">Ley 21.461</strong>
                    ("Devuélveme mi casa").
                  </p>
                  <p>
                    El contrato incluye firma electrónica con validez legal según la
                    <strong className="text-foreground"> Ley 19.799</strong> sobre documentos electrónicos.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="photos" className="space-y-6">
              <Card className="bg-[#2A2520] border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <Badge className="bg-[#5E8B8C] text-white">Check-in</Badge>
                      Fotos de entrada
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {checkInPhotos[0] ? formatTimestamp(checkInPhotos[0].takenAt) : "Sin registro"}
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  {checkInPhotos.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {checkInPhotos.map((photo) => (
                        <a
                          key={photo.id}
                          href={photo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="space-y-2"
                        >
                          <div className="aspect-square bg-[#2D3C3C] rounded-lg overflow-hidden hover:opacity-80 transition-opacity">
                            <img
                              src={photo.url}
                              alt={photo.caption || `Registro de ${photo.room}`}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium text-foreground">{photo.room}</p>
                            {photo.caption && (
                              <p className="text-xs text-muted-foreground">{photo.caption}</p>
                            )}
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 rounded-lg border-2 border-dashed border-border text-center">
                      <Camera className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">
                        Aún no hay fotos de check-in registradas para esta propiedad
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-[#2A2520] border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Badge className="bg-[#C27F79] text-white">Check-out</Badge>
                    Fotos de salida
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {checkOutPhotos.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {checkOutPhotos.map((photo) => (
                        <a
                          key={photo.id}
                          href={photo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="space-y-2"
                        >
                          <div className="aspect-square bg-[#2D3C3C] rounded-lg overflow-hidden hover:opacity-80 transition-opacity">
                            <img
                              src={photo.url}
                              alt={photo.caption || `Registro de ${photo.room}`}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium text-foreground">{photo.room}</p>
                            {photo.caption && (
                              <p className="text-xs text-muted-foreground">{photo.caption}</p>
                            )}
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 rounded-lg border-2 border-dashed border-border text-center">
                      <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">
                        Las fotos de check-out aparecerán aquí cuando exista un registro de salida
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          {contractDates && (
            <Card className="bg-[#2A2520] border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#5E8B8C]" />
                  Duración del Contrato
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ContractProgressChart
                  startDate={contractDates.start}
                  endDate={contractDates.end}
                  size="large"
                />
              </CardContent>
            </Card>
          )}

          <Card className="bg-[#2A2520] border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-lg">Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Arriendo</span>
                <span className="font-medium text-foreground">
                  ${contract.monthlyRent.toLocaleString("es-CL")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Garantía</span>
                <span className="font-medium text-foreground">
                  ${contract.deposit.toLocaleString("es-CL")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Inicio</span>
                <span className="font-medium text-foreground">
                  {formatContractDate(contract.startDate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Término</span>
                <span className="font-medium text-foreground">
                  {formatContractDate(contract.endDate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duración</span>
                <span className="font-medium text-foreground">
                  {contractDates
                    ? `${Math.round(
                        (contractDates.end.getTime() - contractDates.start.getTime()) /
                          (1000 * 60 * 60 * 24 * 30)
                      )} meses`
                    : "No disponible"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estado</span>
                <Badge className={isActive ? "bg-[#5E8B8C] text-white" : "bg-[#C27F79]/20 text-[#C27F79]"}>
                  {isActive ? "Vigente" : "Vencido"}
                </Badge>
              </div>
              {!isActive && daysLeft < 0 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">Contrato vencido hace {Math.abs(daysLeft)} días</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
