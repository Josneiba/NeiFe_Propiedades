import { auth } from "@/lib/auth-session"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ProveedoresClient } from "./proveedores-client"

export default async function ProveedoresPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (session.user.role !== "LANDLORD" && session.user.role !== "OWNER") {
    redirect("/mi-arriendo")
  }

  // Get all providers for this landlord
  const providers = await prisma.provider.findMany({
    where: {
      landlordId: session.user.id,
    },
    select: {
      id: true,
      name: true,
      specialty: true,
      phone: true,
      email: true,
      description: true,
      rating: true,
      _count: {
        select: {
          maintenance: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return <ProveedoresClient providers={providers as any} />
}
