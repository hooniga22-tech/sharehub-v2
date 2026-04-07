import { NextResponse } from 'next/server'
import { getSheetData, updateRow } from '@/lib/sheets'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const rows = await getSheetData('용역')
    const rowIndex = rows.findIndex(r => r[0] === id)
    if (rowIndex === -1) return NextResponse.json({ error: 'not found' }, { status: 404 })
    const existing = rows[rowIndex]
    await updateRow('용역', rowIndex, [
      id,
      body.name ?? existing[1],
      body.houseName ?? existing[2],
      body.taskType ?? existing[3],
      body.scheduledDate ?? existing[4],
      body.isDone ?? existing[5],
      body.payment ?? existing[6],
      body.issueId ?? existing[7],
      body.memo ?? existing[8],
      existing[9],
      existing[10],
    ])
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
