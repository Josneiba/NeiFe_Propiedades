import { auth } from "@/lib/auth-session"
import { redirect } from "next/navigation"
import BrokerCalendarClient from "./client"

export default async function BrokerCalendarioPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (session.user.role !== "BROKER" && session.user.role !== "OWNER") {
    redirect("/dashboard")
  }

  return <BrokerCalendarClient />
}
