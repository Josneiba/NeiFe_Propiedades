"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { 
  User, 
  Bell,
  Shield,
  Mail,
  Phone,
  Save
} from "lucide-react"
import { useState } from "react"

export default function ConfiguracionPage() {
  const [profile, setProfile] = useState({
    name: "Carlos Arrendador",
    email: "carlos@arrendador.cl",
    phone: "+56 9 1234 5678",
    rut: "12.345.678-9"
  })

  const [notifications, setNotifications] = useState({
    paymentReceived: true,
    paymentOverdue: true,
    maintenanceRequest: true,
    contractExpiring: true,
    emailNotifications: true
  })

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configuración</h1>
        <p className="text-muted-foreground">Administra tu perfil y preferencias</p>
      </div>

      {/* Profile */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <User className="h-5 w-5 text-[#5E8B8C]" />
            Perfil
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Información de tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-[#5E8B8C] flex items-center justify-center">
              <span className="text-2xl font-bold text-white">CA</span>
            </div>
            <Button variant="outline" className="text-foreground border-border">
              Cambiar foto
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">Nombre completo</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="bg-background border-input text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rut" className="text-foreground">RUT</Label>
              <Input
                id="rut"
                value={profile.rut}
                onChange={(e) => setProfile({ ...profile, rut: e.target.value })}
                className="bg-background border-input text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                <Mail className="h-4 w-4 inline mr-2" />
                Correo electrónico
              </Label>
              <Input
                id="email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="bg-background border-input text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-foreground">
                <Phone className="h-4 w-4 inline mr-2" />
                Teléfono
              </Label>
              <Input
                id="phone"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="bg-background border-input text-foreground"
              />
            </div>
          </div>

          <Button className="bg-[#75524C] hover:bg-[#75524C]/90 text-[#D5C3B6]">
            <Save className="h-4 w-4 mr-2" />
            Guardar cambios
          </Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Bell className="h-5 w-5 text-[#5E8B8C]" />
            Notificaciones
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Configura qué notificaciones deseas recibir
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Notificaciones por email</p>
              <p className="text-sm text-muted-foreground">Recibir notificaciones en tu correo</p>
            </div>
            <Switch
              checked={notifications.emailNotifications}
              onCheckedChange={(checked) => setNotifications({ ...notifications, emailNotifications: checked })}
            />
          </div>

          <div className="space-y-4 pl-4 border-l-2 border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground">Pago recibido</p>
                <p className="text-sm text-muted-foreground">Cuando un arrendatario realiza un pago</p>
              </div>
              <Switch
                checked={notifications.paymentReceived}
                onCheckedChange={(checked) => setNotifications({ ...notifications, paymentReceived: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground">Pago atrasado</p>
                <p className="text-sm text-muted-foreground">Cuando un pago está vencido</p>
              </div>
              <Switch
                checked={notifications.paymentOverdue}
                onCheckedChange={(checked) => setNotifications({ ...notifications, paymentOverdue: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground">Solicitud de mantención</p>
                <p className="text-sm text-muted-foreground">Cuando un arrendatario reporta una falla</p>
              </div>
              <Switch
                checked={notifications.maintenanceRequest}
                onCheckedChange={(checked) => setNotifications({ ...notifications, maintenanceRequest: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground">Contrato por vencer</p>
                <p className="text-sm text-muted-foreground">Cuando un contrato está próximo a vencer</p>
              </div>
              <Switch
                checked={notifications.contractExpiring}
                onCheckedChange={(checked) => setNotifications({ ...notifications, contractExpiring: checked })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#5E8B8C]" />
            Seguridad
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Gestiona la seguridad de tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <p className="font-medium text-foreground">Contraseña</p>
              <p className="text-sm text-muted-foreground">Última actualización: hace 3 meses</p>
            </div>
            <Button variant="outline" className="text-foreground border-border">
              Cambiar contraseña
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div>
              <p className="font-medium text-foreground">Sesiones activas</p>
              <p className="text-sm text-muted-foreground">1 sesión activa en este dispositivo</p>
            </div>
            <Button variant="outline" className="text-[#C27F79] border-[#C27F79] hover:bg-[#C27F79]/10">
              Cerrar otras sesiones
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
