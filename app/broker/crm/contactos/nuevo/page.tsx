import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { NewContactForm } from '@/components/broker/crm/new-contact-form'

export default async function NewContactPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  return <NewContactForm />
}
