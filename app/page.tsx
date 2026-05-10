import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getPublishedProperties } from "@/lib/public-listings"
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
  Briefcase,
  MapPin,
  Scale,
  Lock,
  BadgeCheck,
  FileSignature,
  Database,
  Bath,
  BedDouble,
  Ruler,
} from "lucide-react"

export const dynamic = "force-dynamic"

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
    accessAs: "arrendador",
    description: "Gestiona múltiples propiedades, cobra arriendos, administra mantenciones y genera contratos digitales.",
    benefits: [
      "Dashboard con KPIs en tiempo real",
      "Mapa interactivo de propiedades",
      "Gestión de proveedores de confianza",
      "Contratos con firma digital"
    ],
    color: "bg-[#75524C]",
    border: "border-[#75524C]",
    href: "/login"
  },
  {
    icon: Home,
    title: "Arrendatarios",
    accessAs: "arrendatario",
    description: "Paga tu arriendo, reporta fallas, accede a tu contrato y mantén todo organizado.",
    benefits: [
      "Vista clara de pagos y servicios",
      "Reporta mantenciones fácilmente",
      "Acceso a tu contrato digital",
      "Historial completo de pagos"
    ],
    color: "bg-[#5E8B8C]",
    border: "border-[#5E8B8C]",
    href: "/login"
  },
  {
    icon: Briefcase,
    title: "Corredores",
    accessAs: "corredor",
    description: "Administra las propiedades de tus clientes, gestiona mandatos y monitorea contratos con un solo login.",
    benefits: [
      "Mandatos activos y seguimiento",
      "Acceso directo a propiedades de clientes",
      "Panel centralizado de contratos",
      "Control de comisiones y acuerdos"
    ],
    color: "bg-[#B8965A]",
    border: "border-[#B8965A]",
    href: "/login"
  }
]

const currencyFormatter = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  minimumFractionDigits: 0,
})

const navLinkClass =
  "relative text-sm text-[#9C8578] transition-colors duration-300 hover:text-[#D5C3B6] after:absolute after:left-0 after:bottom-0 after:h-px after:w-full after:origin-left after:scale-x-0 after:bg-[#B8965A] after:transition-transform after:duration-300 hover:after:scale-x-100"

