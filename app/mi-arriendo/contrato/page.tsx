"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FileText, 
  Download,
  Eye,
  CheckCircle2,
  Camera,
  Image as ImageIcon,
  Calendar
} from "lucide-react"
import { ContractProgressChart } from "@/components/charts/contract-progress"

const contract = {
  id: "1",
  property: "Av. Providencia 1234, Depto 501",
  landlord: "Carlos Arrendador",
  landlordRut: "11.111.111-1",
  tenant: "María González",
  tenantRut: "12.345.678-9",
  startDate: new Date("2024-01-15"),
  endDate: new Date("2025-01-15"),
  monthlyRent: 450000,
  deposit: 450000,
  landlordSigned: true,
  tenantSigned: true,
  signedAt: "2024-01-10",
  pdfUrl: "/contratos/contrato-1.pdf"
}

const propertyPhotos = {
  checkin: [
    { room: "Living", date: "2024-01-15" },
    { room: "Dormitorio 1", date: "2024-01-15" },
    { room: "Dormitorio 2", date: "2024-01-15" },
    { room: "Cocina", date: "2024-01-15" },
    { room: "Baño", date: "2024-01-15" },
    { room: "Terraza", date: "2024-01-15" }
  ],
  checkout: []
}

export default function ContratoPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mi Contrato</h1>
        <p className="text-muted-foreground">Información de tu contrato de arriendo</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
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
              {/* Contract Card */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-foreground">Contrato de Arriendo</CardTitle>
                    <Badge className="bg-[#5E8B8C] text-white">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Vigente
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Parties */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground mb-1">Arrendador</p>
                      <p className="font-medium text-foreground">{contract.landlord}</p>
                      <p className="text-sm text-muted-foreground">RUT: {contract.landlordRut}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground mb-1">Arrendatario</p>
                      <p className="font-medium text-foreground">{contract.tenant}</p>
                      <p className="text-sm text-muted-foreground">RUT: {contract.tenantRut}</p>
                    </div>
                  </div>

                  {/* Contract Details */}
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

                  {/* Signatures */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">Estado de firmas</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-[#5E8B8C]/10">
                        <CheckCircle2 className="h-5 w-5 text-[#5E8B8C]" />
                        <div>
                          <p className="text-sm font-medium text-foreground">Firma Arrendador</p>
                          <p className="text-xs text-muted-foreground">Firmado el {contract.signedAt}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-[#5E8B8C]/10">
                        <CheckCircle2 className="h-5 w-5 text-[#5E8B8C]" />
                        <div>
                          <p className="text-sm font-medium text-foreground">Firma Arrendatario</p>
                          <p className="text-xs text-muted-foreground">Firmado el {contract.signedAt}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" className="text-foreground border-border">
                      <Eye className="h-4 w-4 mr-2" />
                      Ver contrato completo
                    </Button>
                    <Button variant="outline" className="text-foreground border-border">
                      <Download className="h-4 w-4 mr-2" />
                      Descargar PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Legal Info */}
              <Card className="bg-card border-border">
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
              {/* Check-in Photos */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <Badge className="bg-[#5E8B8C] text-white">Check-in</Badge>
                      Fotos de entrada
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {propertyPhotos.checkin[0]?.date}
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {propertyPhotos.checkin.map((photo, index) => (
                      <div key={index} className="space-y-2">
                        <div className="aspect-square bg-[#2D3C3C] rounded-lg flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
                          <ImageIcon className="h-10 w-10 text-[#D5C3B6]/50" />
                        </div>
                        <p className="text-sm font-medium text-foreground text-center">
                          {photo.room}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Check-out Photos */}
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Badge className="bg-[#C27F79] text-white">Check-out</Badge>
                    Fotos de salida
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {propertyPhotos.checkout.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {/* Photos would go here */}
                    </div>
                  ) : (
                    <div className="p-8 rounded-lg border-2 border-dashed border-border text-center">
                      <Camera className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">
                        Las fotos de check-out se tomarán al finalizar el contrato
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contract Progress */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#5E8B8C]" />
                Duración del Contrato
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ContractProgressChart 
                startDate={contract.startDate}
                endDate={contract.endDate}
                size="large"
              />
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card className="bg-card border-border">
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
                <span className="text-muted-foreground">Duración</span>
                <span className="font-medium text-foreground">12 meses</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estado</span>
                <Badge className="bg-[#5E8B8C] text-white">Vigente</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
