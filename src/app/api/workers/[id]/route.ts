import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const supabase = createAdminClient()

    const update: Record<string, any> = {}
    if (body.scheduledDate !== undefined) update.scheduled_date = body.scheduledDate || null
    if (body.houseName !== undefined) {
      const { data: b } = await supabase.from('branches').select('id').eq('name', body.houseName).limit(1).single()
      if (b) update.branch_id = b.id
    }
    if (body.taskType !== undefined) update.category = body.taskType
    if (body.isDone !== undefined) {
      update.status = (body.isDone === true || body.isDone === 'Y') ? 'done' : 'pending'
      if (update.status === 'done') update.completed_date = new Date().toISOString().slice(0, 10)
    }
    if (body.payment !== undefined) update.cost = Number(body.payment) || null
    if (body.memo !== undefined) update.memo = body.memo

    const { error } = await supabase.from('issues').update(update).eq('id', id)
    if (error) return NextResponse.json({ error: 'not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
