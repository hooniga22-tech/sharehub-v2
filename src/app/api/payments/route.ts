import { NextResponse } from 'next/server'
import { getSheetData, appendRow } from '@/lib/sheets'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const tenantId = searchParams.get('tenantId')
    const rows = await getSheetData('납부')
    let payments = rows.map((row, index) => ({
      _rowIndex: index,
      id: row[0] || '',
      tenantId: row[1] || '',
      tenantName: row[2] || '',
      houseName: row[3] || '',
      roomCode: row[4] || '',
      type: row[5] || '',
      dueDate: row[6] || '',
      rent: Number(row[7]) || 0,
      mgmtFee: Number(row[8]) || 0,
      rentPaid: row[9] === 'Y',
      mgmtPaid: row[10] === 'Y',
      memo: row[11] || '',
    }))
    if (tenantId) payments = payments.filter(p => p.tenantId === tenantId)
    payments.sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    return NextResponse.json(payments)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// POST: 타임라인 자동 생성
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { tenantId, tenantName, houseName, roomCode, rent, mgmtFee, startDate, endDate } = body

    if (!tenantId || !startDate || !endDate) {
      return NextResponse.json({ error: 'missing fields' }, { status: 400 })
    }

    // 기존 납부 데이터 확인
    const existing = await getSheetData('납부')
    const alreadyExists = existing.some(r => r[1] === tenantId)
    if (alreadyExists) {
      return NextResponse.json({ error: 'already exists', message: '이미 납부 타임라인이 생성되어 있습니다.' }, { status: 409 })
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    const records: (string | number)[][] = []

    // 1. 계약금 (입주일)
    records.push([
      `pay_${Date.now()}_0`, tenantId, tenantName, houseName, roomCode,
      '계약금', startDate, 0, 0, 'N', 'N', '보증금 납부',
    ])

    // 2. 잔금+첫달 (입주일)
    records.push([
      `pay_${Date.now()}_1`, tenantId, tenantName, houseName, roomCode,
      '잔금+첫달', startDate, rent, mgmtFee, 'N', 'N', '',
    ])

    // 3. 월별 정기납부 (입주 다음달 1일부터 종료 전월까지)
    const cur = new Date(start.getFullYear(), start.getMonth() + 1, 1)
    const lastMonth = new Date(end.getFullYear(), end.getMonth(), 1)
    let idx = 2
    while (cur < lastMonth) {
      const m = cur.getMonth() + 1
      const dueDate = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}-01`
      records.push([
        `pay_${Date.now()}_${idx}`, tenantId, tenantName, houseName, roomCode,
        `${m}월 정기납부`, dueDate, rent, mgmtFee, 'N', 'N', '',
      ])
      cur.setMonth(cur.getMonth() + 1)
      idx++
    }

    // 4. 마지막달
    const lastDue = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-01`
    records.push([
      `pay_${Date.now()}_${idx}`, tenantId, tenantName, houseName, roomCode,
      '마지막달', lastDue, rent, mgmtFee, 'N', 'N', '',
    ])

    // Batch append
    for (const row of records) {
      await appendRow('납부', row)
    }

    return NextResponse.json({ ok: true, count: records.length })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
