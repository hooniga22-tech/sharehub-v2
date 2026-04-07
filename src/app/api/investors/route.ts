import { NextResponse } from 'next/server'
import { getSheetData, appendRow } from '@/lib/sheets'

export async function GET() {
  try {
    const rows = await getSheetData('투자자')
    return NextResponse.json(rows.map((row, i) => ({
      _rowIndex: i,
      id: row[0], name: row[1], houseId: row[2],
      houseName: row[3], ratio: Number(row[4]) || 0,
      token: row[5], phone: row[6], memo: row[7],
      portalUrl: `https://sharehub-v2.vercel.app/investor/${row[5]}`
    })))
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const id = `inv_${Date.now()}`
    const token = Math.random().toString(36).slice(2, 10)
    const today = new Date().toISOString().split('T')[0]
    await appendRow('투자자', [
      id, body.name, body.houseId || '', body.houseName,
      body.ratio || 0, token, body.phone || '', body.memo || '', today
    ])
    return NextResponse.json({ ok: true, id, token,
      portalUrl: `https://sharehub-v2.vercel.app/investor/${token}` })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
