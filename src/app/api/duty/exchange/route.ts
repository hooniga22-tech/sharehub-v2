import { NextResponse } from 'next/server'
import { getSheetData, appendRow, updateRow } from '@/lib/sheets'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const tenantId = searchParams.get('tenantId')
    const rows = await getSheetData('당번교환')
    let exchanges = rows.map((row, i) => ({
      _rowIndex: i, id: row[0], houseName: row[1],
      requesterId: row[2], requesterName: row[3], requesterWeek: row[4],
      targetId: row[5], targetName: row[6], targetWeek: row[7],
      status: row[8] || '대기', createdAt: row[9],
    }))
    if (tenantId) exchanges = exchanges.filter(e => e.requesterId === tenantId || e.targetId === tenantId)
    return NextResponse.json(exchanges)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const id = `exc_${Date.now()}`
    await appendRow('당번교환', [
      id, body.houseName, body.requesterId, body.requesterName, body.requesterWeek,
      body.targetId, body.targetName, body.targetWeek, '대기',
      new Date().toISOString().split('T')[0],
    ])
    return NextResponse.json({ ok: true, id })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { exchangeId, action } = body
    const rows = await getSheetData('당번교환')
    const idx = rows.findIndex(r => r[0] === exchangeId)
    if (idx === -1) return NextResponse.json({ error: 'not found' }, { status: 404 })
    const ex = rows[idx]

    await updateRow('당번교환', idx, [
      ex[0], ex[1], ex[2], ex[3], ex[4], ex[5], ex[6], ex[7], action, ex[9],
    ])

    if (action === '수락') {
      const dutyRows = await getSheetData('당번')
      const ri = dutyRows.findIndex(r => r[2] === ex[2] && r[5] === ex[4])
      const ti = dutyRows.findIndex(r => r[2] === ex[5] && r[5] === ex[7])
      if (ri !== -1 && ti !== -1) {
        const rd = dutyRows[ri], td = dutyRows[ti]
        await updateRow('당번', ri, [rd[0], rd[1], td[2], td[3], td[4], rd[5], rd[6], rd[7], rd[8], rd[9], '교환완료'])
        await updateRow('당번', ti, [td[0], td[1], rd[2], rd[3], rd[4], td[5], td[6], td[7], td[8], td[9], '교환완료'])
      }
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
