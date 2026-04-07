import { NextResponse } from 'next/server'
import { getSheetData, updateRow } from '@/lib/sheets'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const rows = await getSheetData('투어신청')
    const idx = rows.findIndex(r => r[0] === id)
    if (idx === -1) return NextResponse.json({ error: 'not found' }, { status: 404 })
    const ex = rows[idx]
    await updateRow('투어신청', idx, [
      id, ex[1], ex[2], ex[3], ex[4], ex[5], ex[6], ex[7], ex[8], ex[9], ex[10], ex[11],
      body.feePaid !== undefined ? (body.feePaid ? 'Y' : 'N') : ex[12],
      body.status ?? ex[13], ex[14],
    ])
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
