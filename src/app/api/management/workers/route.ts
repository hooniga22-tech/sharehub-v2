import { NextResponse } from 'next/server'
import { getSheetData, appendRow } from '@/lib/sheets'
import { createAdminClient } from '@/lib/supabase/server'
import { listOrEmpty } from '@/lib/supabase/helpers'
import {
  STAFF_TAB, WORK_TAB,
  workerToRow,
  kstYearMonth, aggregateMonthlyStats, sortWorkers,
  makeStaffId, makeToken,
} from '@/lib/workers-helper'
import type { Worker, WorkerWithStats, WorkerField, WorkerStatus } from '@/types/worker'

// Supabase workers -> Worker 타입 변환
function sbToWorker(w: any): Worker {
  return {
    id: w.id || '',
    name: w.name || '',
    field: (w.category === '수리' ? '수리' : '청소') as WorkerField,
    status: (w.is_active ? '활동중' : '만료') as WorkerStatus,
    phone: w.phone || '',
    bankName: '',
    accountNumber: '',
    holder: '',
    rrnHead: '',
    baseAmount: w.default_rate || 0,
    token: w.access_token || '',
    startDate: '',
    memo: w.memo || '',
  }
}

// GET /api/management/workers -> WorkerWithStats[]
export async function GET() {
  try {
    const supabase = createAdminClient()
    const [sbWorkers, workRows] = await Promise.all([
      listOrEmpty<any>(supabase.from('workers').select('*')),
      getSheetData(WORK_TAB), // 용역 시트 (월간 실적 집계용, Step 4.3에서 전환 예정)
    ])

    const workers = sbWorkers.map(sbToWorker)
    const ymPrefix = kstYearMonth()
    const statsMap = aggregateMonthlyStats(workRows, ymPrefix)

    const withStats: WorkerWithStats[] = workers.map(w => {
      const s = statsMap.get(w.name) || { count: 0, total: 0 }
      return { ...w, thisMonthJobs: s.count, thisMonthTotal: s.total }
    })
    const sorted = sortWorkers(withStats)
    return NextResponse.json(sorted)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// POST는 Step 4.4에서 전환 예정 - Sheets 유지
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const name = (body?.name || '').trim()
    if (!name) return NextResponse.json({ error: 'name 필수' }, { status: 400 })

    const staffRows = await getSheetData(STAFF_TAB)
    const existingIds = new Set<string>()
    const existingTokens = new Set<string>()
    for (const r of staffRows) {
      if (r[0]) existingIds.add(r[0])
      if (r[10]) existingTokens.add(r[10])
    }

    const id = makeStaffId(existingIds)
    const token = makeToken(existingTokens)
    const field: WorkerField = (body?.field === '수리' ? '수리' : '청소')
    const status: WorkerStatus = (body?.status === '만료' ? '만료' : '활동중')

    const newWorker: Worker = {
      id, name, field, status,
      phone: String(body?.phone || ''), bankName: String(body?.bankName || ''),
      accountNumber: String(body?.accountNumber || ''), holder: String(body?.holder || ''),
      rrnHead: String(body?.rrnHead || ''), baseAmount: Number(body?.baseAmount) || 0,
      token, startDate: String(body?.startDate || ''), memo: String(body?.memo || ''),
    }
    await appendRow(STAFF_TAB, workerToRow(newWorker))
    return NextResponse.json(newWorker, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
