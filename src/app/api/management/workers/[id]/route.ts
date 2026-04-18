import { NextResponse } from 'next/server'
import { getSheetData, updateRow } from '@/lib/sheets'
import {
  STAFF_TAB, WORK_TAB,
  rowToWorker, workerToRow,
  kstYearMonth, aggregateMonthlyStats, mergePatch,
} from '@/lib/workers-helper'
import type { WorkerWithStats } from '@/types/worker'

// GET /api/management/workers/[id]
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const [staffRows, workRows] = await Promise.all([
      getSheetData(STAFF_TAB),
      getSheetData(WORK_TAB),
    ])
    const idx = staffRows.findIndex(r => r[0] === id)
    if (idx === -1) {
      return NextResponse.json({ error: 'not found' }, { status: 404 })
    }
    const worker = rowToWorker(staffRows[idx])
    const statsMap = aggregateMonthlyStats(workRows, kstYearMonth())
    const s = statsMap.get(worker.name) || { count: 0, total: 0 }
    const result: WorkerWithStats = { ...worker, thisMonthJobs: s.count, thisMonthTotal: s.total }
    return NextResponse.json(result)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// PATCH /api/management/workers/[id]
// Body: Partial<Worker> (id, token 무시)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body = await req.json()

    const staffRows = await getSheetData(STAFF_TAB)
    const idx = staffRows.findIndex(r => r[0] === id)
    if (idx === -1) {
      return NextResponse.json({ error: 'not found' }, { status: 404 })
    }

    const base = rowToWorker(staffRows[idx])
    const merged = mergePatch(base, body || {})
    // id, token은 mergePatch에서 제외됨 → 원본 유지
    merged.id = base.id
    merged.token = base.token

    await updateRow(STAFF_TAB, idx, workerToRow(merged))

    return NextResponse.json(merged)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
