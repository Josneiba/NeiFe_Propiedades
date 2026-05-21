import { auth } from "@/lib/auth-session"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { SearchFilter } from "@/components/ui/search-filter"
import { PropertyCard } from "@/components/properties/property-card"
import { Building2, Plus } from "lucide-react"
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
  photos?: Array<{
    url: string
    order: number
  }>
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
          photos: {
            select: {
              url: true,
              order: true,
            },
            orderBy: {
              order: 'asc',
            },
            take: 1,
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
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
          return (
            <PropertyCard
              key={property.id}
              href={`/broker/propiedades/${property.id}`}
              property={property}
              statusConfig={{
                PAID: { label: paymentStatusLocal.PAID.label, className: paymentStatusLocal.PAID.badge },
                PENDING: { label: paymentStatusLocal.PENDING.label, className: paymentStatusLocal.PENDING.badge },
                OVERDUE: { label: paymentStatusLocal.OVERDUE.label, className: paymentStatusLocal.OVERDUE.badge },
                PROCESSING: { label: paymentStatusLocal.PROCESSING.label, className: paymentStatusLocal.PROCESSING.badge },
                CANCELLED: { label: paymentStatusLocal.CANCELLED.label, className: paymentStatusLocal.CANCELLED.badge },
              }}
              isManagedByBroker={false}
              footerLabel="Ver detalle →"
              ownerLabel="Propietario"
            />
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
    <div className="max-w-7xl space-y-6">
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
