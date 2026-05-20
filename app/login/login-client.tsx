"use client"

import Link from "next/link"
import { useEffect, useState, type KeyboardEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getSession, signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Eye, EyeOff, ArrowLeft, Building2, Home, Briefcase, Check, Shield, FileText, Sparkles, CreditCard, KeyRound, Mail, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function LoginClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDemoRole, setSelectedDemoRole] = useState<'landlord' | 'tenant' | 'broker'>('landlord')
  const [requiresVerification, setRequiresVerification] = useState(false)
  const [isResendingVerification, setIsResendingVerification] = useState(false)
  const [showPasswordResetDialog, setShowPasswordResetDialog] = useState(false)
  const [resetStep, setResetStep] = useState<"request" | "confirm">("request")
  const [resetLoading, setResetLoading] = useState(false)
  const [resetForm, setResetForm] = useState({
    email: "",
    code: "",
    password: "",
    confirmPassword: "",
  })
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  })

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      toast.success(
        searchParams.get("verified") === "true"
          ? "Cuenta verificada. Ya puedes iniciar sesion."
          : "Cuenta creada correctamente."
      )
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.email || !formData.password) {
      toast.error("Por favor completa todos los campos")
      return
    }

    setIsLoading(true)
    setRequiresVerification(false)

    let result
    try {
      result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })
    } catch (error) {
      console.error("Sign in failed:", error)
      toast.error("No fue posible iniciar sesión en este momento")
      setIsLoading(false)
      return
    }

    if (result?.error) {
      try {
        const verificationRes = await fetch("/api/auth/verification-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email }),
        })

        if (verificationRes.ok) {
          const verification = await verificationRes.json()
          if (verification.requiresVerification) {
            setRequiresVerification(true)
            toast.error("Debes verificar tu email antes de iniciar sesión")
            setIsLoading(false)
            return
          }
        }
      } catch (verificationError) {
        console.error("Verification status lookup failed:", verificationError)
      }

      toast.error("Email o contraseña incorrectos")
      setIsLoading(false)
      return
    }

    if (result?.ok) {
      toast.success("Sesión iniciada correctamente")
      const session = await getSession()

      const role = session?.user?.role || 'TENANT'
      if (role === 'TENANT') {
        router.push("/mi-arriendo")
      } else if (role === 'BROKER') {
        router.push("/broker")
      } else if (role === 'LANDLORD') {
        router.push("/dashboard")
      } else {
        router.push("/dashboard")
      }

      router.refresh()
    }
  }

  const handleResendVerification = async () => {
    if (!formData.email) {
      toast.error("Ingresa tu correo para reenviar el codigo")
      return
    }

    setIsResendingVerification(true)

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "No se pudo reenviar el codigo")
        return
      }

      toast.success(data.message || "Te enviamos un nuevo codigo")
    } catch (error) {
      console.error("Resend verification failed:", error)
      toast.error("No se pudo reenviar el codigo")
    } finally {
      setIsResendingVerification(false)
    }
  }

  const handleDemoLogin = async () => {
    const role = selectedDemoRole
    const email =
      role === "landlord"
        ? "owner@neife.cl"
        : role === "tenant"
          ? "tenant1@neife.cl"
          : "corredor@neife.cl"
    const password = "demo1234"

    setIsLoading(true)

    let result
    try {
      result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })
    } catch (error) {
      console.error("Demo sign in failed:", error)
      toast.error("No fue posible cargar el demo en este momento")
      setIsLoading(false)
      return
    }

    if (result?.error) {
      toast.error("Error al iniciar sesión demo")
      setIsLoading(false)
      return
    }

    if (result?.ok) {
      toast.success("Demo cargado correctamente")
      if (role === "landlord") {
        router.push("/dashboard")
      } else if (role === "broker") {
        router.push("/broker")
      } else {
        router.push("/mi-arriendo")
      }
    }
  }

  const handleRoleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>, role: 'landlord' | 'tenant' | 'broker') => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setSelectedDemoRole(role)
    }
  }

  const handlePasswordResetRequest = async () => {
    if (!resetForm.email) {
      toast.error("Ingresa tu correo para recuperar acceso")
      return
    }

    setResetLoading(true)
    try {
      const res = await fetch("/api/auth/password-reset-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetForm.email }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "No se pudo enviar el código")
        return
      }

      toast.success("Si la cuenta existe, te enviamos un código al correo.")
      setResetStep("confirm")
    } catch (error) {
      console.error("Password reset request failed:", error)
      toast.error("No se pudo iniciar la recuperación")
    } finally {
      setResetLoading(false)
    }
  }

  const handlePasswordResetConfirm = async () => {
    if (!resetForm.code || !resetForm.password || !resetForm.confirmPassword) {
      toast.error("Completa el código y la nueva contraseña")
      return
    }

    if (resetForm.password !== resetForm.confirmPassword) {
      toast.error("Las contraseñas no coinciden")
      return
    }

    if (resetForm.password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres")
      return
    }

    setResetLoading(true)
    try {
      const res = await fetch("/api/auth/password-reset-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: resetForm.email,
          token: resetForm.code,
          password: resetForm.password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "No se pudo actualizar la contraseña")
        return
      }

      toast.success("Contraseña actualizada correctamente")
      setFormData((prev) => ({ ...prev, email: resetForm.email }))
      setResetForm({
        email: "",
        code: "",
        password: "",
        confirmPassword: "",
      })
      setResetStep("request")
      setShowPasswordResetDialog(false)
    } catch (error) {
      console.error("Password reset confirm failed:", error)
      toast.error("No se pudo actualizar la contraseña")
    } finally {
      setResetLoading(false)
    }
  }

  const roleOptions = [
    {
      key: 'landlord' as const,
      label: 'Arrendador',
      short: 'Panel de gestión de propiedades',
      accent: 'border-[#75524C]',
      ring: 'focus-visible:ring-[#75524C]',
    },
    {
      key: 'tenant' as const,
      label: 'Arrendatario',
      short: 'Administra tu pago y contrato',
      accent: 'border-[#5E8B8C]',
      ring: 'focus-visible:ring-[#5E8B8C]',
    },
    {
      key: 'broker' as const,
      label: 'Corredor',
      short: 'Gestiona propiedades de tus clientes',
      accent: 'border-[#B8965A]',
      ring: 'focus-visible:ring-[#B8965A]',
    },
  ]

  return (
    <div className="min-h-screen bg-[#1C1917] flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2D3C3C] to-[#1C1917]" />
        <svg
          className="absolute inset-0 h-full w-full text-[#D5C3B6]/[0.06]"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <defs>
            <pattern id="login-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#login-grid)" />
        </svg>
        <div className="relative z-10 flex flex-col justify-between p-12 text-left w-full max-w-lg mx-auto">
          <div>
            <p className="text-4xl md:text-5xl font-serif font-semibold text-[#FAF6F2] tracking-tight">
              NeiFe<span className="text-[#B8965A]">.</span>
            </p>
            <ul className="mt-10 space-y-5">
              {[
                { icon: Shield, text: "Contratos y datos alineados a la legislación chilena." },
                { icon: FileText, text: "Documentación y pagos organizados en un solo lugar." },
                { icon: CreditCard, text: "Seguimiento de arriendos sin hojas de cálculo dispersas." },
                { icon: Building2, text: "Paneles claros para cada rol del ecosistema." },
              ].map((item, i) => (
                <li key={i} className="flex gap-3 text-[#D5C3B6] text-sm leading-relaxed">
                  <item.icon className="h-4 w-4 text-[#B8965A] shrink-0 mt-0.5" strokeWidth={2} />
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-sm italic text-[#9C8578] border-t border-[#D5C3B6]/10 pt-8">
            La gestión de arriendos que no te complica la vida.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-start lg:items-center justify-center p-5 sm:p-8 lg:p-12 py-8 lg:py-12">
        <div className="w-full max-w-3xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[#9C8578] hover:text-[#D5C3B6] mb-5 transition-colors duration-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>

          <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10 shadow-2xl shadow-black/20">
            <CardHeader className="text-center pb-2 pt-6 px-6">
              <div className="flex items-center justify-center gap-2 mb-3 lg:hidden">
                <div className="rounded-lg bg-[#75524C]/90 px-3 py-2 shadow-md">
                  <span className="text-lg font-serif font-semibold text-[#FAF6F2]">NeiFe<span className="text-[#B8965A]">.</span></span>
                </div>
              </div>
              <CardTitle className="text-2xl font-serif text-[#FAF6F2]">Iniciar Sesión</CardTitle>
              <CardDescription className="text-[#9C8578]">
                Selecciona tu rol y accede con demo o con tu cuenta
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                {roleOptions.map((roleOption) => {
                  const Icon =
                    roleOption.key === "landlord"
                      ? Building2
                      : roleOption.key === "tenant"
                        ? Home
                        : Briefcase
                  const isSelected = selectedDemoRole === roleOption.key
                  return (
                    <div
                      key={roleOption.key}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedDemoRole(roleOption.key)}
                      onKeyDown={(event) => handleRoleCardKeyDown(event, roleOption.key)}
                      aria-pressed={isSelected}
                      className={cn(
                        "relative cursor-pointer rounded-xl border-2 bg-[#1C1917]/40 p-4 text-left transition-all duration-300 outline-none min-h-[120px] flex flex-col justify-between",
                        roleOption.ring,
                        isSelected ? cn(roleOption.accent, "shadow-md") : "border-[#D5C3B6]/15 hover:border-[#D5C3B6]/25"
                      )}
                    >
                      {isSelected ? (
                        <span className="absolute top-2.5 right-2.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#FAF6F2]/10 text-[#FAF6F2]">
                          <Check className="h-3 w-3" />
                        </span>
                      ) : null}
                      <div className="flex items-start gap-2.5 pr-6">
                        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-[#D5C3B6]">
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <span className="block text-sm font-semibold text-[#FAF6F2]">{roleOption.label}</span>
                          <p className="mt-1 text-xs leading-snug text-[#9C8578]">{roleOption.short}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="grid grid-cols-1 gap-3 mb-5 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  disabled={isLoading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#5E8B8C] px-4 py-2.5 text-sm font-semibold text-[#FAF6F2] shadow-lg shadow-[#5E8B8C]/20 transition-colors duration-300 hover:bg-[#5E8B8C]/90 disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4 shrink-0" />
                  {isLoading ? 'Cargando demo...' : `Iniciar demo ${selectedDemoRole === 'landlord' ? 'arrendador' : selectedDemoRole === 'tenant' ? 'arrendatario' : 'corredor'}`}
                </button>
                <div className="flex items-center justify-center text-[11px] text-[#9C8578] px-2 text-center sm:text-left">
                  Usa el selector de arriba para ver un demo rápido de cada rol.
                </div>
              </div>

              <div className="relative mb-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#D5C3B6]/10" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-[#2D3C3C] px-2 text-[#9C8578]">o ingresa con tu cuenta</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
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
                  <Label htmlFor="password" className="text-[#D5C3B6] text-sm">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Tu contraseña"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
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
                <Button
                  type="submit"
                  className="w-full bg-[#75524C] hover:bg-[#75524C]/90 text-[#FAF6F2] h-11 text-base shadow-lg shadow-[#75524C]/20 transition-all duration-300"
                  disabled={isLoading}
                >
                  {isLoading ? "Ingresando..." : "Entrar"}
                </Button>
              </form>

              <div className="mt-3 flex justify-end">
                <Dialog open={showPasswordResetDialog} onOpenChange={setShowPasswordResetDialog}>
                  <DialogTrigger asChild>
                    <button
                      type="button"
                      className="text-sm font-medium text-[#5E8B8C] hover:text-[#FAF6F2] transition-colors"
                      onClick={() => {
                        setResetForm((prev) => ({
                          ...prev,
                          email: formData.email || prev.email,
                        }))
                      }}
                    >
                      Olvidé mi contraseña
                    </button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#2D3C3C] border-[#D5C3B6]/10 text-[#FAF6F2]">
                    <DialogHeader>
                      <DialogTitle className="text-[#FAF6F2]">Recuperar contraseña</DialogTitle>
                      <DialogDescription className="text-[#9C8578]">
                        Te enviaremos un código de un solo uso para verificar tu identidad.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                      <div className="rounded-xl border border-[#D5C3B6]/10 bg-[#1C1917]/40 p-4">
                        <div className="flex items-start gap-3">
                          <Mail className="mt-0.5 h-4 w-4 text-[#5E8B8C]" />
                          <p className="text-sm text-[#9C8578]">
                            El código llega al correo de la cuenta y dura 30 minutos.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reset-email" className="text-[#D5C3B6]">Correo electrónico</Label>
                        <Input
                          id="reset-email"
                          type="email"
                          value={resetForm.email}
                          onChange={(e) => setResetForm((prev) => ({ ...prev, email: e.target.value }))}
                          placeholder="tu@correo.cl"
                          className="bg-[#1C1917] border-[#D5C3B6]/20 text-[#FAF6F2] placeholder:text-[#9C8578]/50"
                        />
                      </div>

                      {resetStep === "confirm" ? (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="reset-code" className="text-[#D5C3B6]">Código recibido</Label>
                            <Input
                              id="reset-code"
                              value={resetForm.code}
                              onChange={(e) => setResetForm((prev) => ({ ...prev, code: e.target.value.replace(/\D/g, "").slice(0, 6) }))}
                              placeholder="000000"
                              className="bg-[#1C1917] border-[#D5C3B6]/20 text-[#FAF6F2] placeholder:text-[#9C8578]/50"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="reset-password" className="text-[#D5C3B6]">Nueva contraseña</Label>
                            <Input
                              id="reset-password"
                              type="password"
                              value={resetForm.password}
                              onChange={(e) => setResetForm((prev) => ({ ...prev, password: e.target.value }))}
                              placeholder="Mínimo 8 caracteres"
                              className="bg-[#1C1917] border-[#D5C3B6]/20 text-[#FAF6F2] placeholder:text-[#9C8578]/50"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="reset-confirm-password" className="text-[#D5C3B6]">Confirmar contraseña</Label>
                            <Input
                              id="reset-confirm-password"
                              type="password"
                              value={resetForm.confirmPassword}
                              onChange={(e) => setResetForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                              placeholder="Repite tu nueva contraseña"
                              className="bg-[#1C1917] border-[#D5C3B6]/20 text-[#FAF6F2] placeholder:text-[#9C8578]/50"
                            />
                          </div>
                        </>
                      ) : null}

                      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                        {resetStep === "confirm" ? (
                          <Button
                            type="button"
                            variant="outline"
                            className="border-[#D5C3B6]/20 bg-transparent text-[#D5C3B6] hover:bg-[#D5C3B6]/10"
                            onClick={handlePasswordResetRequest}
                            disabled={resetLoading}
                          >
                            Reenviar código
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          className="bg-[#75524C] hover:bg-[#75524C]/90 text-[#FAF6F2]"
                          onClick={resetStep === "request" ? handlePasswordResetRequest : handlePasswordResetConfirm}
                          disabled={resetLoading}
                        >
                          {resetLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                          {resetStep === "request" ? "Enviar código" : "Actualizar contraseña"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {requiresVerification ? (
                <div className="mt-4 rounded-xl border border-[#B8965A]/30 bg-[#1C1917] p-4">
                  <p className="text-sm text-[#D5C3B6]">
                    Esta cuenta necesita verificacion por email. Si no recibiste el codigo, puedes reenviarlo.
                  </p>
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={isResendingVerification}
                    className="mt-3 text-sm font-medium text-[#5E8B8C] hover:text-[#D5C3B6] disabled:opacity-50"
                  >
                    {isResendingVerification ? "Reenviando codigo..." : "Reenviar codigo de verificacion"}
                  </button>
                </div>
              ) : null}

              <div className="mt-6 border-t border-[#D5C3B6]/10 pt-6 text-center text-sm">
                <span className="text-[#D5C3B6]">¿No tienes cuenta? </span>
                <Link href="/registro" className="font-medium text-[#5E8B8C] hover:text-[#FAF6F2] transition-colors">
                  Regístrate
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
