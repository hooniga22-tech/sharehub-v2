import { NextResponse } from 'next/server'
import { getSheetData, appendRow } from '@/lib/sheets'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const houseName = searchParams.get('houseName')
    const tenantId = searchParams.get('tenantId')
    const rows = await getSheetData('당번')
    let duties = rows.map((row, i) => ({
      _rowIndex: i, id: row[0] || '', houseName: row[1] || '',
      tenantId: row[2] || '', tenantName: row[3] || '', roomCode: row[4] || '',
      weekStart: row[5] || '', weekEnd: row[6] || '',
      isDone: row[7] === 'Y', doneAt: row[8] || '',
      hasFine: row[9] === 'Y', note: row[10] || '',
    }))
    if (houseName) duties = duties.filter(d => d.houseName === houseName)
    if (tenantId) duties = duties.filter(d => d.tenantId === tenantId)
    return NextResponse.json(duties)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const id = `duty_${Date.now()}`
    await appendRow('당번', [
      id, body.houseName || '', body.tenantId || '', body.tenantName || '',
      body.roomCode || '', body.weekStart || '', body.weekEnd || '',
      'N', '', 'N', body.note || '',
    ])
    return NextResponse.json({ ok: true, id })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
