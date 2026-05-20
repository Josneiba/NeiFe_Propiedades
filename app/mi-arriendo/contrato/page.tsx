import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  FileText,
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
import { TenantContractSignActions } from "@/components/contracts/tenant-contract-sign-actions"
import { formatDateCompact, formatDateLong } from "@/lib/utils"

function formatContractDate(date: Date | null | undefined) {
  return formatDateLong(date)
}

function formatTimestamp(date: Date | null | undefined) {
  return formatDateLong(date)
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
      managedByUser: {
        select: {
          name: true,
          email: true,
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
          <h1 className="text-2xl font-serif font-semibold text-[#FAF6F2]">Mi Contrato</h1>
          <p className="text-sm text-[#9C8578] mt-0.5">Información de tu contrato de arriendo</p>
        </div>
        <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
          <CardContent className="p-10 text-center">
            <FileText className="h-10 w-10 text-[#9C8578]/40 mx-auto mb-3" />
            <p className="text-[#9C8578]">No tienes un contrato asignado</p>
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
        <h1 className="text-2xl font-serif font-semibold text-[#FAF6F2]">Mi Contrato</h1>
        <p className="text-sm text-[#9C8578] mt-0.5">Información de tu contrato de arriendo</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="contract" className="space-y-6">
            <TabsList className="bg-[#2D3C3C] border border-[#D5C3B6]/10">
              <TabsTrigger value="contract" className="data-[state=active]:bg-[#1C1917] data-[state=active]:text-[#FAF6F2] text-[#9C8578]">
                <FileText className="h-4 w-4 mr-2" />
                Contrato
              </TabsTrigger>
              <TabsTrigger value="photos" className="data-[state=active]:bg-[#1C1917] data-[state=active]:text-[#FAF6F2] text-[#9C8578]">
                <Camera className="h-4 w-4 mr-2" />
                Fotos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="contract" className="space-y-6">
              <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-[#FAF6F2]">Contrato de Arriendo</CardTitle>
                    <Badge className={isActive ? "bg-[#5E8B8C] text-[#FAF6F2]" : "bg-[#C27F79]/20 text-[#C27F79]"}>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {isActive ? "Vigente" : "Vencido"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-4 rounded-lg bg-[#1C1917]/60 border border-[#D5C3B6]/10">
                      <p className="text-xs text-[#9C8578] mb-1">Arrendador</p>
                      <p className="font-medium text-[#FAF6F2]">{contract.landlord}</p>
                      <p className="text-xs text-[#9C8578]">
                        {contract.landlordIdentity.label}: {contract.landlordIdentity.value || "No especificado"}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-[#1C1917]/60 border border-[#D5C3B6]/10">
                      <p className="text-xs text-[#9C8578] mb-1">Arrendatario</p>
                      <p className="font-medium text-[#FAF6F2]">{contract.tenant}</p>
                      <p className="text-xs text-[#9C8578]">
                        {contract.tenantIdentity.label}: {contract.tenantIdentity.value || "No especificado"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-[#9C8578]">Propiedad</p>
                      <p className="text-sm font-medium text-[#FAF6F2]">{contract.property}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#9C8578]">Arriendo mensual</p>
                      <p className="text-sm font-medium text-[#FAF6F2]">
                        ${contract.monthlyRent.toLocaleString("es-CL")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#9C8578]">Garantía</p>
                      <p className="text-sm font-medium text-[#FAF6F2]">
                        ${contract.deposit.toLocaleString("es-CL")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#9C8578]">Fecha de firma</p>
                      <p className="text-sm font-medium text-[#FAF6F2]">{contract.signedAt}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-[#9C8578] mb-3">Estado de firmas</p>
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
                          <p className="text-sm font-medium text-[#FAF6F2]">
                            {property.managedByUser?.name ? "Firma Arrendador / Corredor" : "Firma Arrendador"}
                          </p>
                          <p className="text-xs text-[#9C8578]">
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
                          <p className="text-sm font-medium text-[#FAF6F2]">Firma Arrendatario</p>
                          <p className="text-xs text-[#9C8578]">
                            {tenantSigned ? `Firmado el ${contract.signedAt}` : "Pendiente de firma"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {pdfUrl ? (
                    <TenantContractSignActions
                      propertyId={property.id}
                      pdfUrl={pdfUrl}
                      status={latestContract?.status ?? null}
                    />
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

              <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
                <CardHeader>
                  <CardTitle className="text-sm font-medium text-[#FAF6F2]">Información Legal</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-[#9C8578]">
                  <p>
                    Este contrato se rige por la <strong className="text-[#FAF6F2]">Ley 18.101</strong> sobre
                    arrendamiento de predios urbanos y la <strong className="text-[#FAF6F2]">Ley 21.461</strong>
                    ("Devuélveme mi casa").
                  </p>
                  <p>
                    El contrato incluye firma electrónica con validez legal según la
                    <strong className="text-[#FAF6F2]"> Ley 19.799</strong> sobre documentos electrónicos.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="photos" className="space-y-6">
              <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-[#FAF6F2] flex items-center gap-2">
                      <Badge className="bg-[#5E8B8C] text-[#FAF6F2]">Check-in</Badge>
                      Fotos de entrada
                    </CardTitle>
                    <p className="text-sm text-[#9C8578]">
                      {checkInPhotos[0] ? formatDateCompact(checkInPhotos[0].takenAt) : "Sin registro"}
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
                            <p className="text-sm font-medium text-[#FAF6F2]">{photo.room}</p>
                            {photo.caption && (
                              <p className="text-xs text-[#9C8578]">{photo.caption}</p>
                            )}
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 rounded-lg border-2 border-dashed border-[#D5C3B6]/15 text-center">
                      <Camera className="h-10 w-10 mx-auto text-[#9C8578]/50 mb-2" />
                      <p className="text-[#9C8578]">
                        Aún no hay fotos de check-in registradas para esta propiedad
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
                <CardHeader>
                  <CardTitle className="text-[#FAF6F2] flex items-center gap-2">
                    <Badge className="bg-[#C27F79] text-[#FAF6F2]">Check-out</Badge>
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
                            <p className="text-sm font-medium text-[#FAF6F2]">{photo.room}</p>
                            {photo.caption && (
                              <p className="text-xs text-[#9C8578]">{photo.caption}</p>
                            )}
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 rounded-lg border-2 border-dashed border-[#D5C3B6]/15 text-center">
                      <ImageIcon className="h-10 w-10 mx-auto text-[#9C8578]/50 mb-2" />
                      <p className="text-[#9C8578]">
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
            <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
              <CardHeader>
                <CardTitle className="text-[#FAF6F2] flex items-center gap-2">
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

          <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
            <CardContent className="p-5">
              <p className="text-xs font-medium uppercase tracking-widest text-[#B8965A] mb-4">Resumen</p>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-[#9C8578]">Arriendo</span>
                  <span className="font-medium text-[#FAF6F2]">
                    ${contract.monthlyRent.toLocaleString("es-CL")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9C8578]">Garantía</span>
                  <span className="font-medium text-[#FAF6F2]">
                    ${contract.deposit.toLocaleString("es-CL")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9C8578]">Inicio</span>
                  <span className="font-medium text-[#FAF6F2]">
                    {formatContractDate(contract.startDate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9C8578]">Término</span>
                  <span className="font-medium text-[#FAF6F2]">
                    {formatContractDate(contract.endDate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9C8578]">Duración</span>
                  <span className="font-medium text-[#FAF6F2]">
                    {contractDates
                      ? `${Math.round(
                          (contractDates.end.getTime() - contractDates.start.getTime()) /
                            (1000 * 60 * 60 * 24 * 30)
                        )} meses`
                      : "No disponible"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#9C8578]">Estado</span>
                  <Badge className={isActive ? "bg-[#5E8B8C] text-[#FAF6F2]" : "bg-[#C27F79]/20 text-[#C27F79]"}>
                    {isActive ? "Vigente" : "Vencido"}
                  </Badge>
                </div>
                {!isActive && daysLeft < 0 && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-[#C27F79]/10 border border-[#C27F79]/20 text-[#C27F79]">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">Contrato vencido hace {Math.abs(daysLeft)} días</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
