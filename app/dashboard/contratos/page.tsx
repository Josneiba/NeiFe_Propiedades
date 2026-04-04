import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
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
  Image as ImageIcon,
  AlertCircle
} from "lucide-react"
import { ContractProgressChart } from "@/components/charts/contract-progress"

export default async function ContratosPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')
  if (session.user.role !== 'LANDLORD' && session.user.role !== 'OWNER') {
    redirect('/mi-arriendo')
  }

  // Fetch all properties with tenants (contracts) for this landlord
  const contracts = await prisma.property.findMany({
    where: {
      landlordId: session.user.id,
      tenant: { isNot: null },
    },
    include: {
      tenant: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
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
          {contracts.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground mb-4">No tienes contratos activos</p>
                <p className="text-sm text-muted-foreground">Asigna un arrendatario a una propiedad para crear un contrato</p>
              </CardContent>
            </Card>
          ) : (
            contracts.map((property) => (
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
                            <h3 className="font-semibold text-foreground">{property.address}</h3>
                            <p className="text-sm text-muted-foreground">{property.tenant?.name ?? 'Sin asignar'}</p>
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
                          <p className="text-sm text-muted-foreground">Estado</p>
                          <Badge className="bg-[#5E8B8C] text-white">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Activo
                          </Badge>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" className="text-foreground border-border" disabled>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver contrato
                        </Button>
                        <Button variant="outline" className="text-foreground border-border" disabled>
                          <Download className="h-4 w-4 mr-2" />
                          Descargar PDF
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        <AlertCircle className="h-3 w-3 inline mr-1" />
                        Los documentos de contrato estarán disponibles próximamente
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
              <h3 className="font-semibold text-foreground mb-2">Crear nuevo contrato</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Esta funcionalidad estará disponible próximamente
              </p>
              <Button className="bg-[#75524C] hover:bg-[#75524C]/90 text-[#D5C3B6]" disabled>
                Generar contrato
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="photos" className="space-y-6">
          <Card className="bg-card border-border">
            <CardContent className="p-12 text-center">
              <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">El registro fotográfico estará disponible próximamente</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
