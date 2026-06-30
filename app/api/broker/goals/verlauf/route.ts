import { auth } from '@/lib/auth-session'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { getCurrentYear, getCurrentWeekNumber, getISOWeekRange, getRealProgressForRange } from '@/lib/goal-engine'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== 'BROKER') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const brokerId = session.user.id
  const year = getCurrentYear()
  const currentWeek = getCurrentWeekNumber()

  const weeks = Array.from({ length: 12 }, (_, index) => currentWeek - (11 - index))
    .map((week) => {
      const weekOffset = week <= 0 ? week + 52 : week
      return { week: weekOffset, year: week <= 0 ? year - 1 : year }
    })

  const data = await Promise.all(
    weeks.map(async ({ week, year: weekYear }) => {
      const { start, end } = getISOWeekRange(week, weekYear)
      const totalContacts = await getRealProgressForRange(brokerId, 'CONTACTS', start, end)
      const totalVisits = await getRealProgressForRange(brokerId, 'VISITS', start, end)
      return {
        week,
        year: weekYear,
        contacts: totalContacts,
        visits: totalVisits,
      }
    }),
  )

  return NextResponse.json({ data })
}
