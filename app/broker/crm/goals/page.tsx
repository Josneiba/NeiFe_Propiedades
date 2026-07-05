import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function GoalsPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  redirect('/broker/crm/mi-dia')
}
