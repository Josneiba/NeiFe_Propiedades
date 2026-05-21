import { auth } from "@/lib/auth-session"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MonthlyServiceManager } from "@/components/services/monthly-service-manager"
import { ServiceRecordCard } from "@/components/services/service-record-card"
import {
  BadgeDollarSign,
  Droplets,
  Filter,
  Flame,
  Plus,
  ReceiptText,
  WalletCards,
  X,
  Zap,
} from "lucide-react"

const monthNames = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
]

function formatCurrency(value: number) {
  return `$${value.toLocaleString("es-CL")}`
}

function sumExtraItems(items: unknown): number {
  if (!Array.isArray(items)) return 0

  return items.reduce<number>((sum, item) => {
    if (!item || typeof item !== "object") return sum
    const amount = Number((item as { amount?: unknown }).amount) || 0
    return sum + amount
  }, 0)
}

export default async function BrokerServiciosPage({
  searchParams,
}: {
  searchParams: Promise<{ property?: string; month?: string; year?: string; saved?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (session.user.role !== "BROKER" && session.user.role !== "OWNER") {
    redirect("/mi-arriendo")
  }

  const { property: filterPropertyId, month: monthFilter, year: yearFilter, saved } = await searchParams

  const propertyWhere = {
    isActive: true,
    OR: [
      { managedBy: session.user.id },
      { mandates: { some: { brokerId: session.user.id, status: "ACTIVE" as const } } },
    ],
  }

  const properties = await prisma.property.findMany({
    where: propertyWhere,
    select: { id: true, name: true, address: true, commune: true },
    orderBy: { createdAt: "desc" },
  })

  const filterProperty =
    filterPropertyId != null && filterPropertyId !== ""
      ? await prisma.property.findFirst({
          where: { id: filterPropertyId, ...propertyWhere },
          select: { id: true, name: true, address: true, commune: true },
        })
      : null

  if (filterPropertyId && !filterProperty) redirect("/broker/servicios")

  const services = await prisma.monthlyService.findMany({
    where: {
      property: {
        ...propertyWhere,
        ...(filterProperty ? { id: filterProperty.id } : {}),
      },
      ...(monthFilter ? { month: Number(monthFilter) } : {}),
      ...(yearFilter ? { year: Number(yearFilter) } : {}),
    },
    include: {
      property: {
        select: {
          id: true,
          name: true,
          address: true,
          commune: true,
          tenant: { select: { name: true } },
        },
      },
    },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    take: 120,
  })

  const hasFilters = !!(filterPropertyId || monthFilter || yearFilter)
  const inputClass =
    "w-full rounded-lg border border-[#D5C3B6]/20 bg-[#1C1917] px-3 py-2 text-sm text-[#FAF6F2] focus:outline-none focus:border-[#5E8B8C] transition-colors"

  const totals = services.reduce(
    (acc, row) => {
      const extraItems = sumExtraItems(row.extraItems)

      acc.water += row.water
      acc.electricity += row.electricity
      acc.gas += row.gas
      acc.garbage += row.garbage
      acc.commonExpenses += row.commonExpenses
      acc.other += extraItems + (row.other || 0)
      return acc
    },
    {
      water: 0,
      electricity: 0,
      gas: 0,
      garbage: 0,
      commonExpenses: 0,
      other: 0,
    },
  )

  const extraCharges = totals.garbage + totals.commonExpenses + totals.other
  const totalCollected = totals.water + totals.electricity + totals.gas + extraCharges

  const summaryCards = [
    {
      label: "Agua",
      value: totals.water,
      icon: Droplets,
      accent: "text-sky-400",
      bg: "bg-sky-400/10",
    },
    {
      label: "Electricidad",
      value: totals.electricity,
      icon: Zap,
      accent: "text-amber-400",
      bg: "bg-amber-400/10",
    },
    {
      label: "Gas",
      value: totals.gas,
      icon: Flame,
      accent: "text-orange-400",
      bg: "bg-orange-400/10",
    },
    {
      label: "Cargos extra",
      value: extraCharges,
      icon: BadgeDollarSign,
      accent: "text-[#B8965A]",
      bg: "bg-[#B8965A]/10",
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-serif font-semibold text-[#FAF6F2]">Servicios mensuales</h1>
        <p className="max-w-3xl text-sm text-[#9C8578]">
          Carga un período por propiedad y activa solo los cobros que correspondan. Así el arrendatario ve un resumen claro y el propietario puede entender rápidamente qué estás informando.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-[#D5C3B6]/10 bg-[#2D3C3C] p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-[#9C8578]">{card.label}</p>
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.bg}`}>
                <card.icon className={`h-4 w-4 ${card.accent}`} />
              </div>
            </div>
            <p className="mt-4 text-2xl font-semibold text-[#FAF6F2]">{formatCurrency(card.value)}</p>
            <p className="mt-1 text-xs text-[#9C8578]">
              {services.length > 0 ? `${services.length} período${services.length === 1 ? "" : "s"} informado${services.length === 1 ? "" : "s"}` : "Sin movimientos aún"}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
        <Card className="border-[#D5C3B6]/10 bg-[#2D3C3C]">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-4 w-4 text-[#9C8578]" />
              <span className="text-xs font-medium uppercase tracking-wider text-[#9C8578]">Buscar períodos</span>
            </div>
            <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" action="/broker/servicios" method="GET">
              <div className="space-y-1.5 lg:col-span-2">
                <label className="text-xs font-medium text-[#9C8578]" htmlFor="property">Propiedad</label>
                <select id="property" name="property" defaultValue={filterPropertyId ?? ""} className={inputClass}>
                  <option value="">Todas las propiedades</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>{property.name || property.address}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#9C8578]" htmlFor="month">Mes</label>
                <select id="month" name="month" defaultValue={monthFilter ?? ""} className={inputClass}>
                  <option value="">Todos los meses</option>
                  {monthNames.map((month, idx) => (
                    <option key={month} value={idx + 1}>{month}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#9C8578]" htmlFor="year">Año</label>
                <input
                  id="year"
                  name="year"
                  type="number"
                  inputMode="numeric"
                  min="2000"
                  max="2100"
                  defaultValue={yearFilter ?? ""}
                  className={inputClass}
                  placeholder="Todos"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-4 flex flex-wrap gap-3 pt-1">
                <Button type="submit" className="bg-[#5E8B8C] text-[#FAF6F2] hover:bg-[#5E8B8C]/90">
                  Aplicar filtros
                </Button>
                {hasFilters ? (
                  <Button variant="outline" className="border-[#D5C3B6]/20 text-[#D5C3B6] hover:bg-[#D5C3B6]/10" asChild>
                    <Link href="/broker/servicios">Limpiar filtros</Link>
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-[#D5C3B6]/10 bg-[#2D3C3C]">
          <CardContent className="p-5">
            <p className="text-xs font-medium uppercase tracking-widest text-[#B8965A]">Lectura rápida</p>
            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-xl border border-[#D5C3B6]/10 bg-[#1C1917]/35 p-4">
                <p className="text-[#9C8578]">Total informado</p>
                <p className="mt-2 text-xl font-semibold text-[#FAF6F2]">{formatCurrency(totalCollected)}</p>
              </div>
              <div className="rounded-xl border border-[#D5C3B6]/10 bg-[#1C1917]/35 p-4">
                <p className="text-[#9C8578]">Períodos cargados</p>
                <p className="mt-2 text-xl font-semibold text-[#FAF6F2]">{services.length}</p>
              </div>
              {filterProperty ? (
                <div className="rounded-xl border border-[#5E8B8C]/20 bg-[#5E8B8C]/5 p-4">
                  <p className="text-xs uppercase tracking-wider text-[#9C8578]">Propiedad activa</p>
                  <p className="mt-2 font-semibold text-[#FAF6F2]">{filterProperty.name || filterProperty.address}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge className="border-0 bg-[#5E8B8C]/20 text-[#5E8B8C]">{filterProperty.commune}</Badge>
                    <Button variant="outline" size="sm" className="h-7 border-[#D5C3B6]/20 text-[#D5C3B6]" asChild>
                      <Link href={`/broker/propiedades/${filterProperty.id}`}>Ver propiedad</Link>
                    </Button>
                    <Button variant="outline" size="sm" className="h-7 border-[#D5C3B6]/20 text-[#D5C3B6]" asChild>
                      <Link href="/broker/servicios"><X className="mr-1 h-3 w-3" />Quitar</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[#D5C3B6]/15 bg-[#1C1917]/20 p-4 text-[#9C8578]">
                  Filtra por propiedad cuando quieras revisar rápido qué cobros estás informando en una ficha puntual.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {properties.length > 0 ? (
        <MonthlyServiceManager
          properties={properties}
          defaultPropertyId={filterProperty?.id ?? filterPropertyId ?? null}
          title="Registrar un nuevo período"
          description="Selecciona la propiedad, el mes y agrega solo los cobros que correspondan a esa administración."
        />
      ) : (
        <Card className="border-[#D5C3B6]/10 bg-[#2D3C3C]">
          <CardContent className="p-10 text-center">
            <ReceiptText className="mx-auto h-10 w-10 text-[#9C8578]" />
            <h3 className="mt-4 text-lg font-semibold text-[#FAF6F2]">Aún no administras propiedades</h3>
            <p className="mt-2 text-sm text-[#9C8578]">
              Cuando tengas mandatos activos podrás registrar servicios y boletas para cada arrendatario.
            </p>
            <Button className="mt-5 bg-[#75524C] text-[#FAF6F2] hover:bg-[#75524C]/90" asChild>
              <Link href="/broker/mandatos/nuevo">
                <Plus className="mr-2 h-4 w-4" />
                Solicitar mandato
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card id="service-records" className="border-[#D5C3B6]/10 bg-[#2D3C3C]">
        <CardContent className="p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-[#B8965A]">Historial de períodos</p>
              <p className="mt-1 text-sm text-[#9C8578]">Cada período queda resumido en una tarjeta clara para ti, el arrendatario y el propietario.</p>
            </div>
            {services.length > 0 ? (
              <Badge className="w-fit border-0 bg-[#D5C3B6]/10 text-[#D5C3B6]">
                {services.length} registro{services.length === 1 ? "" : "s"}
              </Badge>
            ) : null}
          </div>

          {services.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#5E8B8C]/10">
                <ReceiptText className="h-8 w-8 text-[#5E8B8C]/50" />
              </div>
              <h3 className="text-base font-semibold text-[#FAF6F2]">Aún no hay períodos registrados</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-[#9C8578]">
                Usa el formulario superior para crear el primer registro con solo los servicios que apliquen a esa propiedad.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {services.map((row) => (
                <ServiceRecordCard
                  key={row.id}
                  record={row}
                  monthLabel={`${monthNames[row.month - 1]} ${row.year}`}
                  propertyLabel={!filterProperty ? row.property.name || row.property.address : undefined}
                  propertyMeta={!filterProperty ? row.property.commune : filterProperty?.commune}
                  tenantName={row.property.tenant?.name || undefined}
                  highlighted={saved === `${row.property.id}-${row.year}-${row.month}`}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
