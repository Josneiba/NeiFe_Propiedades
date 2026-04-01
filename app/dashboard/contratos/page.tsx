"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FileText, 
  Building2,
  Download,
  Eye,
  Camera,
  PenTool,
  CheckCircle2,
  Clock,
  Image as ImageIcon
} from "lucide-react"
import { ContractProgressChart } from "@/components/charts/contract-progress"

const contracts = [
  {
    id: "1",
    property: "Av. Providencia 1234, Depto 501",
    tenant: "María González",
    startDate: new Date("2024-01-15"),
    endDate: new Date("2025-01-15"),
    monthlyRent: 450000,
    landlordSigned: true,
    tenantSigned: true,
    pdfUrl: "/contratos/contrato-1.pdf",
    signedAt: "2024-01-10"
  },
  {
    id: "2",
    property: "Los Leones 567, Casa 12",
    tenant: "Pedro Soto",
    startDate: new Date("2023-06-01"),
    endDate: new Date("2025-06-01"),
    monthlyRent: 650000,
    landlordSigned: true,
    tenantSigned: true,
    pdfUrl: "/contratos/contrato-2.pdf",
    signedAt: "2023-05-28"
  },
  {
    id: "3",
    property: "Manuel Montt 890, Depto 302",
    tenant: "Ana Muñoz",
    startDate: new Date("2024-03-01"),
    endDate: new Date("2026-03-01"),
    monthlyRent: 380000,
    landlordSigned: true,
    tenantSigned: false,
    pdfUrl: null,
    signedAt: null
  }
]

const propertyPhotos = [
  {
    propertyId: "1",
    property: "Av. Providencia 1234, Depto 501",
    checkin: [
      { room: "Living", date: "2024-01-15" },
      { room: "Dormitorio 1", date: "2024-01-15" },
      { room: "Cocina", date: "2024-01-15" },
      { room: "Baño", date: "2024-01-15" }
    ],
    checkout: []
  },
  {
    propertyId: "2",
    property: "Los Leones 567, Casa 12",
    checkin: [
      { room: "Living", date: "2023-06-01" },
      { room: "Dormitorio Principal", date: "2023-06-01" }
    ],
    checkout: []
  }
]

export default function ContratosPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Contratos y Documentos</h1>
        <p className="text-muted-foreground">Gestiona contratos digitales y registros fotográficos</p>
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
          {contracts.map((contract) => (
            <Card key={contract.id} className="bg-card border-border">
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
                          <h3 className="font-semibold text-foreground">{contract.property}</h3>
                          <p className="text-sm text-muted-foreground">{contract.tenant}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Arriendo</p>
                        <p className="font-semibold text-foreground">
                          ${contract.monthlyRent.toLocaleString("es-CL")}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Firma Arrendador</p>
                        <Badge className={contract.landlordSigned 
                          ? "bg-[#5E8B8C] text-white" 
                          : "bg-[#F2C94C] text-[#2D3C3C]"
                        }>
                          {contract.landlordSigned ? (
                            <><CheckCircle2 className="h-3 w-3 mr-1" /> Firmado</>
                          ) : (
                            <><Clock className="h-3 w-3 mr-1" /> Pendiente</>
                          )}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Firma Arrendatario</p>
                        <Badge className={contract.tenantSigned 
                          ? "bg-[#5E8B8C] text-white" 
                          : "bg-[#F2C94C] text-[#2D3C3C]"
                        }>
                          {contract.tenantSigned ? (
                            <><CheckCircle2 className="h-3 w-3 mr-1" /> Firmado</>
                          ) : (
                            <><Clock className="h-3 w-3 mr-1" /> Pendiente</>
                          )}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Fecha firma</p>
                        <p className="text-sm text-foreground">
                          {contract.signedAt || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {contract.pdfUrl ? (
                        <>
                          <Button variant="outline" className="text-foreground border-border">
                            <Eye className="h-4 w-4 mr-2" />
                            Ver contrato
                          </Button>
                          <Button variant="outline" className="text-foreground border-border">
                            <Download className="h-4 w-4 mr-2" />
                            Descargar PDF
                          </Button>
                        </>
                      ) : (
                        <Button className="bg-[#75524C] hover:bg-[#75524C]/90 text-[#D5C3B6]">
                          <PenTool className="h-4 w-4 mr-2" />
                          Firmar contrato
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Contract Progress */}
                  <div className="lg:w-72 p-4 rounded-lg bg-muted/50">
                    <ContractProgressChart 
                      startDate={contract.startDate}
                      endDate={contract.endDate}
                      size="large"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Card className="bg-card border-border border-dashed">
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-foreground mb-2">Crear nuevo contrato</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Genera un contrato digital basado en la Ley 18.101 chilena
              </p>
              <Button className="bg-[#75524C] hover:bg-[#75524C]/90 text-[#D5C3B6]">
                Generar contrato
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="photos" className="space-y-6">
          {propertyPhotos.map((property) => (
            <Card key={property.propertyId} className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-[#5E8B8C]" />
                  <CardTitle className="text-foreground">{property.property}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Check-in Photos */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-foreground flex items-center gap-2">
                      <Badge className="bg-[#5E8B8C] text-white">Check-in</Badge>
                      Fotos de entrada
                    </h4>
                    <Button variant="outline" size="sm" className="text-foreground border-border">
                      <Camera className="h-4 w-4 mr-2" />
                      Agregar fotos
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {property.checkin.map((photo, index) => (
                      <div key={index} className="space-y-2">
                        <div className="aspect-square bg-[#2D3C3C] rounded-lg flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-[#D5C3B6]/50" />
                        </div>
                        <p className="text-sm font-medium text-foreground">{photo.room}</p>
                        <p className="text-xs text-muted-foreground">{photo.date}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Check-out Photos */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-foreground flex items-center gap-2">
                      <Badge className="bg-[#C27F79] text-white">Check-out</Badge>
                      Fotos de salida
                    </h4>
                    <Button variant="outline" size="sm" className="text-foreground border-border">
                      <Camera className="h-4 w-4 mr-2" />
                      Agregar fotos
                    </Button>
                  </div>
                  {property.checkout.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Photos would go here */}
                    </div>
                  ) : (
                    <div className="p-8 rounded-lg border-2 border-dashed border-border text-center">
                      <Camera className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Sin fotos de check-out aún
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
