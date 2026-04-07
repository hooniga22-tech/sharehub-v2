import { NextResponse } from 'next/server'
import { getSheetData, appendRow } from '@/lib/sheets'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const year = searchParams.get('year')
    const month = searchParams.get('month')
    const houseName = searchParams.get('houseName')

    const rows = await getSheetData('운영지출')
    let items = rows.map((row, i) => ({
      _rowIndex: i,
      id: row[0] || '',
      houseName: row[1] || '',
      category: row[2] || '',
      content: row[3] || '',
      amount: Number(row[4]) || 0,
      assignee: row[5] || '',
      date: row[6] || '',
      year: Number(row[7]) || 0,
      month: Number(row[8]) || 0,
      memo: row[9] || '',
    }))

    if (year) items = items.filter(i => i.year === Number(year))
    if (month) items = items.filter(i => i.month === Number(month))
    if (houseName) items = items.filter(i => i.houseName === houseName)
    items = items.filter(i => i.memo !== '삭제됨' && i.amount > 0)

    return NextResponse.json(items)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const id = `opex_${Date.now()}`
    const date = body.date || new Date().toISOString().split('T')[0]
    const d = new Date(date)

    await appendRow('운영지출', [
      id, body.houseName || '', body.category || '', body.content || '',
      body.amount || 0, body.assignee || '', date,
      d.getFullYear(), d.getMonth() + 1, body.memo || '',
    ])
    return NextResponse.json({ ok: true, id })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
