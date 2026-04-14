import { NextResponse } from 'next/server'
import { getSheetData, updateRow } from '@/lib/sheets'

// POST /api/payments/bulk-confirm
// body: { items: [{ id, 납부액, 납부일 }] }
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const confirmItems: { id: string; 납부액: number; 납부일: string }[] = body.items || []
    if (confirmItems.length === 0) {
      return NextResponse.json({ error: 'no items' }, { status: 400 })
    }

    const rows = await getSheetData('수납')
    let updated = 0

    for (const item of confirmItems) {
      const rowIndex = rows.findIndex(r => r[0] === item.id)
      if (rowIndex === -1) continue
      const e = rows[rowIndex]
      await updateRow('수납', rowIndex, [
        e[0], e[1], e[2], e[3], e[4], e[5],
        e[6],
        item.납부액 ?? e[6],
        item.납부일 || e[8],
        '납부완료',
        e[10],
        e[11] || '',
      ])
      updated++
    }

    return NextResponse.json({ success: true, updated })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
