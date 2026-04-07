import { NextResponse } from 'next/server'
import { getSheetData, appendRow } from '@/lib/sheets'

export async function GET() {
  try {
    const rows = await getSheetData('용역')
    const workers = rows.map((row, index) => ({
      _rowIndex: index,
      id: row[0] || '',
      name: row[1] || '',
      houseName: row[2] || '',
      taskType: row[3] || '',
      scheduledDate: row[4] || '',
      isDone: row[5] || 'N',
      payment: Number(row[6]) || 0,
      issueId: row[7] || '',
      memo: row[8] || '',
      token: row[9] || '',
      createdAt: row[10] || '',
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
    await appendRow('용역', [
      id,
      body.name || '',
      body.houseName || '',
      body.taskType || '',
      body.scheduledDate || '',
      'N',
      body.payment || 0,
      body.issueId || '',
      body.memo || '',
      token,
      today,
    ])
    return NextResponse.json({ ok: true, id, token })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
