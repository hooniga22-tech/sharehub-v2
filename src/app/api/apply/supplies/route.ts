import { NextResponse } from 'next/server'
import { getSheetData, appendRow } from '@/lib/sheets'

export async function GET() {
  try {
    const rows = await getSheetData('비품신청')
    return NextResponse.json(rows.map((r, i) => ({
      _rowIndex: i, id: r[0] || '', tenantId: r[1] || '',
      tenantName: r[2] || '', houseName: r[3] || '', roomCode: r[4] || '',
      items: r[5] || '', detail: r[6] || '',
      status: r[7] || '신청접수', createdAt: r[8] || '', processedAt: r[9] || '',
    })))
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const b = await req.json()
    const id = `supply_${Date.now()}`
    const today = new Date().toISOString().split('T')[0]
    await appendRow('비품신청', [
      id, b.tenantId || '', b.tenantName || '', b.houseName || '', b.roomCode || '',
      Array.isArray(b.items) ? b.items.join(', ') : (b.items || ''),
      b.detail || '', '신청접수', today, '',
    ])
    return NextResponse.json({ ok: true, id })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
