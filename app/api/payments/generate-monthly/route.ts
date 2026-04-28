import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth-session'
import { generateMonthlyPaymentsForPeriod } from '@/lib/monthly-payments'

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (session.user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Solo admin' }, { status: 403 })
  }

  try {
    const result = await generateMonthlyPaymentsForPeriod()
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Error generating monthly payments:', error)
    return NextResponse.json(
      { error: 'Error al generar pagos mensuales' },
      { status: 500 }
    )
  }
}
