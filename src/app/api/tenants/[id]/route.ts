import { NextResponse } from 'next/server'
import { getSheetData, updateRow } from '@/lib/sheets'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const rows = await getSheetData('입주자')
    const row = rows.find(r => r[0] === id)
    if (!row) return NextResponse.json({ error: 'not found' }, { status: 404 })
    return NextResponse.json({
      id: row[0], roomId: row[1], houseName: row[2], roomCode: row[3],
      name: row[4], phone: row[5],
      rent: Number(row[6]) || 0, managementFee: Number(row[7]) || 0, deposit: Number(row[8]) || 0,
      startDate: row[9], endDate: row[10], status: row[11],
      nationality: row[12], memo: row[13], token: row[14],
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const rows = await getSheetData('입주자')
    const rowIndex = rows.findIndex(r => r[0] === id)
    if (rowIndex === -1) return NextResponse.json({ error: 'not found' }, { status: 404 })
    const existing = rows[rowIndex]
    await updateRow('입주자', rowIndex, [
      id,
      existing[1],
      body.houseName ?? existing[2],
      body.roomCode ?? existing[3],
      body.name ?? existing[4],
      body.phone ?? existing[5],
      body.rent ?? existing[6],
      body.managementFee ?? existing[7],
      body.deposit ?? existing[8],
      body.startDate ?? existing[9],
      body.endDate ?? existing[10],
      body.status ?? existing[11],
      body.nationality ?? existing[12],
      body.memo ?? existing[13],
      existing[14],
    ])
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
