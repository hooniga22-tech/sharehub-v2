import { NextResponse } from 'next/server'
import { getSheetData, appendRow } from '@/lib/sheets'

export async function GET() {
  try {
    const rows = await getSheetData('용역')
    // 헤더: ID[0] 날짜[1] 하우스명[2] 담당자[3] 종류[4] 비용[5] 메모[6] 완료여부[7]
    const workers = rows.map((row, index) => ({
      _rowIndex: index,
      id: row[0] || '',
      scheduledDate: row[1] || '',
      houseName: row[2] || '',
      name: row[3] || '',
      taskType: row[4] || '',
      payment: Number(row[5]) || 0,
      memo: row[6] || '',
      isDone: row[7] || 'N',
    }))
    return NextResponse.json(workers)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const id = `worker_${Date.now()}`
    const token = Math.random().toString(36).slice(2, 10)
    const today = new Date().toISOString().split('T')[0]
    // 헤더: ID[0] 날짜[1] 하우스명[2] 담당자[3] 종류[4] 비용[5] 메모[6] 완료여부[7]
    await appendRow('용역', [
      id,
      body.scheduledDate || today,
      body.houseName || '',
      body.name || '',
      body.taskType || '',
      body.payment || 0,
      body.memo || '',
      'N',
    ])
    return NextResponse.json({ ok: true, id, token })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
