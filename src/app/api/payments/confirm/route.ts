import { NextResponse } from 'next/server'
import { getSheetData, updateRow, appendRow } from '@/lib/sheets'

interface ConfirmItem {
  tenantId: string
  tenantName: string
  houseName: string
  roomCode: string
  amount: number
  date: string
  type: string // 월세, 공과금, etc.
  method: string // 자동매칭, 수동연결
}

export async function POST(req: Request) {
  try {
    const { items, month } = await req.json() as { items: ConfirmItem[]; month: string }
    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'no items' }, { status: 400 })
    }

    // Get existing payment rows
    const paymentRows = await getSheetData('납부')

    let confirmed = 0
    for (const item of items) {
      // Find existing payment row for this tenant + month
      const rowIndex = paymentRows.findIndex(r =>
        r[1] === item.tenantId &&
        (r[6] || '').startsWith(month)
      )

      if (rowIndex >= 0) {
        // Update existing row
        const existing = paymentRows[rowIndex]
        await updateRow('납부', rowIndex, [
          existing[0], existing[1], existing[2], existing[3], existing[4],
          existing[5], existing[6], existing[7], existing[8],
          'Y', // rentPaid
          existing[10],
          `${item.method} · ${item.date}`,
        ])
      } else {
        // Create new row
        await appendRow('납부', [
          `pay_${Date.now()}_${confirmed}`,
          item.tenantId,
          item.tenantName,
          item.houseName,
          item.roomCode,
          item.type || '월세',
          `${month}-01`,
          item.amount,
          0,
          'Y',
          'N',
          `${item.method} · ${item.date}`,
        ])
      }
      confirmed++
    }

    return NextResponse.json({ ok: true, confirmed })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
