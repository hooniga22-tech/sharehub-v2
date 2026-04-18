import { NextResponse } from 'next/server'
import { getSheetWithHeaders, colIdx, updateRow } from '@/lib/sheets'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { headers, rows } = await getSheetWithHeaders('용역담당자')
    const idCol = colIdx(headers, '담당자ID')
    const idx = rows.findIndex(r => r[idCol] === id)
    if (idx === -1) return NextResponse.json({ error: 'not found' }, { status: 404 })

    const updated: string[] = []
    for (let i = 0; i < headers.length; i++) updated[i] = rows[idx][i] || ''
    if (body.defaultAmount !== undefined) {
      const amtCol = colIdx(headers, '기본금액')
      if (amtCol >= 0) updated[amtCol] = String(body.defaultAmount)
    }
    await updateRow('용역담당자', idx, updated)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
