import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { listOrEmpty } from '@/lib/supabase/helpers'
import { kstYearMonth } from '@/lib/workers-helper'
import type { Worker, WorkerField, WorkerStatus, WorkerWithStats } from '@/types/worker'
import { requireAdmin } from '@/lib/auth-helpers'

function sbToWorker(w: any): Worker {
  return {
    id: w.id || '', name: w.name || '',
    field: (w.category === '수리' ? '수리' : '청소') as WorkerField,
    status: (w.is_active ? '활동중' : '만료') as WorkerStatus,
    phone: w.phone || '', bankName: '', accountNumber: '', holder: '', rrnHead: '',
    baseAmount: w.default_rate || 0, token: w.access_token || '', startDate: '', memo: w.memo || '',
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin(); if (auth.error) return auth.error
    const { id } = await params
    const supabase = createAdminClient()
    const { data: w, error } = await supabase.from('workers').select('*').eq('id', id).single()
    if (error || !w) return NextResponse.json({ error: 'not found' }, { status: 404 })

    const worker = sbToWorker(w)
    const ymPrefix = kstYearMonth()
    const [y, m] = ymPrefix.split('-')
    const startDate = `${y}-${m}-01`
    const nextMonth = Number(m) === 12 ? `${Number(y) + 1}-01-01` : `${y}-${String(Number(m) + 1).padStart(2, '0')}-01`
    const workRows = await listOrEmpty<any>(
      supabase.from('issues').select('cost').eq('worker_id', id).gte('scheduled_date', startDate).lt('scheduled_date', nextMonth)
    )
    const count = workRows.length
    const total = workRows.reduce((s: number, r: any) => s + (Number(r.cost) || 0), 0)
    const result: WorkerWithStats = { ...worker, thisMonthJobs: count, thisMonthTotal: total }
    return NextResponse.json(result)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin(); if (auth.error) return auth.error
    const { id } = await params
    const body = await req.json()
    const supabase = createAdminClient()

    const { data: w, error: fetchErr } = await supabase.from('workers').select('*').eq('id', id).single()
    if (fetchErr || !w) return NextResponse.json({ error: 'not found' }, { status: 404 })

    const update: Record<string, any> = {}
    if (body.name !== undefined) update.name = body.name
    if (body.phone !== undefined) update.phone = body.phone
    if (body.field !== undefined) update.category = body.field
    if (body.status !== undefined) update.is_active = body.status !== '만료'
    if (body.baseAmount !== undefined) update.default_rate = Number(body.baseAmount) || null
    if (body.memo !== undefined) update.memo = body.memo

    const { error: updateErr } = await supabase.from('workers').update(update).eq('id', id)
    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

    const base = sbToWorker(w)
    const merged = { ...base, ...body, id: base.id, token: base.token }
    return NextResponse.json(merged)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