export default async function LandingPage() {
  const listings = await getPublishedProperties(6)

  return (
    <div className="min-h-screen bg-[#1C1917]">
      <header className="border-b border-[#D5C3B6]/10 bg-[#1C1917]/95 backdrop-blur supports-backdrop-filter:bg-[#1C1917]/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link href="/" className="text-xl md:text-2xl font-serif font-semibold tracking-tight text-[#D5C3B6] shrink-0">
            NeiFe<span className="text-[#B8965A]">.</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            <Link href="#arriendos" className={navLinkClass}>
              Arriendos
            </Link>
            <Link href="#features" className={navLinkClass}>
              Características
            </Link>
            <Link href="#roles" className={navLinkClass}>
              Para quién
            </Link>
            <Link href="#mapa" className={navLinkClass}>
              Mapa
            </Link>
            <Link href="#privacidad" className={navLinkClass}>
              Privacidad
            </Link>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link href="/login" className="hidden sm:inline-flex">
              <Button variant="ghost" size="sm" className="text-[#D5C3B6] hover:bg-[#D5C3B6]/10">
                Iniciar Sesión
              </Button>
            </Link>
            <Link href="/registro">
              <Button size="sm" className="rounded-lg bg-[#75524C] hover:bg-[#75524C]/90 text-[#FAF6F2] shadow-md shadow-[#75524C]/15 transition-all duration-300">
                Comenzar gratis
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-b from-[#2D3C3C]/20 to-transparent pt-10 pb-12 md:pt-14 md:pb-16 lg:pt-16 lg:pb-20 scroll-mt-14">
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#5E8B8C]/20 text-[#5E8B8C] text-[11px] font-medium uppercase tracking-wider mb-4 border border-[#5E8B8C]/30">
              <Shield className="h-3.5 w-3.5 shrink-0" />
              Cumple con la legislación chilena
            </div>
            <div className="mx-auto mb-5 h-px w-16 bg-[#D5C3B6]/25" aria-hidden />
            <h1 className="text-4xl md:text-6xl font-serif font-semibold text-[#FAF6F2] mb-5 leading-tight tracking-tight text-balance">
              La herramienta más completa para{" "}
              <span className="text-[#5E8B8C]">monitorear y gestionar tus arriendos.</span>
            </h1>
            <p className="text-base md:text-lg text-[#9C8578] mb-8 max-w-2xl mx-auto leading-relaxed text-pretty">
              Plataforma digital que conecta arrendadores y arrendatarios:
              pagos, mantenciones, contratos y cumplimiento legal — todo en un solo lugar.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
              <Link href="/registro">
                <Button size="lg" className="rounded-lg bg-[#75524C] hover:bg-[#75524C]/90 text-[#FAF6F2] px-8 h-12 text-base shadow-lg shadow-[#75524C]/25 transition-all duration-300 w-full sm:w-auto">
                  Comenzar gratis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#roles">
                <Button size="lg" variant="outline" className="rounded-lg border-[#D5C3B6]/30 text-[#D5C3B6] hover:bg-[#D5C3B6]/10 px-8 h-12 text-base transition-all duration-300 w-full sm:w-auto">
                  Ver demo
                </Button>
              </Link>
            </div>
            <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] md:text-xs uppercase tracking-wider text-[#9C8578]">
              <span>Contratos digitales</span>
              <span className="text-[#D5C3B6]/40" aria-hidden>·</span>
              <span>Pagos online</span>
              <span className="text-[#D5C3B6]/40" aria-hidden>·</span>
              <span>Legal Chile</span>
            </p>
          </div>
        </div>
      </section>

      <section className="py-4 bg-[#2D3C3C] border-y border-[#D5C3B6]/5">
        <div className="container mx-auto px-4">
          <div className="-mx-4 px-4 md:mx-0 md:px-0 overflow-x-auto md:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex md:flex-wrap items-center justify-start md:justify-center gap-x-8 gap-y-3 min-w-max md:min-w-0 py-1">
              {trustBadges.map((badge, index) => (
                <div key={index} className="flex items-center gap-2 text-[#D5C3B6] shrink-0">
                  <badge.icon className="h-3.5 w-3.5 text-[#B8965A] shrink-0" />
                  <span className="text-[10px] md:text-xs font-medium uppercase tracking-wider whitespace-nowrap">{badge.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="arriendos" className="py-14 md:py-16 bg-[#1C1917] scroll-mt-14">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between mb-10">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-widest text-[#B8965A] mb-2">Propiedades destacadas</p>
              <h2 className="text-3xl md:text-4xl font-serif font-semibold text-[#FAF6F2] mb-2">
                Arriendos publicados en NeiFe
              </h2>
              <p className="text-[#9C8578] max-w-2xl text-base md:text-lg leading-relaxed">
                Además de administrar, ahora puedes publicar propiedades disponibles y mostrarlas desde la portada.
              </p>
            </div>
            <Link href="/registro" className="shrink-0">
              <Button variant="outline" className="rounded-lg border-[#D5C3B6]/20 text-[#D5C3B6] hover:bg-[#D5C3B6]/10">
                Publicar mi propiedad
              </Button>
            </Link>
          </div>

          {listings.length === 0 ? (
            <div className="rounded-2xl border border-[#D5C3B6]/10 bg-[#2D3C3C]/80 px-8 py-14 text-center">
              <Building2 className="mx-auto h-16 w-16 text-[#5E8B8C]/60 mb-6" strokeWidth={1.25} />
              <p className="text-xl font-serif font-semibold text-[#FAF6F2] mb-2">Todavía no hay propiedades publicadas</p>
              <p className="text-sm md:text-base text-[#9C8578] max-w-md mx-auto leading-relaxed">
                Desde la ficha de cada propiedad puedes activar la vitrina pública cuando esté disponible para arriendo.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {listings.map((property) => {
                const cover = property.photos[0]

                return (
                  <Card key={property.id} className="overflow-hidden bg-[#2D3C3C] border-[#D5C3B6]/10 shadow-sm hover:border-[#B8965A]/25 hover:shadow-md transition-all duration-300">
                    <div className="aspect-[4/3] bg-[#1C1917] border-b border-[#D5C3B6]/10 overflow-hidden">
                      {cover?.url ? (
                        <img
                          src={cover.url}
                          alt={cover.caption || property.name || property.address}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-[#1C1917] text-[#9C8578]">
                          <Home className="h-10 w-10" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-5 flex flex-col flex-1">
                      <div>
                        <h3 className="text-lg font-serif font-semibold text-[#FAF6F2]">
                          {property.name || property.address}
                        </h3>
                        <p className="mt-1 text-sm text-[#9C8578]">
                          {property.commune}, {property.region}
                        </p>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2 text-sm text-[#D5C3B6]">
                        <div className="rounded-lg bg-[#1C1917] px-2.5 py-2.5">
                          <div className="flex items-center gap-2">
                            <BedDouble className="h-4 w-4 text-[#5E8B8C]" />
                            <span>{property.bedrooms ?? "-"}</span>
                          </div>
                          <p className="mt-1 text-[10px] text-[#9C8578]">Dorm.</p>
                        </div>
                        <div className="rounded-lg bg-[#1C1917] px-2.5 py-2.5">
                          <div className="flex items-center gap-2">
                            <Bath className="h-4 w-4 text-[#5E8B8C]" />
                            <span>{property.bathrooms ?? "-"}</span>
                          </div>
                          <p className="mt-1 text-[10px] text-[#9C8578]">Baños</p>
                        </div>
                        <div className="rounded-lg bg-[#1C1917] px-2.5 py-2.5">
                          <div className="flex items-center gap-2">
                            <Ruler className="h-4 w-4 text-[#5E8B8C]" />
                            <span>{property.squareMeters ? `${property.squareMeters} m²` : "-"}</span>
                          </div>
                          <p className="mt-1 text-[10px] text-[#9C8578]">Superficie</p>
                        </div>
                      </div>

                      <p className="mt-4 line-clamp-3 text-sm leading-6 text-[#9C8578] flex-1">
                        {property.description || "Propiedad disponible para arriendo administrada desde NeiFe."}
                      </p>

                      <div className="mt-5 flex items-end justify-between gap-3 pt-4 border-t border-[#D5C3B6]/10">
                        <p className="text-xl font-semibold text-[#FAF6F2] tabular-nums">
                          {property.monthlyRentCLP
                            ? currencyFormatter.format(property.monthlyRentCLP)
                            : property.monthlyRentUF
                              ? `UF ${property.monthlyRentUF.toFixed(2)}`
                              : "Precio a convenir"}
                        </p>
                        <span className="rounded-full bg-[#5E8B8C]/12 px-2 py-0.5 text-[10px] font-medium text-[#5E8B8C] whitespace-nowrap">
                          Disponible
                        </span>
                      </div>

                      <Button asChild className="mt-5 w-full rounded-lg bg-[#75524C] hover:bg-[#75524C]/90 text-[#FAF6F2]">
                        <Link href={`/arriendos/${property.id}`}>
                          Ver detalle del arriendo
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <section id="features" className="py-14 md:py-16 bg-[#1C1917] scroll-mt-14">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 md:mb-12">
            <p className="text-xs font-medium uppercase tracking-widest text-[#B8965A] mb-2">Características</p>
            <h2 className="text-3xl md:text-4xl font-serif font-semibold text-[#FAF6F2] mb-3">
              Todo lo que necesitas
            </h2>
            <p className="text-[#9C8578] max-w-2xl mx-auto text-base">
              Herramientas diseñadas para simplificar la gestión de arriendos en Chile
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} className="relative bg-[#2D3C3C] border-[#D5C3B6]/10 hover:border-[#B8965A]/25 transition-all duration-300 hover:shadow-md shadow-sm flex flex-col h-full">
                <span className="absolute top-4 right-4 text-sm font-serif tabular-nums text-[#B8965A]/30 select-none" aria-hidden>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <CardContent className="p-5 md:p-6 flex flex-col flex-1">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-[#5E8B8C]/20 flex items-center justify-center shrink-0">
                      <feature.icon className="h-5 w-5 text-[#5E8B8C]" />
                    </div>
                    <h3 className="text-lg font-serif font-semibold text-[#FAF6F2] leading-snug pt-1.5">
                      {feature.title}
                    </h3>
                  </div>
                  <p className="text-sm text-[#9C8578] leading-relaxed flex-1">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="mapa" className="py-14 md:py-16 bg-[#1C1917] scroll-mt-14">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-10 items-center max-w-6xl mx-auto">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-[#B8965A] mb-2">Mapa Interactivo</p>
              <h2 className="text-3xl md:text-4xl font-serif font-semibold text-[#FAF6F2] mb-4">
                Gestiona tus propiedades desde el mapa
              </h2>
              <p className="text-[#9C8578] text-base mb-6 leading-relaxed">
                Visualiza todas tus propiedades en un mapa interactivo con OpenStreetMap.
                Consulta el estado de pagos, datos del arrendatario y valores de mercado por zona — todo con un click.
              </p>
              <ul className="space-y-3">
                {[
                  "Marcadores personalizados con estado de pago",
                  "Índices de mercado por zona",
                  "Comparador de precios del sector",
                  "Acceso rápido a detalles de propiedad"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-[#D5C3B6] text-sm">
                    <div className="w-6 h-6 rounded-full bg-[#5E8B8C]/20 flex items-center justify-center shrink-0">
                      <MapPin className="h-3 w-3 text-[#5E8B8C]" />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="relative aspect-[4/3] rounded-xl border border-[#D5C3B6]/15 bg-[#2D3C3C] overflow-hidden shadow-lg flex flex-col items-center justify-center gap-4 px-8 text-center">
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.15]"
                  style={{
                    backgroundImage: "radial-gradient(circle, #D5C3B6 1px, transparent 1px)",
                    backgroundSize: "14px 14px",
                  }}
                />
                <div className="relative z-10 flex flex-col items-center gap-4">
                  <div className="rounded-full bg-[#1C1917]/95 p-4 border border-[#D5C3B6]/10 shadow-inner">
                    <MapPin className="h-10 w-10 text-[#5E8B8C]" strokeWidth={1.25} />
                  </div>
                  <p className="text-sm text-[#D5C3B6] max-w-xs leading-relaxed">
                    Vista disponible en tu cuenta
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="roles" className="py-14 md:py-16 scroll-mt-14">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10 md:mb-12">
            <p className="text-xs font-medium uppercase tracking-widest text-[#B8965A] mb-2">Para quién</p>
            <h2 className="text-3xl md:text-4xl font-serif font-semibold text-[#FAF6F2] mb-3">
              Diseñado para ambas partes
            </h2>
            <p className="text-[#9C8578] max-w-2xl mx-auto text-base">
              Cada rol tiene su propio panel optimizado para sus necesidades
            </p>
          </div>
          <div className="flex flex-col gap-6 md:grid md:grid-cols-3 md:gap-5 max-w-6xl mx-auto">
            {roles.map((role, index) => (
              <Card key={index} className="bg-[#2D3C3C] border-[#D5C3B6]/10 overflow-hidden hover:border-[#B8965A]/25 transition-all duration-300 flex flex-col shadow-sm md:border md:border-[#D5C3B6]/10">
                <div className={`h-1 ${role.color}`} />
                <CardContent className="p-6 md:p-8 flex flex-col flex-1">
                  <div className={`w-14 h-14 rounded-xl ${role.color} flex items-center justify-center mb-5 shadow-md shrink-0`}>
                    <role.icon className="h-7 w-7 text-[#FAF6F2]" />
                  </div>
                  <h3 className="text-2xl font-serif font-semibold text-[#FAF6F2] mb-3">
                    {role.title}
                  </h3>
                  <p className="text-sm text-[#9C8578] mb-6 leading-relaxed">
                    {role.description}
                  </p>
                  <ul className="space-y-3 mb-8 flex-1">
                    {role.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-[#D5C3B6]">
                        <Check className="h-4 w-4 text-[#5E8B8C] shrink-0 mt-0.5" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                  <Link href={role.href}>
                    <Button variant="outline" className={`w-full rounded-lg border-2 ${role.border} bg-transparent text-[#FAF6F2] hover:bg-[#FAF6F2]/5 h-11`}>
                      Acceder como {role.accessAs}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="privacidad" className="py-14 md:py-16 bg-[#2D3C3C] scroll-mt-14">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="w-14 h-14 rounded-xl bg-[#5E8B8C]/20 flex items-center justify-center mx-auto mb-6">
              <Lock className="h-7 w-7 text-[#5E8B8C]" />
            </div>
            <p className="text-xs font-medium uppercase tracking-widest text-[#B8965A] mb-2">Privacidad y Datos</p>
            <h2 className="text-3xl md:text-4xl font-serif font-semibold text-[#FAF6F2] mb-4">
              Tus datos protegidos según Ley 19.628
            </h2>
            <p className="text-[#9C8578] text-base mb-8 max-w-2xl mx-auto leading-relaxed">
              NeiFe cumple íntegramente con la Ley 19.628 de Protección de la Vida Privada de Chile.
              Nunca vendemos tus datos. Tienes derecho a acceder, corregir y eliminar tu información en cualquier momento.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              {[
                { icon: Database, title: "Datos seguros", desc: "Almacenamiento cifrado. Solo acceden las partes del contrato." },
                { icon: Shield, title: "Sin terceros", desc: "No vendemos ni cedemos datos a empresas externas." },
                { icon: BadgeCheck, title: "Tus derechos", desc: "Accede, corrige o elimina tus datos desde tu cuenta." }
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-xl bg-[#1C1917]/40 border border-[#D5C3B6]/10 text-left sm:text-center">
                  <div className="w-9 h-9 rounded-lg bg-[#5E8B8C]/20 flex items-center justify-center mb-3 mx-auto sm:mx-auto">
                    <item.icon className="h-4 w-4 text-[#5E8B8C]" />
                  </div>
                  <h3 className="text-sm font-serif font-semibold text-[#FAF6F2] mb-1.5">{item.title}</h3>
                  <p className="text-xs text-[#9C8578] leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
            <Link href="/privacidad">
              <Button variant="outline" className="rounded-lg border-[#5E8B8C]/50 text-[#5E8B8C] hover:bg-[#5E8B8C]/10 transition-all duration-300">
                Leer Política de Privacidad
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="relative border-t border-[#B8965A]/40 py-14 md:py-16 bg-[#75524C]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-semibold text-[#FAF6F2] mb-4">
            Comienza a gestionar tus arriendos hoy
          </h2>
          <p className="text-[#D5C3B6] max-w-2xl mx-auto mb-8 text-base">
            Sin tarjetas de crédito, sin comisiones ocultas.
            Regístrate y digitaliza la gestión de tus propiedades.
          </p>
          <Link href="/registro">
            <Button size="lg" variant="outline" className="rounded-lg border-2 border-[#FAF6F2] text-[#FAF6F2] bg-transparent hover:bg-[#FAF6F2]/10 px-10 h-12 text-base shadow-none transition-all duration-300">
              Crear cuenta gratuita
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="py-8 md:py-10 bg-[#2D3C3C] border-t border-[#D5C3B6]/10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8 text-center lg:text-left">
            <Link href="/" className="text-xl font-serif font-semibold text-[#D5C3B6] shrink-0">
              NeiFe<span className="text-[#B8965A]">.</span>
            </Link>
            <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
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
            <p className="text-[11px] md:text-xs text-[#9C8578] lg:text-right max-w-md lg:max-w-xs">
              © 2026 NeiFe. Cumple con Ley 18.101 · Ley 21.461 · Ley 19.628
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
