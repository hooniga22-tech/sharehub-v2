import { NextResponse } from 'next/server'
import { getSheetData, updateRow, deleteRow } from '@/lib/sheets'

const SHEET_MAP: Record<string, { sheet: string; statusCol: number; cols: number }> = {
  tour: { sheet: '투어신청', statusCol: 13, cols: 15 },
  cleaning: { sheet: '방청소신청', statusCol: 7, cols: 9 },
  aircon: { sheet: '에어컨신청', statusCol: 9, cols: 11 },
  checkout: { sheet: '퇴실신청', statusCol: 6, cols: 23 },
  supplies: { sheet: '비품신청', statusCol: 7, cols: 10 },
}

// PUT: update status
export async function PUT(req: Request) {
  try {
    const { type, id, status } = await req.json()
    const cfg = SHEET_MAP[type]
    if (!cfg) return NextResponse.json({ error: 'unknown type' }, { status: 400 })

    const rows = await getSheetData(cfg.sheet)
    const idx = rows.findIndex(r => r[0] === id)
    if (idx === -1) return NextResponse.json({ error: 'not found' }, { status: 404 })

    const row = [...rows[idx]]
    while (row.length < cfg.cols) row.push('')
    if (status) row[cfg.statusCol] = status

    await updateRow(cfg.sheet, idx, row)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// DELETE: remove row
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const id = searchParams.get('id')
    if (!type || !id) return NextResponse.json({ error: 'missing params' }, { status: 400 })

    const cfg = SHEET_MAP[type]
    if (!cfg) return NextResponse.json({ error: 'unknown type' }, { status: 400 })

    const rows = await getSheetData(cfg.sheet)
    const idx = rows.findIndex(r => r[0] === id)
    if (idx === -1) return NextResponse.json({ error: 'not found' }, { status: 404 })

    await deleteRow(cfg.sheet, idx)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
