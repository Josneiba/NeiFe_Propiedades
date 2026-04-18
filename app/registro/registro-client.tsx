"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, ArrowLeft, Building2, Home, Briefcase, Check, Shield } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type Role = "landlord" | "tenant" | "broker"

export default function RegistroClient() {
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
    company: "",
    password: "",
    confirmPassword: ""
  })

  const allPrivacyAccepted = privacy.terms && privacy.privacyPolicy && privacy.dataConsent

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRole || !allPrivacyAccepted) return

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
      const res = await fetch('/api/auth/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          rut: formData.rut,
          phone: formData.phone,
          company: selectedRole === "broker" ? formData.company : undefined,
          role:
            selectedRole === "landlord"
              ? "LANDLORD"
              : selectedRole === "broker"
                ? "BROKER"
                : "TENANT",
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

      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.ok) {
        toast.success('Sesión iniciada')
        router.push(selectedRole === "tenant" ? "/mi-arriendo" : selectedRole === "broker" ? "/broker" : "/dashboard")
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
      <div className="hidden lg:flex lg:w-1/2 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2D3C3C] to-[#1C1917]">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
          />
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
              <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-3">
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
                  <p className="text-xs text-[#9C8578]">Administra tus pagos y contratos</p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole("broker")}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all duration-300 text-left",
                    selectedRole === "broker"
                      ? "border-[#B8965A] bg-[#B8965A]/20"
                      : "border-[#D5C3B6]/10 hover:border-[#B8965A]/50 bg-[#1C1917]/50"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      selectedRole === "broker" ? "bg-[#B8965A]" : "bg-[#B8965A]/20"
                    )}>
                      <Briefcase className={cn(
                        "h-5 w-5",
                        selectedRole === "broker" ? "text-[#1C1917]" : "text-[#B8965A]"
                      )} />
                    </div>
                    {selectedRole === "broker" && (
                      <div className="w-5 h-5 rounded-full bg-[#B8965A] flex items-center justify-center">
                        <Check className="h-3 w-3 text-[#1C1917]" />
                      </div>
                    )}
                  </div>
                  <p className={cn(
                    "font-semibold",
                    selectedRole === "broker" ? "text-[#D5C3B6]" : "text-[#FAF6F2]"
                  )}>Corredor</p>
                  <p className="text-xs text-[#9C8578]">Administro propiedades de mis clientes</p>
                </button>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre completo</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-background border-input text-foreground"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Correo</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-background border-input text-foreground"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rut">RUT</Label>
                    <Input
                      id="rut"
                      value={formData.rut}
                      onChange={(e) => setFormData(prev => ({ ...prev, rut: e.target.value }))}
                      className="bg-background border-input text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="bg-background border-input text-foreground"
                    />
                  </div>
                </div>

                {selectedRole === "broker" && (
                  <div className="space-y-2">
                    <Label htmlFor="company">Empresa corredora (opcional)</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                      className="bg-background border-input text-foreground"
                    />
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        className="bg-background border-input text-foreground pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute inset-y-0 right-3 flex items-center text-muted-foreground"
                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="bg-background border-input text-foreground"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-[#9C8578]">Privacidad y consentimientos</Label>
                  <div className="space-y-2 text-sm text-[#D5C3B6]">
                    {[
                      { key: "terms", label: "Acepto los Términos y Condiciones" },
                      { key: "privacyPolicy", label: "Acepto la Política de Privacidad" },
                      { key: "dataConsent", label: "Autorizo el uso de mis datos para la prestación del servicio" },
                    ].map((item) => (
                      <label key={item.key} className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          className="h-4 w-4"
                          checked={(privacy as any)[item.key]}
                          onChange={(e) =>
                            setPrivacy((prev) => ({ ...prev, [item.key]: e.target.checked }))
                          }
                          required
                        />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={!selectedRole || !allPrivacyAccepted || isLoading}
                  className="w-full bg-[#5E8B8C] hover:bg-[#5E8B8C]/90 text-white"
                >
                  {isLoading ? "Creando cuenta..." : "Crear cuenta"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
