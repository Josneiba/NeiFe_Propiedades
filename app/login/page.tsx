"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, ArrowLeft, Building2, Home } from "lucide-react"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
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
      // Obtener sesión y redirigir según rol
      const response = await fetch('/api/auth/session')
      const session = await response.json()
      
      const role = session?.user?.role || 'TENANT'
      if (role === 'TENANT') {
        router.push("/mi-arriendo")
      } else {
        router.push("/dashboard")
      }
    }
  }

  const handleDemoLogin = async (role: "landlord" | "tenant") => {
    const email = role === "landlord" ? "owner@neife.cl" : "tenant1@neife.cl"
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
      } else {
        router.push("/mi-arriendo")
      }
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
        <div className="w-full max-w-md">
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
                Ingresa tus credenciales para acceder a tu cuenta
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Demo buttons */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => handleDemoLogin("landlord")}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 p-3 rounded-lg bg-[#75524C]/20 border border-[#75524C]/30 hover:bg-[#75524C]/30 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Building2 className="h-4 w-4 text-[#75524C]" />
                  <span className="text-sm text-[#D5C3B6]">Demo Arrendador</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin("tenant")}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 p-3 rounded-lg bg-[#5E8B8C]/20 border border-[#5E8B8C]/30 hover:bg-[#5E8B8C]/30 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Home className="h-4 w-4 text-[#5E8B8C]" />
                  <span className="text-sm text-[#D5C3B6]">Demo Arrendatario</span>
                </button>
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
