import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  CreditCard,
  FileText,
  Wrench,
  Shield,
  BarChart3,
  Users,
  Building2,
  Home,
  ArrowRight,
  Check,
  MapPin,
  Scale,
  Lock,
  BadgeCheck,
  FileSignature,
  Database
} from "lucide-react"

const features = [
  {
    icon: CreditCard,
    title: "Pagos Digitales",
    description: "Gestiona arriendos y servicios básicos en un solo lugar. Historial completo y comprobantes descargables."
  },
  {
    icon: FileText,
    title: "Contratos Digitales",
    description: "Genera contratos legales con firma electrónica. Cumple con la Ley 18.101 chilena."
  },
  {
    icon: Wrench,
    title: "Mantenciones",
    description: "Reporta fallas, asigna proveedores y haz seguimiento en tiempo real de las reparaciones."
  },
  {
    icon: Shield,
    title: "Cumplimiento Legal",
    description: "Basado en leyes chilenas: Ley 18.101, Ley 21.461 y Ley 19.628 de datos personales."
  },
  {
    icon: BarChart3,
    title: "Reportes y Gráficos",
    description: "Visualiza consumos, pagos y estado de contratos con gráficos intuitivos exportables a PDF y Excel."
  },
  {
    icon: Users,
    title: "Proveedores de Confianza",
    description: "Administra tu red de proveedores verificados para mantenciones y urgencias."
  }
]

const trustBadges = [
  { icon: Scale, text: "Ley 18.101 Contratos" },
  { icon: Shield, text: "Ley 21.461 Desalojo" },
  { icon: Database, text: "Ley 19.628 Datos" },
  { icon: FileSignature, text: "Firma Electrónica" },
  { icon: BadgeCheck, text: "Datos Seguros y Privados" },
]

