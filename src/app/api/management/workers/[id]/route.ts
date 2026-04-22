import { NextResponse } from 'next/server'
import { getSheetData, updateRow } from '@/lib/sheets'
import { createAdminClient } from '@/lib/supabase/server'
import {
  STAFF_TAB, WORK_TAB,
  rowToWorker, workerToRow,
  kstYearMonth, aggregateMonthlyStats, mergePatch,
} from '@/lib/workers-helper'
import type { Worker, WorkerField, WorkerStatus, WorkerWithStats } from '@/types/worker'

// Supabase workers -> Worker 타입
function sbToWorker(w: any): Worker {
  return {
    id: w.id || '', name: w.name || '',
    field: (w.category === '수리' ? '수리' : '청소') as WorkerField,
    status: (w.is_active ? '활동중' : '만료') as WorkerStatus,
    phone: w.phone || '', bankName: '', accountNumber: '', holder: '', rrnHead: '',
    baseAmount: w.default_rate || 0, token: w.access_token || '', startDate: '', memo: w.memo || '',
  }
}

// GET /api/management/workers/[id]
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()
    const { data: w, error } = await supabase.from('workers').select('*').eq('id', id).single()
    if (error || !w) return NextResponse.json({ error: 'not found' }, { status: 404 })

    const worker = sbToWorker(w)
    const workRows = await getSheetData(WORK_TAB) // 용역 시트 (월간 실적, Step 4.3에서 전환 예정)
    const statsMap = aggregateMonthlyStats(workRows, kstYearMonth())
    const s = statsMap.get(worker.name) || { count: 0, total: 0 }
    const result: WorkerWithStats = { ...worker, thisMonthJobs: s.count, thisMonthTotal: s.total }
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
    const { id } = await params
    const body = await req.json()
    const supabase = createAdminClient()

    // 기존 데이터 조회
    const { data: w, error: fetchErr } = await supabase.from('workers').select('*').eq('id', id).single()
    if (fetchErr || !w) return NextResponse.json({ error: 'not found' }, { status: 404 })

    // Supabase 업데이트
    const update: Record<string, any> = {}
    if (body.name !== undefined) update.name = body.name
    if (body.phone !== undefined) update.phone = body.phone
    if (body.field !== undefined) update.category = body.field
    if (body.status !== undefined) update.is_active = body.status !== '만료'
    if (body.baseAmount !== undefined) update.default_rate = Number(body.baseAmount) || null
    if (body.memo !== undefined) update.memo = body.memo

    const { error: updateErr } = await supabase.from('workers').update(update).eq('id', id)
    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

    // 프론트엔드 기대 형식으로 응답
    const base = sbToWorker(w)
    const merged = { ...base, ...body, id: base.id, token: base.token }
    return NextResponse.json(merged)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
