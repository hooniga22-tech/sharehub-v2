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

// PATCH는 Step 4.4에서 전환 예정 - Sheets 유지
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = await req.json()
    const staffRows = await getSheetData(STAFF_TAB)
    const idx = staffRows.findIndex(r => r[0] === id)
    if (idx === -1) return NextResponse.json({ error: 'not found' }, { status: 404 })
    const base = rowToWorker(staffRows[idx])
    const merged = mergePatch(base, body || {})
    merged.id = base.id
    merged.token = base.token
    await updateRow(STAFF_TAB, idx, workerToRow(merged))
    return NextResponse.json(merged)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