const roles = [
  {
    icon: Building2,
    title: "Arrendadores",
    description: "Gestiona múltiples propiedades, cobra arriendos, administra mantenciones y genera contratos digitales.",
    benefits: [
      "Dashboard con KPIs en tiempo real",
      "Mapa interactivo de propiedades",
      "Gestión de proveedores de confianza",
      "Contratos con firma digital"
    ],
    color: "bg-[#75524C]",
    href: "/dashboard"
  },
  {
    icon: Home,
    title: "Arrendatarios",
    description: "Paga tu arriendo, reporta fallas, accede a tu contrato y mantén todo organizado.",
    benefits: [
      "Vista clara de pagos y servicios",
      "Reporta mantenciones fácilmente",
      "Acceso a tu contrato digital",
      "Historial completo de pagos"
    ],
    color: "bg-[#5E8B8C]",
    href: "/mi-arriendo"
  }
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#1C1917]">
      {/* Header */}
      <header className="border-b border-[#D5C3B6]/10 bg-[#1C1917]/95 backdrop-blur supports-[backdrop-filter]:bg-[#1C1917]/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <span className="text-2xl font-serif font-semibold tracking-tight text-[#D5C3B6]">NeiFe</span>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm text-[#9C8578] hover:text-[#D5C3B6] transition-colors duration-300">
              Características
            </Link>
            <Link href="#roles" className="text-sm text-[#9C8578] hover:text-[#D5C3B6] transition-colors duration-300">
              Para quién
            </Link>
            <Link href="#mapa" className="text-sm text-[#9C8578] hover:text-[#D5C3B6] transition-colors duration-300">
              Mapa
            </Link>
            <Link href="#privacidad" className="text-sm text-[#9C8578] hover:text-[#D5C3B6] transition-colors duration-300">
              Privacidad
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-[#D5C3B6] hover:bg-[#D5C3B6]/10">
                Iniciar Sesión
              </Button>
            </Link>
            <Link href="/registro">
              <Button className="bg-[#75524C] hover:bg-[#75524C]/90 text-[#FAF6F2] shadow-lg shadow-[#75524C]/20 transition-all duration-300">
                Comenzar gratis
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-24 md:py-40 overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }} />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#5E8B8C]/20 text-[#5E8B8C] text-xs font-medium uppercase tracking-wider mb-8 border border-[#5E8B8C]/30">
              <Shield className="h-4 w-4" />
              Cumple con la legislación chilena
            </div>
            <h1 className="text-5xl md:text-7xl font-serif font-semibold text-[#FAF6F2] mb-8 leading-tight tracking-tight text-balance">
              La gestión de tus arriendos,{" "}
              <span className="text-[#5E8B8C]">finalmente sin intermediarios.</span>
            </h1>
            <p className="text-lg md:text-xl text-[#9C8578] mb-12 max-w-2xl mx-auto leading-relaxed text-pretty">
              Plataforma digital que conecta arrendadores y arrendatarios: 
              pagos, mantenciones, contratos y cumplimiento legal — todo en un solo lugar.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/registro">
                <Button size="lg" className="bg-[#75524C] hover:bg-[#75524C]/90 text-[#FAF6F2] px-10 h-14 text-base shadow-xl shadow-[#75524C]/30 transition-all duration-300 hover:shadow-2xl hover:shadow-[#75524C]/40">
                  Comenzar gratis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="border-[#D5C3B6]/30 text-[#D5C3B6] hover:bg-[#D5C3B6]/10 px-10 h-14 text-base transition-all duration-300">
                  Ver demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-6 bg-[#2D3C3C]">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {trustBadges.map((badge, index) => (
              <div key={index} className="flex items-center gap-2 text-[#D5C3B6]">
                <badge.icon className="h-4 w-4 text-[#B8965A]" />
                <span className="text-xs font-medium uppercase tracking-wider">{badge.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 md:py-32 bg-[#1C1917]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <p className="text-xs font-medium uppercase tracking-widest text-[#B8965A] mb-4">Características</p>
            <h2 className="text-4xl md:text-5xl font-serif font-semibold text-[#FAF6F2] mb-6">
              Todo lo que necesitas
            </h2>
            <p className="text-[#9C8578] max-w-2xl mx-auto text-lg">
              Herramientas diseñadas para simplificar la gestión de arriendos en Chile
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="bg-[#2D3C3C] border-[#D5C3B6]/10 hover:border-[#B8965A]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[#75524C]/5 group">
                <CardContent className="p-8">
                  <div className="w-14 h-14 rounded-xl bg-[#5E8B8C]/20 flex items-center justify-center mb-6 group-hover:bg-[#5E8B8C]/30 transition-colors duration-300">
                    <feature.icon className="h-7 w-7 text-[#5E8B8C]" />
                  </div>
                  <h3 className="text-xl font-serif font-semibold text-[#FAF6F2] mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-[#9C8578] leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Map Preview */}
      <section id="mapa" className="py-24 md:py-32 bg-[#E8D5C4]/5">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-[#B8965A] mb-4">Mapa Interactivo</p>
              <h2 className="text-4xl md:text-5xl font-serif font-semibold text-[#FAF6F2] mb-6">
                Gestiona tus propiedades desde el mapa
              </h2>
              <p className="text-[#9C8578] text-lg mb-8 leading-relaxed">
                Visualiza todas tus propiedades en un mapa interactivo con OpenStreetMap. 
                Consulta el estado de pagos, datos del arrendatario y valores de mercado por zona — todo con un click.
              </p>
              <ul className="space-y-4">
                {[
                  "Marcadores personalizados con estado de pago",
                  "Índices de mercado por zona",
                  "Comparador de precios del sector",
                  "Acceso rápido a detalles de propiedad"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-[#D5C3B6]">
                    <div className="w-6 h-6 rounded-full bg-[#5E8B8C]/20 flex items-center justify-center">
                      <MapPin className="h-3 w-3 text-[#5E8B8C]" />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="aspect-[4/3] rounded-2xl bg-[#2D3C3C] border border-[#D5C3B6]/10 overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-[#2D3C3C] to-[#1C1917]">
                  <div className="absolute inset-4 rounded-xl border border-[#D5C3B6]/10 bg-[#1C1917]/50">
                    <div className="absolute top-[20%] left-[30%] w-4 h-4 rounded-full bg-[#5E8B8C] animate-pulse shadow-lg shadow-[#5E8B8C]/50" />
                    <div className="absolute top-[40%] left-[50%] w-4 h-4 rounded-full bg-[#75524C] animate-pulse shadow-lg shadow-[#75524C]/50" />
                    <div className="absolute top-[60%] left-[25%] w-4 h-4 rounded-full bg-[#5E8B8C] animate-pulse shadow-lg shadow-[#5E8B8C]/50" />
                    <div className="absolute top-[35%] left-[70%] w-4 h-4 rounded-full bg-[#C27F79] animate-pulse shadow-lg shadow-[#C27F79]/50" />
                    <div className="absolute top-[70%] left-[60%] w-4 h-4 rounded-full bg-[#5E8B8C] animate-pulse shadow-lg shadow-[#5E8B8C]/50" />
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 bg-[#2D3C3C]/90 backdrop-blur rounded-lg p-3 border border-[#D5C3B6]/10">
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#5E8B8C]" />
                      <span className="text-[#D5C3B6]">Pagado</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#C27F79]" />
                      <span className="text-[#D5C3B6]">Pendiente</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="py-24 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <p className="text-xs font-medium uppercase tracking-widest text-[#B8965A] mb-4">Para quién</p>
            <h2 className="text-4xl md:text-5xl font-serif font-semibold text-[#FAF6F2] mb-6">
              Diseñado para ambas partes
            </h2>
            <p className="text-[#9C8578] max-w-2xl mx-auto text-lg">
              Cada rol tiene su propio panel optimizado para sus necesidades
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {roles.map((role, index) => (
              <Card key={index} className="bg-[#2D3C3C] border-[#D5C3B6]/10 overflow-hidden hover:border-[#B8965A]/30 transition-all duration-300 group">
                <div className={`h-1 ${role.color}`} />
                <CardContent className="p-10">
                  <div className={`w-16 h-16 rounded-xl ${role.color} flex items-center justify-center mb-8 shadow-lg`}>
                    <role.icon className="h-8 w-8 text-[#FAF6F2]" />
                  </div>
                  <h3 className="text-3xl font-serif font-semibold text-[#FAF6F2] mb-4">
                    {role.title}
                  </h3>
                  <p className="text-[#9C8578] mb-8 leading-relaxed">
                    {role.description}
                  </p>
                  <ul className="space-y-4 mb-10">
                    {role.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-center gap-3 text-[#D5C3B6]">
                        <Check className="h-5 w-5 text-[#5E8B8C] flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                  <Link href={role.href}>
                    <Button className={`w-full ${role.color} hover:opacity-90 text-[#FAF6F2] h-12 text-base transition-all duration-300`}>
                      Ver demo
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy Section — Ley 19.628 */}
      <section id="privacidad" className="py-24 md:py-32 bg-[#2D3C3C]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#5E8B8C]/20 flex items-center justify-center mx-auto mb-8">
              <Lock className="h-8 w-8 text-[#5E8B8C]" />
            </div>
            <p className="text-xs font-medium uppercase tracking-widest text-[#B8965A] mb-4">Privacidad y Datos</p>
            <h2 className="text-4xl md:text-5xl font-serif font-semibold text-[#FAF6F2] mb-6">
              Tus datos protegidos según Ley 19.628
            </h2>
            <p className="text-[#9C8578] text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
              NeiFe cumple íntegramente con la Ley 19.628 de Protección de la Vida Privada de Chile. 
              Nunca vendemos tus datos. Tienes derecho a acceder, corregir y eliminar tu información en cualquier momento.
            </p>
            <div className="grid sm:grid-cols-3 gap-6 mb-10">
              {[
                { icon: Database, title: "Datos seguros", desc: "Almacenamiento cifrado. Solo acceden las partes del contrato." },
                { icon: Shield, title: "Sin terceros", desc: "No vendemos ni cedemos datos a empresas externas." },
                { icon: BadgeCheck, title: "Tus derechos", desc: "Accede, corrige o elimina tus datos desde tu cuenta." }
              ].map((item, i) => (
                <div key={i} className="p-6 rounded-2xl bg-[#1C1917]/40 border border-[#D5C3B6]/10">
                  <div className="w-10 h-10 rounded-xl bg-[#5E8B8C]/20 flex items-center justify-center mb-4 mx-auto">
                    <item.icon className="h-5 w-5 text-[#5E8B8C]" />
                  </div>
                  <h3 className="font-serif font-semibold text-[#FAF6F2] mb-2">{item.title}</h3>
                  <p className="text-sm text-[#9C8578]">{item.desc}</p>
                </div>
              ))}
            </div>
            <Link href="/privacidad">
              <Button variant="outline" className="border-[#5E8B8C]/50 text-[#5E8B8C] hover:bg-[#5E8B8C]/10 transition-all duration-300">
                Leer Política de Privacidad
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 md:py-32 bg-[#75524C]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-serif font-semibold text-[#FAF6F2] mb-6">
            Comienza a gestionar tus arriendos hoy
          </h2>
          <p className="text-[#D5C3B6] max-w-2xl mx-auto mb-10 text-lg">
            Sin tarjetas de crédito, sin comisiones ocultas. 
            Regístrate y digitaliza la gestión de tus propiedades.
          </p>
          <Link href="/registro">
            <Button size="lg" className="bg-[#2D3C3C] hover:bg-[#2D3C3C]/90 text-[#FAF6F2] px-12 h-14 text-base shadow-xl transition-all duration-300">
              Crear cuenta gratuita
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-14 bg-[#2D3C3C] border-t border-[#D5C3B6]/10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="space-y-3">
              <span className="text-2xl font-serif font-semibold text-[#D5C3B6]">NeiFe</span>
              <p className="text-sm text-[#9C8578]">
                Plataforma de gestión de arriendos para Chile
              </p>
              <div className="flex items-center gap-2 text-sm text-[#9C8578]">
                <Scale className="h-4 w-4 text-[#B8965A]" />
                <span>Cumple con Ley 18.101, Ley 21.461 y Ley 19.628</span>
              </div>
            </div>
            <nav className="flex flex-wrap gap-6 text-sm">
              <Link href="/privacidad" className="text-[#9C8578] hover:text-[#D5C3B6] transition-colors duration-300">
                Política de Privacidad
              </Link>
              <Link href="/terminos" className="text-[#9C8578] hover:text-[#D5C3B6] transition-colors duration-300">
                Términos de Servicio
              </Link>
              <Link href="/legal" className="text-[#9C8578] hover:text-[#D5C3B6] transition-colors duration-300">
                Aviso Legal
              </Link>
            </nav>
          </div>
          <div className="mt-10 pt-8 border-t border-[#D5C3B6]/10 text-center">
            <p className="text-xs text-[#9C8578]">
              © 2025 NeiFe. Todos los derechos reservados. Cumple con Ley 18.101 · Ley 21.461 · Ley 19.628
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
