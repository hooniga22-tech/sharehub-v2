import { NextRequest, NextResponse } from 'next/server'
import { getSheetData, appendRow, updateRow } from '@/lib/sheets'

export async function GET(req: NextRequest) {
  const sheet = req.nextUrl.searchParams.get('sheet')
  if (!sheet) return NextResponse.json({ error: 'sheet param required' }, { status: 400 })

  try {
    const rows = await getSheetData(sheet)
    return NextResponse.json({ data: rows })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { sheet, row } = body
    if (!sheet || !row) return NextResponse.json({ error: 'sheet and row required' }, { status: 400 })
    await appendRow(sheet, row)
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { sheet, rowIndex, row } = body
    if (!sheet || rowIndex == null || !row) return NextResponse.json({ error: 'sheet, rowIndex, row required' }, { status: 400 })
    await updateRow(sheet, rowIndex, row)
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
