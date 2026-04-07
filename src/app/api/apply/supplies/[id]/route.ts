import { NextResponse } from 'next/server'
import { getSheetData, updateRow } from '@/lib/sheets'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const rows = await getSheetData('비품신청')
    const idx = rows.findIndex(r => r[0] === id)
    if (idx === -1) return NextResponse.json({ error: 'not found' }, { status: 404 })
    const ex = rows[idx]
    const today = new Date().toISOString().split('T')[0]
    await updateRow('비품신청', idx, [
      ex[0], ex[1], ex[2], ex[3], ex[4], ex[5], ex[6],
      body.status ?? ex[7], ex[8],
      body.status === '처리완료' ? today : (ex[9] || ''),
    ])
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
