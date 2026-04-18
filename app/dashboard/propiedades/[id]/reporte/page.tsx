import { auth } from '@/lib/auth-session'
import { redirect } from 'next/navigation'
import ReportPageClient from './client'

interface ReporteProps {
  params: Promise<{ id: string }>
}

export default async function ReportePage({ params }: ReporteProps) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { id: propertyId } = await params

  return <ReportPageClient propertyId={propertyId} session={session} />
}
