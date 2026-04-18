import { auth } from "@/lib/auth-session"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function forbiddenResponse() {
  return NextResponse.json(
    { error: "Acceso denegado" },
    { status: 403 }
  )
}

export async function getSessionUser() {
  const session = await auth()
  if (!session?.user?.email) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  })

  return user
}

export async function assertPropertyOwner(propertyId: string, userId: string) {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { landlordId: true },
  })

  if (!property || property.landlordId !== userId) {
    throw new Error("No eres propietario de esta propiedad")
  }

  return property
}

export async function assertPropertyAccess(propertyId: string, userId: string, userRole: string) {
  if (userRole === 'LANDLORD' || userRole === 'OWNER') {
    // El propietario siempre tiene acceso de lectura a sus propiedades
    return assertPropertyOwner(propertyId, userId)
  }
  if (userRole === 'BROKER') {
    // El corredor solo accede si tiene mandato activo
    return assertBrokerAccess(propertyId, userId)
  }
  throw new Error('Acceso denegado')
}

export async function assertBrokerAccess(propertyId: string, brokerId: string) {
  const property = await prisma.property.findFirst({
    where: {
      id: propertyId,
      OR: [
        { managedBy: brokerId },
        {
          mandates: {
            some: {
              brokerId,
              status: "ACTIVE",
            },
          },
        },
      ],
    },
    select: { id: true, managedBy: true },
  })

  if (!property) {
    throw new Error("No tienes acceso a esta propiedad")
  }

  return property
}

export async function assertPaymentOwner(paymentId: string, userId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      property: {
        select: { landlordId: true },
      },
    },
  })

  if (!payment || payment.property.landlordId !== userId) {
    throw new Error("No tienes permiso para este pago")
  }

  return payment
}

export async function assertTenantPayment(paymentId: string, userId: string) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      property: {
        select: { tenantId: true },
      },
    },
  })

  if (!payment || payment.property.tenantId !== userId) {
    throw new Error("No tienes permiso para este pago")
  }

  return payment
}

export async function assertMaintenanceAccess(
  requestId: string,
  userId: string,
  role: string
) {
  const request = await prisma.maintenanceRequest.findUnique({
    where: { id: requestId },
    include: {
      property: {
        select: { landlordId: true, tenantId: true },
      },
    },
  })

  if (!request) {
    throw new Error("Solicitud de mantenimiento no encontrada")
  }

  const isLandlord = request.property.landlordId === userId
  const isTenant = request.property.tenantId === userId

  if (role === "LANDLORD" && !isLandlord) {
    throw new Error("Solo el propietario puede acceder a esto")
  }

  if (role === "TENANT" && !isTenant) {
    throw new Error("Solo el arrendatario puede acceder a esto")
  }

  if (!isLandlord && !isTenant) {
    throw new Error("No tienes permiso para acceder a esto")
  }

  return request
}

export async function assertProviderOwner(providerId: string, userId: string) {
  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
    select: { landlordId: true },
  })

  if (!provider || provider.landlordId !== userId) {
    throw new Error("No eres propietario de este proveedor")
  }

  return provider
}
