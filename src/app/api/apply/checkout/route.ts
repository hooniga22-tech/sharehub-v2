import { NextResponse } from 'next/server'
import { getSheetData, appendRow } from '@/lib/sheets'

export async function GET() {
  try {
    const rows = await getSheetData('퇴실신청')
    return NextResponse.json(rows.map((r, i) => ({
      _rowIndex: i, id: r[0], name: r[1], phone: r[2],
      houseName: r[3], roomCode: r[4], checkoutDate: r[5],
      refundAccount: r[6], reason: r[7], memo: r[8],
      status: r[9] || '신청접수', createdAt: r[10],
    })))
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }) }
}

export async function POST(req: Request) {
  try {
    const b = await req.json()
    const id = `checkout_${Date.now()}`
    await appendRow('퇴실신청', [
      id, b.name, b.phone, b.houseName, b.roomCode,
      b.checkoutDate, b.refundAccount, b.reason || '계약만료',
      b.memo || '', '신청접수', new Date().toISOString().split('T')[0]
    ])
    return NextResponse.json({ ok: true, id })
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }) }
}
