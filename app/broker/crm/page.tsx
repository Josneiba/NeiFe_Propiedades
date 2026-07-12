import { auth } from '@/lib/auth-session'
import { redirect } from 'next/navigation'

// Este era el "Centro CRM" viejo (embudo Pre-Venta/Venta/Post-Venta con cards
// separadas) — quedaba como una segunda pantalla-hub compitiendo con Mi Día
// (Indicadores Clave). Cualquier link o marcador viejo a /broker/crm ahora
// cae siempre en el mismo lugar: Mi Día. No se elimina el archivo por
// completo para no romper un link directo a esta URL — se redirige.
export default async function CrmIndexPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  redirect('/broker/crm/mi-dia')
}


