"use client"

import Link from "next/link"
import { useState, type KeyboardEvent, useEffect } from "react"
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
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [inviteType, setInviteType] = useState<string | null>(null)
  const [privacy, setPrivacy] = useState({
    terms: false,
    privacyPolicy: false,
    dataConsent: false,
  })

  useEffect(() => {
    if (inviteToken && !inviteRole) {
      // Verificar el tipo de invitación
      fetch(`/api/invitations/${inviteToken}`)
        .then(res => res.json())
        .then(data => {
          if (data.invitation) {
            setInviteType(data.invitation.type)
            if (data.invitation.type === 'BROKER_INVITE') {
              setSelectedRole('landlord')
            } else {
              setSelectedRole('tenant')
            }
          }
        })
        .catch(() => {
          // Si hay error, asumir tenant por defecto
          setSelectedRole('tenant')
        })
    } else if (inviteRole === "tenant" || inviteToken) {
      setSelectedRole("tenant")
    }
  }, [inviteToken, inviteRole])
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

  const handleRoleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>, role: Role) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setSelectedRole(role)
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
        <div className="w-full max-w-3xl py-8">
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
              <div className="grid grid-cols-1 gap-6 mb-6 sm:grid-cols-3">
                {[
                  {
                    key: 'landlord',
                    title: 'Arrendador',
                    description: 'Gestiona propiedades',
                    icon: Building2,
                    selectedColor: 'border-[#75524C] bg-[#75524C]/20',
                    defaultColor: 'border-[#D5C3B6]/10 bg-[#1C1917]/50',
                  },
                  {
                    key: 'tenant',
                    title: 'Arrendatario',
                    description: 'Administra tus pagos y contratos',
                    icon: Home,
                    selectedColor: 'border-[#5E8B8C] bg-[#5E8B8C]/20',
                    defaultColor: 'border-[#D5C3B6]/10 bg-[#1C1917]/50',
                  },
                  {
                    key: 'broker',
                    title: 'Corredor',
                    description: 'Administro propiedades de mis clientes',
                    icon: Briefcase,
                    selectedColor: 'border-[#B8965A] bg-[#B8965A]/20',
                    defaultColor: 'border-[#D5C3B6]/10 bg-[#1C1917]/50',
                  },
                ].map((option) => {
                  const Icon = option.icon
                  const isSelected = selectedRole === option.key
                  return (
                    <div
                      key={option.key}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedRole(option.key as Role)}
                      onKeyDown={(event) => handleRoleCardKeyDown(event, option.key as Role)}
                      aria-pressed={isSelected}
                      className={cn(
                        'cursor-pointer flex flex-col items-center justify-between min-h-[180px] rounded-3xl border-2 p-6 text-center transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-[#D5C3B6] shadow-sm',
                        isSelected ? `${option.selectedColor} shadow-[#D5C3B6]/10` : `${option.defaultColor} hover:border-current`
                      )}
                    >
                      <div className="flex flex-col items-center gap-4">
                        <div className={cn(
                          'inline-flex h-12 w-12 items-center justify-center rounded-2xl',
                          isSelected ? 'bg-current text-[#1C1917]' : 'bg-white/10 text-current'
                        )}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-semibold text-[#FAF6F2]">{option.title}</h3>
                        <p className="text-sm leading-6 text-[#D5C3B6]">{option.description}</p>
                      </div>
                      {isSelected && (
                        <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#FAF6F2]">
                          <Check className="h-4 w-4" />
                          Seleccionado
                        </div>
                      )}
                    </div>
                  )
                })}
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
