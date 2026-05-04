"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  User, 
  Shield,
  Mail,
  Phone,
  Save,
  LogOut,
  Eye,
  EyeOff,
  Loader2
} from "lucide-react"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  DOCUMENT_COUNTRIES,
  getDefaultDocumentType,
  getDocumentLabel,
  getDocumentTypeOptions,
  type DocumentCountryCode,
  type DocumentTypeCode,
  validateDocument,
} from "@/lib/identity-documents"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface UserProfile {
  name: string | null
  email: string | null
  phone: string | null
  rut: string | null
  documentCountry: DocumentCountryCode | null
  documentType: DocumentTypeCode | null
  documentNumber: string | null
  company: string | null
  bankName: string | null
  bankAccountType: string | null
  bankAccountNumber: string | null
  bankEmail: string | null
}

export default function BrokerConfiguracionPage() {
  const { toast } = useToast()
  
  // Profile section
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileSaving, setProfileSaving] = useState(false)
  const [documentError, setDocumentError] = useState<string | null>(null)
  
  // Bank data section
  const [bankData, setBankData] = useState<Partial<UserProfile> | null>(null)
  const [bankSaving, setBankSaving] = useState(false)
  
  // Password section
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  
  // Sessions section
  const [sessionLoading, setSessionLoading] = useState(false)

  const applyUserData = (user: UserProfile) => {
    setProfile(user)
    setBankData(user)
  }

  // Load profile on mount
  useEffect(() => {
    const controller = new AbortController()

    const loadProfile = async () => {
      try {
        const res = await fetch("/api/users/me", {
          signal: controller.signal,
        })
        if (!res.ok) throw new Error("Failed to load profile")
        const data = await res.json()
        const user = data.user ?? data
        applyUserData(user)
      } catch (error) {
        if (!(error instanceof Error && error.name === "AbortError")) {
          toast({
            title: "Error",
            description: "No se pudo cargar el perfil",
            variant: "destructive"
          })
        }
      } finally {
        setProfileLoading(false)
      }
    }

    loadProfile()

    return () => {
      controller.abort()
    }
  }, [toast])

  // Handle profile save
  const handleProfileSave = async () => {
    if (!profile) return

    const documentCountry = profile.documentCountry ?? "CL"
    const documentType = profile.documentType ?? getDefaultDocumentType(documentCountry)
    const documentNumber = profile.documentNumber ?? profile.rut ?? ""

    const documentResult = validateDocument({
      country: documentCountry,
      type: documentType,
      value: documentNumber,
    })

    if (!documentResult.isValid) {
      setDocumentError(documentResult.message)
      toast({
        title: "Error",
        description: documentResult.message || "Documento invalido",
        variant: "destructive"
      })
      return
    }
    
    try {
      setProfileSaving(true)
      setDocumentError(null)
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          phone: profile.phone,
          documentCountry,
          documentType,
          documentNumber,
          company: profile.company
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to update profile")
      }

      const data = await res.json()
      applyUserData(data.user ?? data)
      
      toast({
        title: "Éxito",
        description: "Perfil actualizado correctamente"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo actualizar el perfil",
        variant: "destructive"
      })
    } finally {
      setProfileSaving(false)
    }
  }

  const profileCountry = profile?.documentCountry ?? "CL"
  const profileType = profile?.documentType ?? getDefaultDocumentType(profileCountry)
  const profileTypeOptions = getDocumentTypeOptions(profileCountry)
  const profileDocumentLabel = getDocumentLabel(profileType)

  // Handle bank data save
  const handleBankDataSave = async () => {
    if (!bankData) return
    
    try {
      setBankSaving(true)
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankName: bankData.bankName,
          bankAccountType: bankData.bankAccountType,
          bankAccountNumber: bankData.bankAccountNumber,
          bankEmail: bankData.bankEmail
        })
      })

      if (!res.ok) throw new Error("Failed to update bank data")

      const data = await res.json()
      applyUserData(data.user ?? data)
      
      toast({
        title: "Éxito",
        description: "Datos bancarios actualizados correctamente"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar los datos bancarios",
        variant: "destructive"
      })
    } finally {
      setBankSaving(false)
    }
  }

  // Handle password change
  const handlePasswordChange = async () => {
    try {
      setPasswordLoading(true)
      
      // Validation
      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        throw new Error("Todos los campos son requeridos")
      }
      
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        throw new Error("Las contraseñas no coinciden")
      }
      
      if (passwordData.newPassword.length < 8) {
        throw new Error("La nueva contraseña debe tener al menos 8 caracteres")
      }
      
      const res = await fetch("/api/users/me/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Failed to change password")
      }
      
      toast({
        title: "Éxito",
        description: "Contraseña cambiada correctamente"
      })
      
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
      setPasswordOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo cambiar la contraseña",
        variant: "destructive"
      })
    } finally {
      setPasswordLoading(false)
    }
  }

  // Handle logout other sessions
  const handleLogoutOtherSessions = async () => {
    try {
      setSessionLoading(true)
      const res = await fetch("/api/users/me/sessions", {
        method: "DELETE"
      })

      if (!res.ok) throw new Error("Failed to logout other sessions")
      
      toast({
        title: "Éxito",
        description: "Otras sesiones cerradas correctamente"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cerrar otras sesiones",
        variant: "destructive"
      })
    } finally {
      setSessionLoading(false)
    }
  }

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#1C1917]">
        <Loader2 className="h-8 w-8 animate-spin text-[#5E8B8C]" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-[#FAF6F2]">Configuración</h1>
        <p className="text-sm text-[#9C8578] mt-0.5">Administra tu perfil, empresa y datos bancarios</p>
      </div>

      <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
        <CardHeader>
          <CardTitle className="text-[#FAF6F2] flex items-center gap-2">
            <User className="h-5 w-5 text-[#5E8B8C]" />
            Perfil de Corredor
          </CardTitle>
          <CardDescription className="text-[#9C8578]">
            Información de tu cuenta como corredor de propiedades
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                value={profile?.name || ""}
                onChange={(e) => setProfile(prev => prev ? { ...prev, name: e.target.value } : null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="documentCountry">Pais</Label>
              <Select
                value={profileCountry}
                onValueChange={(value) =>
                  setProfile(prev =>
                    prev
                      ? {
                          ...prev,
                          documentCountry: value as DocumentCountryCode,
                          documentType: getDefaultDocumentType(value as DocumentCountryCode),
                          documentNumber: "",
                          rut: null,
                        }
                      : null
                  )
                }
              >
                <SelectTrigger className="w-full bg-[#1C1917] border-[#D5C3B6]/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#2D3C3C] border-[#D5C3B6]/10">
                  {DOCUMENT_COUNTRIES.map((country) => (
                    <SelectItem key={country.value} value={country.value}>
                      {country.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="documentType">Tipo</Label>
              <Select
                value={profileType}
                onValueChange={(value) =>
                  setProfile(prev =>
                    prev
                      ? {
                          ...prev,
                          documentType: value as DocumentTypeCode,
                          documentNumber: "",
                          rut: null,
                        }
                      : null
                  )
                }
              >
                <SelectTrigger className="w-full bg-[#1C1917] border-[#D5C3B6]/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#2D3C3C] border-[#D5C3B6]/10">
                  {profileTypeOptions.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="documentNumber">{profileDocumentLabel}</Label>
              <Input
                id="documentNumber"
                value={profile?.documentNumber || profile?.rut || ""}
                onChange={(e) => {
                  setDocumentError(null)
                  setProfile(prev =>
                    prev
                      ? {
                          ...prev,
                          documentCountry: profileCountry,
                          documentType: profileType,
                          documentNumber: e.target.value.toUpperCase(),
                        }
                      : null
                  )
                }}
              />
              {documentError && <p className="text-xs text-[#C27F79]">{documentError}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">
                <Mail className="h-4 w-4 inline mr-2" />
                Correo electrónico
              </Label>
              <Input
                id="email"
                type="email"
                value={profile?.email || ""}
                disabled
                className="bg-[#1C1917] border-[#D5C3B6]/20 text-[#9C8578]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">
                <Phone className="h-4 w-4 inline mr-2" />
                Teléfono
              </Label>
              <Input
                id="phone"
                value={profile?.phone || ""}
                onChange={(e) => setProfile(prev => prev ? { ...prev, phone: e.target.value } : null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Empresa corredora</Label>
              <Input
                id="company"
                value={profile?.company || ""}
                onChange={(e) => setProfile(prev => prev ? { ...prev, company: e.target.value } : null)}
                placeholder="Nombre de tu empresa corredora"
              />
            </div>
          </div>

          <Button 
            onClick={handleProfileSave}
            disabled={profileSaving}
            className="bg-[#75524C] hover:bg-[#75524C]/90 text-[#FAF6F2]"
          >
            {profileSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Save className="h-4 w-4 mr-2" />
            Guardar cambios
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
        <CardHeader>
          <CardTitle className="text-[#FAF6F2] flex items-center gap-2">
            <Mail className="h-5 w-5 text-[#5E8B8C]" />
            Datos Bancarios
          </CardTitle>
          <CardDescription className="text-[#9C8578]">
            Información para recibir pagos de arrendatarios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">Banco</Label>
              <Input
                id="bankName"
                value={bankData?.bankName || ""}
                onChange={(e) => setBankData(prev => prev ? { ...prev, bankName: e.target.value } : null)}
                placeholder="Ej: Banco Santander"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankAccountType">Tipo de Cuenta</Label>
              <Input
                id="bankAccountType"
                value={bankData?.bankAccountType || ""}
                onChange={(e) => setBankData(prev => prev ? { ...prev, bankAccountType: e.target.value } : null)}
                placeholder="Ej: Cuenta Corriente / Cuenta de Ahorro"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankAccountNumber">Número de Cuenta</Label>
              <Input
                id="bankAccountNumber"
                value={bankData?.bankAccountNumber || ""}
                onChange={(e) => setBankData(prev => prev ? { ...prev, bankAccountNumber: e.target.value } : null)}
                placeholder="Ej: 1234567890"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankEmail">Email para confirmación</Label>
              <Input
                id="bankEmail"
                type="email"
                value={bankData?.bankEmail || ""}
                onChange={(e) => setBankData(prev => prev ? { ...prev, bankEmail: e.target.value } : null)}
                placeholder="Ej: finanzas@tuempresa.cl"
              />
            </div>
          </div>

          <Button 
            onClick={handleBankDataSave}
            disabled={bankSaving}
            className="bg-[#75524C] hover:bg-[#75524C]/90 text-[#FAF6F2]"
          >
            {bankSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Save className="h-4 w-4 mr-2" />
            Guardar datos bancarios
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
        <CardHeader>
          <CardTitle className="text-[#FAF6F2] flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#5E8B8C]" />
            Seguridad
          </CardTitle>
          <CardDescription className="text-[#9C8578]">
            Gestiona la seguridad de tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
            <DialogTrigger asChild>
              <div className="flex items-center justify-between p-4 rounded-lg bg-[#1C1917] cursor-pointer hover:bg-[#1C1917]/90 transition">
                <div>
                  <p className="font-medium text-[#FAF6F2]">Contraseña</p>
                  <p className="text-sm text-[#9C8578]">Cambia tu contraseña regularmente para mayor seguridad</p>
                </div>
                <Button variant="outline" className="text-[#FAF6F2] border-[#D5C3B6]/20">
                  Cambiar
                </Button>
              </div>
            </DialogTrigger>
            <DialogContent className="bg-[#2D3C3C] border-[#D5C3B6]/15">
              <DialogHeader>
                <DialogTitle className="text-[#FAF6F2] font-serif">Cambiar contraseña</DialogTitle>
                <DialogDescription className="text-[#9C8578]">
                  Ingresa tu contraseña actual y la nueva que deseas usar
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Contraseña actual</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPasswords.current ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9C8578] hover:text-[#FAF6F2]"
                    >
                      {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nueva contraseña</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9C8578] hover:text-[#FAF6F2]"
                    >
                      {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9C8578] hover:text-[#FAF6F2]"
                    >
                      {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button 
                  onClick={handlePasswordChange}
                  disabled={passwordLoading}
                  className="w-full bg-[#75524C] hover:bg-[#75524C]/90 text-[#FAF6F2]"
                >
                  {passwordLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Cambiar contraseña
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="flex items-center justify-between p-4 rounded-lg bg-[#1C1917]">
            <div>
              <p className="font-medium text-[#FAF6F2]">Sesiones activas</p>
              <p className="text-sm text-[#9C8578]">Cierra sesiones en otros dispositivos</p>
            </div>
            <Button 
              onClick={handleLogoutOtherSessions}
              disabled={sessionLoading}
              className="bg-[#75524C] hover:bg-[#75524C]/90 text-[#FAF6F2]"
            >
              {sessionLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar otras sesiones
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
