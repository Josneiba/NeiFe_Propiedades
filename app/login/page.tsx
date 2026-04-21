"use client"

import Link from "next/link"
import { useState, type KeyboardEvent } from "react"
import { useRouter } from "next/navigation"
import { getSession, signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, ArrowLeft, Building2, Home, Briefcase, Check } from "lucide-react"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDemoRole, setSelectedDemoRole] = useState<'landlord' | 'tenant' | 'broker'>('landlord')
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.email || !formData.password) {
      toast.error("Por favor completa todos los campos")
      return
    }

    setIsLoading(true)
    
    const result = await signIn('credentials', {
      email: formData.email,
      password: formData.password,
      redirect: false,
    })

    if (result?.error) {
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

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

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

  return (
    <div className="min-h-screen bg-[#1C1917] flex">
      {/* Left side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <div className="absolute inset-0 bg-linear-to-br from-[#2D3C3C] to-[#1C1917]">
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }} />
        </div>
        <div className="relative z-10 flex flex-col justify-center items-center p-12 text-center">
          <h2 className="text-4xl font-serif font-semibold text-[#FAF6F2] mb-4">
            Bienvenido a NeiFe
          </h2>
          <p className="text-[#9C8578] text-lg max-w-md">
            La plataforma premium para gestión de arriendos en Chile
          </p>
          <div className="mt-12 flex items-center gap-6">
            <div className="h-px w-16 bg-[#B8965A]/40" />
            <span className="text-xs uppercase tracking-widest text-[#B8965A]">Gestión Inteligente</span>
            <div className="h-px w-16 bg-[#B8965A]/40" />
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-3xl">
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
              <CardTitle className="text-2xl font-serif text-[#FAF6F2]">Iniciar Sesión</CardTitle>
              <CardDescription className="text-[#9C8578]">
                Selecciona tu rol y accede con demo o con tu cuenta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                {[
                  {
                    key: 'landlord',
                    label: 'Arrendador',
                    icon: Building2,
                    color: 'border-[#75524C] bg-[#75524C]/20 text-[#D5C3B6] hover:bg-[#75524C]/25'
                  },
                  {
                    key: 'tenant',
                    label: 'Arrendatario',
                    icon: Home,
                    color: 'border-[#5E8B8C] bg-[#5E8B8C]/20 text-[#D5C3B6] hover:bg-[#5E8B8C]/25'
                  },
                  {
                    key: 'broker',
                    label: 'Corredor',
                    icon: Briefcase,
                    color: 'border-[#B8965A] bg-[#B8965A]/20 text-[#D5C3B6] hover:bg-[#B8965A]/25'
                  },
                ].map((roleOption) => {
                  const Icon = roleOption.icon
                  const isSelected = selectedDemoRole === roleOption.key
                  return (
                    <div
                      key={roleOption.key}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedDemoRole(roleOption.key as 'landlord' | 'tenant' | 'broker')}
                      onKeyDown={(event) => handleRoleCardKeyDown(event, roleOption.key as 'landlord' | 'tenant' | 'broker')}
                      aria-pressed={isSelected}
                      className={`cursor-pointer flex flex-col items-center justify-between rounded-3xl border p-6 text-center transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-[#D5C3B6] ${roleOption.color} ${isSelected ? 'border-current bg-opacity-30 shadow-lg shadow-current/15' : 'border-[#D5C3B6]/20'}`}
                    >
                      <div className="flex flex-col items-center gap-3 w-full">
                        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-current">
                          <Icon className="h-6 w-6" />
                        </span>
                        <span className="text-base font-semibold text-[#FAF6F2]">{roleOption.label}</span>
                      </div>
                      <p className="mt-4 text-sm text-[#D5C3B6]">
                        {roleOption.key === 'landlord'
                          ? 'Panel de gestión de propiedades'
                          : roleOption.key === 'tenant'
                            ? 'Administra tu pago y contrato'
                            : 'Gestiona propiedades de tus clientes'}
                      </p>
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

              <div className="grid grid-cols-1 gap-3 mb-6 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  disabled={isLoading}
                  className="w-full rounded-xl bg-[#5E8B8C] px-4 py-3 text-sm font-semibold text-[#FAF6F2] shadow-lg shadow-[#5E8B8C]/20 transition-colors duration-300 hover:bg-[#5E8B8C]/90 disabled:opacity-50"
                >
                  {isLoading ? 'Cargando demo...' : `Iniciar demo ${selectedDemoRole === 'landlord' ? 'arrendador' : selectedDemoRole === 'tenant' ? 'arrendatario' : 'corredor'}`}
                </button>
                <div className="flex items-center justify-center text-xs text-[#9C8578] px-4">
                  Usa el selector de arriba para ver un demo rápido de cada rol.
                </div>
              </div>

              <div className="relative mb-6">
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
                    className="bg-[#1C1917] border-[#D5C3B6]/20 text-[#FAF6F2] placeholder:text-[#9C8578]/50 focus:border-[#5E8B8C] h-12"
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
                      className="bg-[#1C1917] border-[#D5C3B6]/20 text-[#FAF6F2] placeholder:text-[#9C8578]/50 focus:border-[#5E8B8C] h-12 pr-10"
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
                  className="w-full bg-[#75524C] hover:bg-[#75524C]/90 text-[#FAF6F2] h-12 text-base shadow-lg shadow-[#75524C]/20 transition-all duration-300"
                  disabled={isLoading}
                >
                  {isLoading ? "Ingresando..." : "Iniciar Sesión"}
                </Button>
              </form>
              
              <div className="mt-6 text-center text-sm">
                <span className="text-[#9C8578]">¿No tienes cuenta? </span>
                <Link href="/registro" className="text-[#5E8B8C] hover:text-[#5E8B8C]/80 font-medium transition-colors">
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
