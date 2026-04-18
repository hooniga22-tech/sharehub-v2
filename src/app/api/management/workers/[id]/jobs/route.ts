import { NextResponse } from 'next/server'
import { getSheetData } from '@/lib/sheets'
import { STAFF_TAB, WORK_TAB, rowToWorker } from '@/lib/workers-helper'
import type { WorkerJob } from '@/types/worker'

// GET /api/management/workers/[id]/jobs?limit=3
//   limit: 숫자 (기본 3) 또는 "all" (전체)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const limitRaw = searchParams.get('limit')
    const limit: number | 'all' =
      limitRaw === 'all' ? 'all' : (Number(limitRaw) || 3)

    const [staffRows, workRows] = await Promise.all([
      getSheetData(STAFF_TAB),
      getSheetData(WORK_TAB),
    ])
    const staffRow = staffRows.find(r => r[0] === id)
    if (!staffRow) {
      return NextResponse.json({ error: 'not found' }, { status: 404 })
    }
    const worker = rowToWorker(staffRow)
    const name = worker.name

    // 용역 시트: [0]용역ID [1]예정일 [2]지점명 [3]담당자명 [4]작업종류 [5]정산금액 [6]메모 [7]완료여부
    const filtered = workRows.filter(r => ((r[3] as string) || '').trim() === name)
    filtered.sort((a, b) => ((b[1] as string) || '').localeCompare((a[1] as string) || ''))

    const sliced = limit === 'all' ? filtered : filtered.slice(0, limit)
    const jobs: WorkerJob[] = sliced.map(r => ({
      id: r[0] || '',
      date: r[1] || '',
      site: r[2] || '',
      task: r[4] || '',
      amount: Number(r[5]) || 0,
    }))
    return NextResponse.json(jobs)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
