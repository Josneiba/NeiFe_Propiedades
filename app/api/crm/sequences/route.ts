import { auth } from '@/lib/auth-session'
import { NextRequest, NextResponse } from 'next/server'
import { getSequenceTemplates, startSequence, getDealSequences, pauseSequence, resumeSequence, cancelSequence, createSequenceTemplate } from '@/lib/deal-sequences'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const dealId = searchParams.get('dealId')

  try {
    if (dealId) {
      const sequences = await getDealSequences(dealId)
      return NextResponse.json({ sequences })
    }

    const templates = await getSequenceTemplates(session.user.id)
    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Sequence fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sequences' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { action, dealId, templateId, template } = await request.json()

    if (action === 'START') {
      const sequence = await startSequence(dealId, templateId, session.user.id)
      return NextResponse.json({ success: true, sequence })
    }

    if (action === 'CREATE_TEMPLATE') {
      const newTemplate = await createSequenceTemplate(session.user.id, template)
      return NextResponse.json({ success: true, template: newTemplate })
    }

    if (action === 'PAUSE') {
      const sequence = await pauseSequence(dealId)
      return NextResponse.json({ success: true, sequence })
    }

    if (action === 'RESUME') {
      const sequence = await resumeSequence(dealId)
      return NextResponse.json({ success: true, sequence })
    }

    if (action === 'CANCEL') {
      const sequence = await cancelSequence(dealId)
      return NextResponse.json({ success: true, sequence })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Sequence action error:', error)
    return NextResponse.json(
      { error: 'Failed to process sequence action' },
      { status: 500 }
    )
  }
}
