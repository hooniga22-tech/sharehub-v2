import { NextResponse } from 'next/server'
import { getSheetData, updateRow } from '@/lib/sheets'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const rows = await getSheetData('당번')
    const idx = rows.findIndex(r => r[0] === id)
    if (idx === -1) return NextResponse.json({ error: 'not found' }, { status: 404 })
    const ex = rows[idx]
    const isDone = body.isDone !== undefined ? (body.isDone ? 'Y' : 'N') : ex[7]
    const doneAt = body.isDone ? new Date().toISOString().split('T')[0] : ex[8]
    const hasFine = body.hasFine !== undefined ? (body.hasFine ? 'Y' : 'N') : ex[9]
    await updateRow('당번', idx, [
      id, ex[1], ex[2], ex[3], ex[4],
      ex[5], ex[6], isDone, doneAt, hasFine,
      body.note ?? ex[10],
    ])
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
