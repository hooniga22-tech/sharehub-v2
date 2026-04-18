import { NextResponse } from 'next/server'
import { getSheetData, appendRow } from '@/lib/sheets'
import {
  STAFF_TAB, WORK_TAB,
  rowToWorker, workerToRow,
  kstYearMonth, aggregateMonthlyStats, sortWorkers,
  makeStaffId, makeToken,
} from '@/lib/workers-helper'
import type { Worker, WorkerWithStats, WorkerField, WorkerStatus } from '@/types/worker'

// GET /api/management/workers → WorkerWithStats[] (분야→이름 순 정렬)
export async function GET() {
  try {
    const [staffRows, workRows] = await Promise.all([
      getSheetData(STAFF_TAB),
      getSheetData(WORK_TAB),
    ])
    const workers = staffRows.map(rowToWorker)
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

// POST /api/management/workers → 신규 담당자 생성
// Body: Omit<Worker, "id" | "token">  (name 필수, 나머지 optional)
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const name = (body?.name || '').trim()
    if (!name) {
      return NextResponse.json({ error: 'name 필수' }, { status: 400 })
    }

    // 기존 ID/토큰 집합 (충돌 방지)
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
      id,
      name,
      field,
      status,
      phone: String(body?.phone || ''),
      bankName: String(body?.bankName || ''),
      accountNumber: String(body?.accountNumber || ''),
      holder: String(body?.holder || ''),
      rrnHead: String(body?.rrnHead || ''),
      baseAmount: Number(body?.baseAmount) || 0,
      token,
      startDate: String(body?.startDate || ''),
      memo: String(body?.memo || ''),
    }

    await appendRow(STAFF_TAB, workerToRow(newWorker))
    return NextResponse.json(newWorker, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
