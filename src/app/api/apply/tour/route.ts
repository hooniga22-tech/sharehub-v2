import { NextResponse } from 'next/server'
import { getSheetData, appendRow } from '@/lib/sheets'

export async function GET() {
  try {
    const rows = await getSheetData('투어신청')
    const apps = rows.map((row, i) => ({
      _rowIndex: i, id: row[0] || '', name: row[1] || '', phone: row[2] || '',
      gender: row[3] || '', region: row[4] || '', houseName: row[5] || '',
      roomType: row[6] || '', moveInDate: row[7] || '', contractPeriod: row[8] || '',
      tourDate: row[9] || '', tourTime: row[10] || '', inquiry: row[11] || '',
      feePaid: row[12] === 'Y', status: row[13] || '신청접수', createdAt: row[14] || '',
    }))
    return NextResponse.json(apps)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const id = `tour_${Date.now()}`
    const today = new Date().toISOString().split('T')[0]
    await appendRow('투어신청', [
      id, body.name || '', body.phone || '', body.gender || '',
      body.region || '', body.houseName || '', body.roomType || '',
      body.moveInDate || '', body.contractPeriod || '',
      body.tourDate || '', body.tourTime || '', body.inquiry || '',
      'N', '신청접수', today,
    ])
    return NextResponse.json({ ok: true, id })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
