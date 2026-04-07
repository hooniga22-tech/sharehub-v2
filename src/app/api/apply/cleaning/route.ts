import { NextResponse } from 'next/server'
import { getSheetData, appendRow } from '@/lib/sheets'

export async function GET() {
  try {
    const rows = await getSheetData('방청소신청')
    return NextResponse.json(rows.map((r, i) => ({
      _rowIndex: i, id: r[0], name: r[1], phone: r[2],
      houseName: r[3], roomType: r[4], cleanDate: r[5],
      request: r[6], status: r[7] || '신청접수', createdAt: r[8],
    })))
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }) }
}

export async function POST(req: Request) {
  try {
    const b = await req.json()
    const id = `cleaning_${Date.now()}`
    await appendRow('방청소신청', [
      id, b.name, b.phone, b.houseName, b.roomType,
      b.cleanDate, b.request || '', '신청접수',
      new Date().toISOString().split('T')[0]
    ])
    return NextResponse.json({ ok: true, id })
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }) }
}
