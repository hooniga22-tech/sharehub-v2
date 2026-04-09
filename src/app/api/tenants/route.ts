import { NextResponse } from 'next/server'
import { getSheetData, appendRow } from '@/lib/sheets'

export async function GET() {
  try {
    const rows = await getSheetData('입주자')
    return NextResponse.json(rows.map((r, i) => ({
      _rowIndex: i, id: r[0] || '', roomId: r[1] || '', houseName: r[2] || '',
      roomCode: r[3] || '', name: r[4] || '', phone: r[5] || '',
      rent: Number(r[6]) || 0, managementFee: Number(r[7]) || 0,
      deposit: Number(r[8]) || 0, startDate: r[9] || '', endDate: r[10] || '',
      status: r[11] || '', nationality: r[12] || '', memo: r[13] || '', token: r[14] || '',
    })))
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const id = `tenant_${Date.now()}`
    const token = Math.random().toString(36).slice(2, 10)
    await appendRow('입주자', [
      id,
      body.roomId || '',
      body.houseName || '',
      body.roomCode || '',
      body.name || '',
      body.phone || '',
      body.rent || 0,
      body.managementFee || 0,
      body.deposit || 0,
      body.startDate || '',
      body.endDate || '',
      body.status || '입주중',
      body.nationality || '',
      body.memo || '',
      token,
    ])
    return NextResponse.json({ ok: true, id, token })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
