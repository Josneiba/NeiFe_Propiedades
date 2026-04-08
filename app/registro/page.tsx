"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, ArrowLeft, Building2, Home, Check, Shield } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type Role = "landlord" | "tenant"

export default function RegistroPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const inviteRole = searchParams.get("role")
  const inviteToken = searchParams.get("invite")
  const [selectedRole, setSelectedRole] = useState<Role | null>(
    inviteRole === "tenant" || inviteToken ? "tenant" : null
  )
  const [privacy, setPrivacy] = useState({
    terms: false,
    privacyPolicy: false,
    dataConsent: false,
  })
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    rut: "",
    phone: "",
    password: "",
    confirmPassword: ""
  })

  const allPrivacyAccepted = privacy.terms && privacy.privacyPolicy && privacy.dataConsent

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRole || !allPrivacyAccepted) return

    // Validar contraseñas coincidan
    if (formData.password !== formData.confirmPassword) {
      toast.error("Las contraseñas no coinciden")
      return
    }

    if (formData.password.length < 8) {
      toast.error("La contraseña debe tener mínimo 8 caracteres")
      return
    }

    setIsLoading(true)
    
    try {
      // Crear cuenta
      const res = await fetch('/api/auth/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          rut: formData.rut,
          phone: formData.phone,
          role: selectedRole === 'landlord' ? 'LANDLORD' : 'TENANT',
          privacyAccepted: true,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Error al crear cuenta')
        setIsLoading(false)
        return
      }

      toast.success('Cuenta creada correctamente')

      // Auto-login después del registro
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.ok) {
        toast.success('Sesión iniciada')
        if (selectedRole === "landlord") {
          router.push("/dashboard")
        } else {
          router.push("/mi-arriendo")
        }
      } else {
        toast.error("Error al iniciar sesión")
        router.push("/login")
      }
    } catch (error) {
      console.error('Registration error:', error)
      toast.error('Error al registrarse')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#1C1917] flex">
      {/* Left side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2D3C3C] to-[#1C1917]">
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }} />
        </div>
        <div className="relative z-10 flex flex-col justify-center items-center p-12 text-center">
          <h2 className="text-4xl font-serif font-semibold text-[#FAF6F2] mb-4">
            Únete a NeiFe
          </h2>
          <p className="text-[#9C8578] text-lg max-w-md mb-8">
            Digitaliza la gestión de tus arriendos con la plataforma más completa de Chile
          </p>
          <div className="space-y-4 text-left max-w-sm">
            {[
              "Contratos digitales con firma electrónica",
              "Pagos y servicios en un solo lugar",
              "Cumplimiento con Ley 18.101 y 21.461"
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#5E8B8C]/20 flex items-center justify-center">
                  <Check className="h-3 w-3 text-[#5E8B8C]" />
                </div>
                <span className="text-[#D5C3B6] text-sm">{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-12 flex items-center gap-6">
            <div className="h-px w-16 bg-[#B8965A]/40" />
            <Shield className="h-4 w-4 text-[#B8965A]" />
            <div className="h-px w-16 bg-[#B8965A]/40" />
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm text-[#9C8578] hover:text-[#D5C3B6] mb-8 transition-colors duration-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>

          <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
            <CardHeader className="text-center pb-2">
              <div className="flex items-center justify-center gap-2 mb-4 lg:hidden">
                <div className="w-12 h-12 rounded-lg bg-[#75524C] flex items-center justify-center shadow-lg">
                  <span className="text-lg font-semibold text-[#D5C3B6]">Ne</span>
                </div>
              </div>
              <CardTitle className="text-2xl font-serif text-[#FAF6F2]">Crear cuenta</CardTitle>
              <CardDescription className="text-[#9C8578]">
                Selecciona tu rol y completa tus datos
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Role Selection */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => setSelectedRole("landlord")}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all duration-300 text-left",
                    selectedRole === "landlord"
                      ? "border-[#75524C] bg-[#75524C]/20"
                      : "border-[#D5C3B6]/10 hover:border-[#75524C]/50 bg-[#1C1917]/50"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      selectedRole === "landlord" ? "bg-[#75524C]" : "bg-[#75524C]/20"
                    )}>
                      <Building2 className={cn(
                        "h-5 w-5",
                        selectedRole === "landlord" ? "text-[#FAF6F2]" : "text-[#75524C]"
                      )} />
                    </div>
                    {selectedRole === "landlord" && (
                      <div className="w-5 h-5 rounded-full bg-[#75524C] flex items-center justify-center">
                        <Check className="h-3 w-3 text-[#FAF6F2]" />
                      </div>
                    )}
                  </div>
                  <p className={cn(
                    "font-semibold",
                    selectedRole === "landlord" ? "text-[#D5C3B6]" : "text-[#FAF6F2]"
                  )}>Arrendador</p>
                  <p className="text-xs text-[#9C8578]">Gestiona propiedades</p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole("tenant")}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all duration-300 text-left",
                    selectedRole === "tenant"
                      ? "border-[#5E8B8C] bg-[#5E8B8C]/20"
                      : "border-[#D5C3B6]/10 hover:border-[#5E8B8C]/50 bg-[#1C1917]/50"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      selectedRole === "tenant" ? "bg-[#5E8B8C]" : "bg-[#5E8B8C]/20"
                    )}>
                      <Home className={cn(
                        "h-5 w-5",
                        selectedRole === "tenant" ? "text-[#FAF6F2]" : "text-[#5E8B8C]"
                      )} />
                    </div>
                    {selectedRole === "tenant" && (
                      <div className="w-5 h-5 rounded-full bg-[#5E8B8C] flex items-center justify-center">
                        <Check className="h-3 w-3 text-[#FAF6F2]" />
                      </div>
                    )}
                  </div>
                  <p className={cn(
                    "font-semibold",
                    selectedRole === "tenant" ? "text-[#D5C3B6]" : "text-[#FAF6F2]"
                  )}>Arrendatario</p>
                  <p className="text-xs text-[#9C8578]">Arrienda propiedad</p>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-[#D5C3B6] text-sm">Nombre completo</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Juan Pérez"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="bg-[#1C1917] border-[#D5C3B6]/20 text-[#FAF6F2] placeholder:text-[#9C8578]/50 focus:border-[#5E8B8C] h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rut" className="text-[#D5C3B6] text-sm">RUT</Label>
                    <Input
                      id="rut"
                      type="text"
                      placeholder="12.345.678-9"
                      value={formData.rut}
                      onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                      required
                      className="bg-[#1C1917] border-[#D5C3B6]/20 text-[#FAF6F2] placeholder:text-[#9C8578]/50 focus:border-[#5E8B8C] h-11 font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[#D5C3B6] text-sm">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@correo.cl"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="bg-[#1C1917] border-[#D5C3B6]/20 text-[#FAF6F2] placeholder:text-[#9C8578]/50 focus:border-[#5E8B8C] h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-[#D5C3B6] text-sm">Teléfono</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+56 9 1234 5678"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    className="bg-[#1C1917] border-[#D5C3B6]/20 text-[#FAF6F2] placeholder:text-[#9C8578]/50 focus:border-[#5E8B8C] h-11 font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[#D5C3B6] text-sm">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 8 caracteres"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      minLength={8}
                      className="bg-[#1C1917] border-[#D5C3B6]/20 text-[#FAF6F2] placeholder:text-[#9C8578]/50 focus:border-[#5E8B8C] h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9C8578] hover:text-[#D5C3B6] transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-[#D5C3B6] text-sm">Confirmar contraseña</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Repite tu contraseña"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    className="bg-[#1C1917] border-[#D5C3B6]/20 text-[#FAF6F2] placeholder:text-[#9C8578]/50 focus:border-[#5E8B8C] h-11"
                  />
                </div>
                {/* Privacy & Legal Checkboxes — obligatorios por Ley 19.628 */}
                <div className="space-y-3 pt-2 border-t border-[#D5C3B6]/10">
                  <p className="text-xs text-[#9C8578] uppercase tracking-wider">Aceptación obligatoria</p>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={privacy.terms}
                      onChange={(e) => setPrivacy({ ...privacy, terms: e.target.checked })}
                      className="mt-0.5 w-4 h-4 rounded accent-[#5E8B8C] shrink-0"
                    />
                    <span className="text-sm text-[#9C8578] group-hover:text-[#D5C3B6] transition-colors">
                      Acepto los{" "}
                      <a href="/terminos" target="_blank" className="text-[#5E8B8C] underline underline-offset-2">
                        Términos de Servicio
                      </a>
                      {" "}de NeiFe
                    </span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={privacy.privacyPolicy}
                      onChange={(e) => setPrivacy({ ...privacy, privacyPolicy: e.target.checked })}
                      className="mt-0.5 w-4 h-4 rounded accent-[#5E8B8C] shrink-0"
                    />
                    <span className="text-sm text-[#9C8578] group-hover:text-[#D5C3B6] transition-colors">
                      Acepto la{" "}
                      <a href="/privacidad" target="_blank" className="text-[#5E8B8C] underline underline-offset-2">
                        Política de Privacidad
                      </a>
                    </span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={privacy.dataConsent}
                      onChange={(e) => setPrivacy({ ...privacy, dataConsent: e.target.checked })}
                      className="mt-0.5 w-4 h-4 rounded accent-[#5E8B8C] shrink-0"
                    />
                    <span className="text-sm text-[#9C8578] group-hover:text-[#D5C3B6] transition-colors">
                      Autorizo el tratamiento de mis datos personales según{" "}
                      <span className="text-[#B8965A]">Ley 19.628</span>
                    </span>
                  </label>
                </div>
                <Button 
                  type="submit" 
                  className={cn(
                    "w-full text-[#FAF6F2] h-12 text-base shadow-lg transition-all duration-300",
                    selectedRole === "landlord" && allPrivacyAccepted
                      ? "bg-[#75524C] hover:bg-[#75524C]/90 shadow-[#75524C]/20" 
                      : selectedRole === "tenant" && allPrivacyAccepted
                      ? "bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 shadow-[#5E8B8C]/20"
                      : "bg-[#9C8578]/50 cursor-not-allowed"
                  )}
                  disabled={isLoading || !selectedRole || !allPrivacyAccepted}
                >
                  {isLoading ? "Creando cuenta..." : "Crear cuenta"}
                </Button>
              </form>
              
              <div className="mt-6 text-center text-sm">
                <span className="text-[#9C8578]">¿Ya tienes cuenta? </span>
                <Link href="/login" className="text-[#5E8B8C] hover:text-[#5E8B8C]/80 font-medium transition-colors">
                  Inicia sesión
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
