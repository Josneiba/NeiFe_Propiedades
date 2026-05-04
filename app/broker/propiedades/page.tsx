import { auth } from "@/lib/auth-session"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SearchFilter } from "@/components/ui/search-filter"
import { Building2, MapPin, Plus, Wrench } from "lucide-react"
import Link from "next/link"
import { paymentStatus as paymentStatusLocal } from "@/lib/broker-design"
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

interface PropertyWithPaymentStatus {
  id: string
  name: string
  address: string
  commune: string
  monthlyRentCLP: number | null
  landlord: {
    name: string | null
    email: string
  } | null
  tenant: {
    name: string | null
    email: string
  } | null
  contractStart: Date
  contractEnd: Date
  payments: Array<{
    status: string
    month: number
    year: number
  }>
  mandates: Array<{
    id: string
  }>
  _count: {
    maintenance: number
  }
}

async function BrokerPropertyList({ brokerId, searchQuery }: { brokerId: string; searchQuery?: string }) {
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()

  const mandates = await prisma.mandate.findMany({
    where: {
      brokerId,
      status: 'ACTIVE',
      ...(searchQuery
        ? {
            property: {
              OR: [
                { address: { contains: searchQuery, mode: "insensitive" } },
                { commune: { contains: searchQuery, mode: "insensitive" } },
                { tenant: { name: { contains: searchQuery, mode: "insensitive" } } },
                { landlord: { name: { contains: searchQuery, mode: "insensitive" } } },
              ],
            },
          }
        : {}),
    },
    include: {
      property: {
        include: {
          landlord: {
            select: {
              name: true,
              email: true,
            },
          },
          tenant: {
            select: {
              name: true,
              email: true,
            },
          },
          payments: {
            where: {
              month: currentMonth,
              year: currentYear,
            },
            select: {
              status: true,
              month: true,
              year: true,
            },
          },
          mandates: {
            where: {
              brokerId,
              status: 'ACTIVE',
            },
            select: {
              id: true,
            },
            take: 1,
            orderBy: {
              createdAt: 'desc',
            },
          },
          _count: {
            select: {
              maintenance: {
                where: {
                  status: {
                    in: ['REQUESTED', 'REVIEWING', 'APPROVED', 'IN_PROGRESS'],
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  const properties = mandates.map((m) => ({
    ...m.property,
  })) as PropertyWithPaymentStatus[]

  const getPaymentStatus = (payments: Array<{ status: string }>) => {
    const payment = payments[0]
    if (!payment) return "PENDING" as const
    const statusMap: Record<string, keyof typeof paymentStatusLocal> = {
      PAID: "PAID",
      PENDING: "PENDING",
      OVERDUE: "OVERDUE",
      PROCESSING: "PROCESSING",
      CANCELLED: "CANCELLED",
    }
    return statusMap[payment.status] || "PENDING"
  }

  return (
    <div className={`grid gap-3 ${properties.length > 0 ? 'sm:grid-cols-2 xl:grid-cols-3' : ''}`}>
      {properties.length === 0 ? (
        <div className="sm:col-span-2 xl:col-span-3 rounded-2xl border border-[#D5C3B6]/10 bg-[#2D3C3C] p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#5E8B8C]/10">
            <Building2 className="h-8 w-8 text-[#5E8B8C]/60" />
          </div>
          <h3 className="text-lg font-semibold text-[#FAF6F2] mb-2">Sin propiedades administradas</h3>
          <p className="text-sm text-[#9C8578] mb-6 max-w-sm mx-auto">
            Solicita un mandato a un propietario para comenzar a administrar sus propiedades.
          </p>
          <Link href="/broker/mandatos/nuevo">
            <Button className="bg-[#75524C] hover:bg-[#75524C]/90 text-[#FAF6F2]">
              <Plus className="h-4 w-4 mr-2" />
              Solicitar administración
            </Button>
          </Link>
        </div>
      ) : (
      properties.map((property) => {
          const ps = getPaymentStatus(property.payments)
          const pConf = paymentStatusLocal[ps]
          const accentColor = ps === 'PAID' ? '#5E8B8C' : ps === 'OVERDUE' ? '#C27F79' : '#F2C94C'
          const daysLeft = property.contractEnd
            ? Math.ceil((new Date(property.contractEnd).getTime() - Date.now()) / 86_400_000)
            : null
          const contractPct = property.contractStart && property.contractEnd
            ? Math.min(100, Math.max(0,
                ((Date.now() - new Date(property.contractStart).getTime()) /
                 (new Date(property.contractEnd).getTime() - new Date(property.contractStart).getTime())) * 100
              ))
            : null

          return (
            <Link
              key={property.id}
              href={`/broker/propiedades/${property.id}`}
              className="group flex flex-col rounded-2xl border border-[#D5C3B6]/10 bg-[#2D3C3C] overflow-hidden hover:border-[#5E8B8C]/30 transition-all duration-200"
            >
              <div className="h-1 w-full flex-shrink-0" style={{ backgroundColor: accentColor }} />

              <div className="flex flex-col gap-3 p-4 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#FAF6F2] truncate group-hover:text-white transition-colors text-sm">
                      {property.name || property.address}
                    </p>
                    <p className="text-xs text-[#9C8578] truncate mt-0.5 flex items-center gap-1">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {property.commune}
                    </p>
                  </div>
                  <Badge className={`shrink-0 text-[10px] px-1.5 py-0.5 ${pConf.badge}`}>
                    {pConf.label}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-[#1C1917]/60 px-2.5 py-2">
                    <p className="text-[9px] text-[#9C8578] uppercase tracking-wider mb-0.5">Propietario</p>
                    <p className="text-xs text-[#D5C3B6] truncate font-medium">
                      {property.landlord?.name || '—'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-[#1C1917]/60 px-2.5 py-2">
                    <p className="text-[9px] text-[#9C8578] uppercase tracking-wider mb-0.5">Arrendatario</p>
                    <p className="text-xs truncate font-medium">
                      {property.tenant?.name
                        ? <span className="text-[#D5C3B6]">{property.tenant.name}</span>
                        : <span className="text-[#9C8578] italic">Sin asignar</span>}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#FAF6F2] tabular-nums">
                    {property.monthlyRentCLP
                      ? `$${property.monthlyRentCLP.toLocaleString('es-CL')}`
                      : <span className="text-[#9C8578] font-normal text-xs">Sin renta</span>}
                  </span>
                  {property._count?.maintenance > 0 && (
                    <span className="flex items-center gap-1 text-[10px] text-[#F2C94C]">
                      <Wrench className="h-3 w-3" />
                      {property._count.maintenance}
                    </span>
                  )}
                </div>

                {contractPct !== null && (
                  <div>
                    <div className="h-1 w-full rounded-full bg-[#1C1917] overflow-hidden">
                      <div className="h-full rounded-full bg-[#5E8B8C]/50 transition-all"
                        style={{ width: `${contractPct}%` }} />
                    </div>
                    <p className="text-[9px] text-[#9C8578] mt-1">
                      {daysLeft !== null && daysLeft > 0 ? `Vence en ${daysLeft}d` : daysLeft === 0 ? 'Vence hoy' : 'Vencido'}
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t border-[#D5C3B6]/8 px-4 py-2.5 flex justify-end">
                <span className="text-xs text-[#5E8B8C] group-hover:text-[#8FC4C5] font-medium transition-colors">
                  Ver ficha →
                </span>
              </div>
            </Link>
          )
        })
      )}
    </div>
  )
}

export default async function BrokerPropiedadesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (session.user.role !== "BROKER" && session.user.role !== "OWNER") {
    redirect("/dashboard")
  }

  const { q } = await searchParams
  const propertiesCount = await prisma.mandate.count({
    where: {
      brokerId: session.user.id,
      status: "ACTIVE",
      ...(q
        ? {
            property: {
              OR: [
                { address: { contains: q, mode: "insensitive" } },
                { commune: { contains: q, mode: "insensitive" } },
                { tenant: { name: { contains: q, mode: "insensitive" } } },
                { landlord: { name: { contains: q, mode: "insensitive" } } },
              ],
            },
          }
        : {}),
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-[#FAF6F2]">Propiedades</h1>
          <p className="text-sm text-[#9C8578] mt-0.5">
            {propertiesCount > 0 ? `${propertiesCount} propiedades administradas` : 'Propiedades que administras'}
          </p>
        </div>
      </div>
      <SearchFilter placeholder="Buscar por dirección, comuna, propietario o arrendatario..." />

      <Suspense fallback={
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-[#2A2520] animate-pulse" />
          ))}
        </div>
      }>
        <BrokerPropertyList brokerId={session.user.id} searchQuery={q} />
      </Suspense>
    </div>
  )
}
