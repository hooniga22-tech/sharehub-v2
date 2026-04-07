import { NextResponse } from 'next/server'
import { getSheetData, updateRow } from '@/lib/sheets'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const rows = await getSheetData('납부')
    const rowIndex = rows.findIndex(r => r[0] === id)
    if (rowIndex === -1) return NextResponse.json({ error: 'not found' }, { status: 404 })

    const existing = rows[rowIndex]
    await updateRow('납부', rowIndex, [
      id,
      existing[1], existing[2], existing[3], existing[4],
      existing[5], existing[6], existing[7], existing[8],
      body.rentPaid !== undefined ? (body.rentPaid ? 'Y' : 'N') : existing[9],
      body.mgmtPaid !== undefined ? (body.mgmtPaid ? 'Y' : 'N') : existing[10],
      body.memo ?? existing[11],
    ])
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
