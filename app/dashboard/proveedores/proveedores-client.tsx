'use client'

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  Plus,
  Phone,
  Mail,
  Wrench,
  Star,
  Edit2,
  Trash2,
  User,
  Info,
  Loader2
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog'

interface Provider {
  id: string
  name: string
  specialty?: string | null
  phone?: string | null
  email?: string | null
  rating?: number | null
  description?: string | null
  _count: { maintenance: number }
}

interface ProveedoresClientProps {
  providers: Provider[]
}

const specialtyLabels: Record<string, string> = {
  "PLUMBER": "Plomero",
  "ELECTRICIAN": "Electricista",
  "PAINTER": "Pintor",
  "CARPENTER": "Carpintero",
  "LOCKSMITH": "Cerrajero",
  "GENERAL": "Mantenimiento",
  "OTHER": "Otro",
}

const specialtyColors: Record<string, string> = {
  "PLUMBER": "bg-blue-500/20 text-blue-700",
  "ELECTRICIAN": "bg-yellow-500/20 text-yellow-700",
  "PAINTER": "bg-orange-500/20 text-orange-700",
  "CARPENTER": "bg-amber-500/20 text-amber-700",
  "LOCKSMITH": "bg-purple-500/20 text-purple-700",
  "GENERAL": "bg-green-500/20 text-green-700",
  "OTHER": "bg-gray-500/20 text-gray-700",
}

function ProviderCard({ provider }: { provider: Provider }) {
  const router = useRouter()
  const { toast } = useToast()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/providers/${provider.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Error al eliminar')
      }

      toast({
        title: 'Éxito',
        description: 'Proveedor eliminado correctamente',
      })

      router.refresh()
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Error al eliminar el proveedor',
        variant: 'destructive',
      })
      setDeleting(false)
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-[#2D3C3C] flex items-center justify-center flex-shrink-0">
            <User className="h-7 w-7 text-[#D5C3B6]/50" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-foreground truncate">{provider.name}</h3>
                {provider.specialty && (
                  <Badge className={specialtyColors[provider.specialty] || "bg-muted text-muted-foreground"}>
                    {specialtyLabels[provider.specialty] || provider.specialty}
                  </Badge>
                )}
              </div>
              {provider.rating && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-[#F2C94C] fill-[#F2C94C]" />
                  <span className="text-sm font-medium text-foreground">{provider.rating}</span>
                </div>
              )}
            </div>
            
            {provider.description && (
              <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                {provider.description}
              </p>
            )}

            <div className="flex flex-wrap gap-4 mt-4 text-sm">
              {provider.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {provider.phone}
                </div>
              )}
              {provider.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  {provider.email}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Wrench className="h-4 w-4" />
                {provider._count.maintenance} trabajos
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-muted-foreground hover:text-foreground"
                  asChild
                >
                  <Link href={`/dashboard/proveedores/${provider.id}`}>
                    <Edit2 className="h-4 w-4" />
                  </Link>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-[#C27F79]"
                      disabled={deleting}
                    >
                      {deleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar proveedor?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción eliminará permanentemente a {provider.name} del sistema. Esta acción no se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ProveedoresClient({ providers }: ProveedoresClientProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Proveedores de Confianza</h1>
          <p className="text-muted-foreground">Administra tu red de proveedores verificados</p>
        </div>
        <Button
          className="bg-[#75524C] hover:bg-[#75524C]/90 text-[#D5C3B6]"
          asChild
        >
          <Link href="/dashboard/proveedores/agregar">
            <Plus className="h-4 w-4 mr-2" />
            Agregar proveedor
          </Link>
        </Button>
      </div>

      <Card className="bg-[#5E8B8C]/10 border-[#5E8B8C]/25">
        <CardContent className="p-4 flex gap-3 text-sm text-foreground">
          <Info className="h-5 w-5 shrink-0 text-[#5E8B8C] mt-0.5" />
          <p>
            Aquí guardas tu <strong>directorio</strong> de proveedores. Quién atiende cada arriendo se define en el
            detalle de la propiedad (pestaña Proveedores): así evitas que un arrendatario en una ciudad
            contacte por error a un técnico de otra región.
          </p>
        </CardContent>
      </Card>

      {/* Providers Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {providers.length === 0 ? (
          <Card className="bg-card border-border md:col-span-2">
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">No tienes proveedores registrados aún</p>
            </CardContent>
          </Card>
        ) : (
          providers.map((provider) => (
            <ProviderCard key={provider.id} provider={provider} />
          ))
        )}
      </div>
    </div>
  )
}
