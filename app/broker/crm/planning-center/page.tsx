import { auth } from '@/lib/auth-session'
import { redirect } from 'next/navigation'

// Segunda pantalla-hub vieja ("Centro de Planificación Comercial"), huérfana
// — ningún link del código apunta acá, pero se deja la ruta viva por si
// quedó algún marcador guardado, redirigiendo también a Mi Día en vez de
// mostrar contenido desactualizado.
export default async function PlanningCenterIndexPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  redirect('/broker/crm/mi-dia')
}

