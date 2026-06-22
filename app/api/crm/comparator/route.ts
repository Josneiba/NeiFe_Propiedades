import { auth } from '@/lib/auth-session'
import { NextRequest, NextResponse } from 'next/server'
import { compareDeals, compareContacts, compareProperties, getMarketComparison, getDealComparisonReport } from '@/lib/comparator'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { type, ids, brokerId } = await request.json()

    if (!type || !ids || ids.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    let result

    switch (type) {
      case 'deals':
        result = await compareDeals(ids)
        break
      case 'contacts':
        result = await compareContacts(ids)
        break
      case 'properties':
        result = await compareProperties(ids)
        break
      case 'market':
        result = await getMarketComparison(ids[0])
        break
      default:
        return NextResponse.json({ error: 'Invalid comparison type' }, { status: 400 })
    }

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error('Comparison error:', error)
    return NextResponse.json(
      { error: 'Failed to generate comparison' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const ids = searchParams.get('ids')?.split(',') || []

    if (!type || ids.length === 0) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    let result

    switch (type) {
      case 'deals':
        result = await compareDeals(ids)
        break
      case 'contacts':
        result = await compareContacts(ids)
        break
      case 'properties':
        result = await compareProperties(ids)
        break
      case 'market':
        result = await getMarketComparison(ids[0])
        break
      case 'report':
        result = await getDealComparisonReport(session.user.id, ids)
        break
      default:
        return NextResponse.json({ error: 'Invalid comparison type' }, { status: 400 })
    }

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error('Comparison fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comparison' },
      { status: 500 }
    )
  }
}
