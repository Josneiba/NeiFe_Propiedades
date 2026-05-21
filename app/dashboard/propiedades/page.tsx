import { auth } from "@/lib/auth-session"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/ui/page-header"
import { SearchFilter } from "@/components/ui/search-filter"
import { PropertyCard } from "@/components/properties/property-card"
import { Building2, Plus } from "lucide-react"
import Link from "next/link"
import { paymentStatusConfig } from "@/lib/status-config"
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

interface PropertyWithPaymentStatus {
  id: string
  name: string
  address: string
  commune: string
  monthlyRentCLP: number | null
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
    broker?: { name: string | null }
  }>
  photos?: Array<{
    url: string
    order: number
  }>
  _count: {
    maintenance: number
  }
}

async function OwnerPropertyList({ landlordId, searchQuery }: { landlordId: string; searchQuery?: string }) {
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()

  const properties = (await prisma.property.findMany({
    where: {
      landlordId,
      isActive: true,
      ...(searchQuery
        ? {
            OR: [
              { address: { contains: searchQuery, mode: "insensitive" } },
              { commune: { contains: searchQuery, mode: "insensitive" } },
              { name: { contains: searchQuery, mode: "insensitive" } },
              { tenant: { name: { contains: searchQuery, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      tenant: {
        select: {
          name: true,
          email: true,
        },
      },
      mandates: {
        where: {
          status: "ACTIVE",
        },
        select: {
          id: true,
          broker: { select: { name: true } },
        },
        take: 1,
        orderBy: {
          createdAt: "desc",
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
      photos: {
        select: { url: true, order: true },
        orderBy: { order: "asc" },
        take: 1,
      },
      _count: {
        select: {
          maintenance: {
            where: {
              status: {
                in: ["REQUESTED", "REVIEWING", "APPROVED", "IN_PROGRESS"],
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })) as PropertyWithPaymentStatus[]

  const getPaymentStatus = (payments: Array<{ status: string }>) => {
    const payment = payments[0]
    if (!payment) return "pending"
    const statusMap: Record<string, "paid" | "pending" | "overdue"> = {
      PAID: "paid",
      PENDING: "pending",
      OVERDUE: "overdue",
      PROCESSING: "pending",
      CANCELLED: "pending",
    }
    return statusMap[payment.status] || "pending"
  }

  const statusConfig = {
    paid: paymentStatusConfig.PAID,
    pending: paymentStatusConfig.PENDING,
    overdue: paymentStatusConfig.OVERDUE,
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {properties.length === 0 ? (
        <Card className="bg-[#2D3C3C] border-[#D5C3B6]/10">
          <CardContent className="p-16 text-center">
            <div className="w-24 h-24 rounded-full bg-[#5E8B8C]/20 flex items-center justify-center mx-auto mb-6">
              <Building2 className="h-12 w-12 text-[#5E8B8C]" />
            </div>
            <h3 className="text-2xl font-semibold text-[#FAF6F2] mb-3">
              Aún no tienes propiedades registradas
            </h3>
            <p className="text-[#9C8578] mb-8 max-w-md mx-auto">
              Agrega tu primera propiedad para comenzar a gestionar arriendos, pagos y mantenciones.
            </p>
            <Button
              className="bg-[#75524C] hover:bg-[#75524C]/90 text-[#D5C3B6] px-8 py-3 text-base font-medium"
              asChild
            >
              <Link href="/dashboard/propiedades/nueva">
                <Plus className="h-5 w-5 mr-2" />
                Agregar propiedad
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        properties.map((property) => {
          const paymentStatus = getPaymentStatus(property.payments)

          return (
            <PropertyCard
              key={property.id}
              property={property}
              statusConfig={statusConfig}
              isManagedByBroker={Boolean(property.mandates[0])}
            />
          )
        })
      )}
    </div>
  )
}

export default async function PropiedadesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (session.user.role !== "LANDLORD" && session.user.role !== "OWNER") {
    redirect("/mi-arriendo")
  }

  const { q } = await searchParams

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <PageHeader
          title="Mis Propiedades"
          description="Todas tus propiedades en arriendo"
          action={
            <Button className="bg-[#75524C] hover:bg-[#75524C]/90 text-[#FAF6F2]" asChild>
              <Link href="/dashboard/propiedades/nueva">
                <Plus className="h-4 w-4 mr-2" />
                Nueva propiedad
              </Link>
            </Button>
          }
        />
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchFilter placeholder="Buscar por direccion, comuna o arrendatario..." />
          </div>
        </div>
      </div>

      <Suspense fallback={
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 rounded-xl bg-[#2A2520] animate-pulse" />
          ))}
        </div>
      }>
        <OwnerPropertyList landlordId={session.user.id} searchQuery={q} />
      </Suspense>
    </div>
  )
}
