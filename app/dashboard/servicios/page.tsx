import { auth } from "@/lib/auth-session"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MonthlyServiceManager } from "@/components/services/monthly-service-manager"
import { Droplets, Zap, Flame, Filter, X } from "lucide-react"

const monthNames = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
]

const serviceTypes = [
  { key: "water", label: "Agua", icon: Droplets, color: "text-sky-400", bg: "bg-sky-400/10" },
  { key: "electricity", label: "Electricidad", icon: Zap, color: "text-amber-400", bg: "bg-amber-400/10" },
  { key: "gas", label: "Gas", icon: Flame, color: "text-orange-400", bg: "bg-orange-400/10" },
]

export default async function DashboardServiciosPage({
  searchParams,
}: {
  searchParams: Promise<{ property?: string; month?: string; year?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (session.user.role !== "LANDLORD" && session.user.role !== "OWNER") {
    redirect("/mi-arriendo")
  }

  const { property: filterPropertyId, month: monthFilter, year: yearFilter } = await searchParams

  const properties = await prisma.property.findMany({
    where: { landlordId: session.user.id, isActive: true },
    select: { id: true, name: true, address: true, commune: true },
    orderBy: { createdAt: "desc" },
  })

  const filterProperty =
    filterPropertyId != null && filterPropertyId !== ""
      ? await prisma.property.findFirst({
          where: { id: filterPropertyId, landlordId: session.user.id },
          select: { id: true, name: true, address: true, commune: true },
        })
      : null

  if (filterPropertyId && !filterProperty) redirect("/dashboard/servicios")

  const services = await prisma.monthlyService.findMany({
    where: {
      property: {
        landlordId: session.user.id,
        ...(filterProperty ? { id: filterProperty.id } : {}),
      },
      ...(monthFilter ? { month: Number(monthFilter) } : {}),
      ...(yearFilter ? { year: Number(yearFilter) } : {}),
    },
    include: {
      property: { select: { id: true, name: true, address: true, commune: true } },
    },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    take: 120,
  })

  const hasFilters = !!(filterPropertyId || monthFilter || yearFilter)
  const inputClass =
    "w-full rounded-lg border border-[#D5C3B6]/20 bg-[#1C1917] px-3 py-2 text-sm text-[#FAF6F2] focus:outline-none focus:border-[#5E8B8C] transition-colors"

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-serif font-semibold text-[#FAF6F2]">Servicios básicos</h1>
        <p className="text-sm text-[#9C8578]">
          Registra y controla los consumos de agua, electricidad y gas de tus propiedades.
        </p>
      </div>

      {services.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {serviceTypes.map(({ key, label, icon: Icon, color, bg }) => {
            const total = services.reduce((sum, r) => sum + (Number((r as any)[key]) || 0), 0)
            return (
              <div key={key} className={`flex items-center gap-2 rounded-xl ${bg} px-4 py-2.5 border border-[#D5C3B6]/10`}>
                <Icon className={`h-4 w-4 ${color}`} />
                <span className="text-xs text-[#9C8578] uppercase tracking-wider">{label}</span>
                <span className="text-sm font-semibold text-[#FAF6F2] tabular-nums">{total.toLocaleString("es-CL")}</span>
              </div>
            )
          })}
          <div className="flex items-center gap-2 rounded-xl bg-[#D5C3B6]/5 px-4 py-2.5 border border-[#D5C3B6]/10">
            <span className="text-xs text-[#9C8578] uppercase tracking-wider">Registros</span>
            <span className="text-sm font-semibold text-[#FAF6F2]">{services.length}</span>
          </div>
        </div>
      )}

      {filterProperty && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#5E8B8C]/20 bg-[#5E8B8C]/5 px-4 py-3 text-sm">
          <span className="text-[#9C8578]">Filtrando por:</span>
          <Badge className="bg-[#5E8B8C]/20 text-[#5E8B8C] border-0">
            {filterProperty.name || filterProperty.address}
          </Badge>
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" size="sm" className="border-[#D5C3B6]/20 text-[#D5C3B6] hover:bg-[#D5C3B6]/10 h-7 text-xs" asChild>
              <Link href={`/dashboard/propiedades/${filterProperty.id}`}>Ir al detalle</Link>
            </Button>
            <Button variant="outline" size="sm" className="border-[#D5C3B6]/20 text-[#D5C3B6] hover:bg-[#D5C3B6]/10 h-7 text-xs" asChild>
              <Link href="/dashboard/servicios"><X className="h-3 w-3 mr-1" />Quitar filtro</Link>
            </Button>
          </div>
        </div>
      )}

      <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-[#9C8578]" />
            <span className="text-xs font-medium uppercase tracking-wider text-[#9C8578]">Filtros</span>
          </div>
          <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" action="/dashboard/servicios" method="GET">
            <div className="space-y-1.5 lg:col-span-2">
              <label className="text-xs font-medium text-[#9C8578]" htmlFor="property">Propiedad</label>
              <select id="property" name="property" defaultValue={filterPropertyId ?? ""} className={inputClass}>
                <option value="">Todas las propiedades</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.name || p.address}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#9C8578]" htmlFor="month">Mes</label>
              <select id="month" name="month" defaultValue={monthFilter ?? ""} className={inputClass}>
                <option value="">Todos los meses</option>
                {monthNames.map((m, idx) => (
                  <option key={idx} value={idx + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[#9C8578]" htmlFor="year">Año</label>
              <input
                id="year" name="year" type="number" inputMode="numeric"
                min="2000" max="2100" defaultValue={yearFilter ?? ""}
                className={inputClass} placeholder="Todos los años"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-4 flex gap-3 pt-1">
              <Button type="submit" className="bg-[#5E8B8C] text-[#FAF6F2] hover:bg-[#5E8B8C]/90">
                Aplicar filtros
              </Button>
              {hasFilters && (
                <Button variant="outline" className="border-[#D5C3B6]/20 text-[#D5C3B6] hover:bg-[#D5C3B6]/10" asChild>
                  <Link href="/dashboard/servicios">Limpiar filtros</Link>
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {properties.length > 0 && (
        <MonthlyServiceManager
          properties={properties}
          defaultPropertyId={filterProperty?.id ?? filterPropertyId ?? null}
        />
      )}

      <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
        <CardContent className="p-0">
          <div className="px-6 py-4 border-b border-[#D5C3B6]/10 flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-widest text-[#B8965A]">Historial de registros</p>
            {services.length > 0 && (
              <span className="text-xs text-[#9C8578]">{services.length} registro{services.length !== 1 ? 's' : ''}</span>
            )}
          </div>

          {services.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#5E8B8C]/10 flex items-center justify-center mx-auto mb-4">
                <Droplets className="h-7 w-7 text-[#5E8B8C]/40" />
              </div>
              <h3 className="text-base font-semibold text-[#FAF6F2] mb-2">Sin registros de servicios</h3>
              <p className="text-sm text-[#9C8578] max-w-sm mx-auto">
                {!filterProperty
                  ? "Registra los consumos mensuales usando el formulario de arriba."
                  : "No hay registros para esta propiedad con los filtros aplicados."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#D5C3B6]/10 bg-[#1C1917]/20">
                    {!filterProperty && (
                      <th className="py-3 px-5 text-left text-xs font-medium uppercase tracking-wider text-[#9C8578]">
                        Propiedad
                      </th>
                    )}
                    <th className="py-3 px-5 text-left text-xs font-medium uppercase tracking-wider text-[#9C8578]">Período</th>
                    <th className="py-3 px-5 text-left text-xs font-medium uppercase tracking-wider text-[#9C8578]">
                      <span className="inline-flex items-center gap-1.5"><Droplets className="h-3.5 w-3.5 text-sky-400" />Agua</span>
                    </th>
                    <th className="py-3 px-5 text-left text-xs font-medium uppercase tracking-wider text-[#9C8578]">
                      <span className="inline-flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-amber-400" />Electricidad</span>
                    </th>
                    <th className="py-3 px-5 text-left text-xs font-medium uppercase tracking-wider text-[#9C8578]">
                      <span className="inline-flex items-center gap-1.5"><Flame className="h-3.5 w-3.5 text-orange-400" />Gas</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D5C3B6]/8">
                  {services.map((row) => {
                    const label = row.property.name || row.property.address
                    return (
                      <tr key={row.id} className="hover:bg-[#D5C3B6]/5 transition-colors">
                        {!filterProperty && (
                          <td className="py-3.5 px-5">
                            <Link
                              href={`/dashboard/servicios?property=${row.property.id}`}
                              className="font-medium text-[#5E8B8C] hover:underline"
                            >
                              {label}
                            </Link>
                            <p className="text-xs text-[#9C8578] mt-0.5">{row.property.commune}</p>
                          </td>
                        )}
                        <td className="py-3.5 px-5">
                          <span className="text-[#FAF6F2] font-medium">{monthNames[row.month - 1]}</span>
                          <span className="text-[#9C8578] ml-1">{row.year}</span>
                        </td>
                        <td className="py-3.5 px-5">
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-sky-400/8 px-2.5 py-1 text-[#FAF6F2] text-xs font-medium">
                            <Droplets className="h-3 w-3 text-sky-400" />{row.water}
                          </span>
                        </td>
                        <td className="py-3.5 px-5">
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-400/8 px-2.5 py-1 text-[#FAF6F2] text-xs font-medium">
                            <Zap className="h-3 w-3 text-amber-400" />{row.electricity}
                          </span>
                        </td>
                        <td className="py-3.5 px-5">
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-orange-400/8 px-2.5 py-1 text-[#FAF6F2] text-xs font-medium">
                            <Flame className="h-3 w-3 text-orange-400" />{row.gas}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
