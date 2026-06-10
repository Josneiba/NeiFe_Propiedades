// app/broker/cartera/page.tsx
// Stub - legacy cartera route (consolidated into dashboard)
import { redirect } from 'next/navigation'

export default function CarteraPage() {
  // Redirect to pagos which now shows consolidated portfolio
  redirect('/broker/pagos')
}
