import { NextResponse } from 'next/server'
import { getSheetData, appendRow, updateRow } from '@/lib/sheets'

// 수납 시트 컬럼 (12열)
// [0]수납ID [1]입주자ID [2]지점명 [3]방코드 [4]이름
// [5]연월 [6]청구액 [7]납부액 [8]납부일 [9]상태 [10]납부방법 [11]메모

function rowToPayment(r: string[]) {
  return {
    수납ID: r[0] || '',
    입주자ID: r[1] || '',
    지점명: r[2] || '',
    방코드: r[3] || '',
    이름: r[4] || '',
    연월: r[5] || '',
    청구액: r[6] || '',
    납부액: r[7] || '',
    납부일: r[8] || '',
    상태: r[9] || '미납',
    납부방법: r[10] || '',
    메모: r[11] || '',
  }
}

// GET /api/payments
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const tenantId = searchParams.get('tenantId')
    const year = searchParams.get('year')
    const month = searchParams.get('month')

    const rows = await getSheetData('수납')
    let payments = rows.map(r => rowToPayment(r))

    if (tenantId) payments = payments.filter(p => p.입주자ID === tenantId)
    if (year && month) {
      const ym = `${year}-${month.padStart(2, '0')}`
      payments = payments.filter(p => p.연월 === ym)
    } else if (year) {
      payments = payments.filter(p => p.연월.startsWith(year))
    }

    const total = payments.length
    const paid = payments.filter(p => p.상태 === '납부완료').length
    const partial = payments.filter(p => p.상태 === '부분납부').length
    const unpaid = total - paid - partial
    const paidAmount = payments.filter(p => p.상태 === '납부완료').reduce((s, p) => s + (Number(p.청구액) || 0), 0)
    const unpaidAmount = payments.filter(p => p.상태 !== '납부완료').reduce((s, p) => s + (Number(p.청구액) || 0) - (Number(p.납부액) || 0), 0)
    const paidRate = total > 0 ? Math.round((paid / total) * 1000) / 10 : 0

    return NextResponse.json({
      items: payments,
      summary: { total, paid, unpaid, partial, paidRate, paidAmount, unpaidAmount },
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// POST /api/payments
export async function POST(req: Request) {
  try {
    const body = await req.json()

    // 청구 생성 모드
    if (body.action === 'generate') {
      const { year, month } = body
      if (!year || !month) return NextResponse.json({ error: 'missing year/month' }, { status: 400 })

      const ym = `${year}-${String(month).padStart(2, '0')}`

      const [tenantRows, paymentRows] = await Promise.all([
        getSheetData('입주자'),
        getSheetData('수납'),
      ])

      // 입주자 탭: [0]ID [1]구 [2]지점명 [3]방코드 [4]방타입 [5]이름 [6]입주일 [7]퇴실일 [8]상태 [9]보증금 [10]월세 [11]관리비
      const active = tenantRows.filter(r => r[8] === '입주중')
      const existingIds = new Set(paymentRows.filter(r => r[5] === ym).map(r => r[0]))

      let created = 0
      for (const t of active) {
        const id = `pay_${t[0]}_${ym.replace('-', '')}`
        if (existingIds.has(id)) continue
        const charge = (Number(t[10]) || 0) + (Number(t[11]) || 0)
        await appendRow('수납', [id, t[0], t[2] || '', t[3] || '', t[5] || '', ym, charge, 0, '', '미납', '', ''])
        created++
      }

      return NextResponse.json({ success: true, created, target: active.length })
    }

    // 일반 수납 추가
    const rows = await getSheetData('수납')
    let maxNum = 0
    for (const r of rows) {
      const m = r[0]?.match(/pay_(\d+)/)
      if (m) maxNum = Math.max(maxNum, Number(m[1]))
    }
    const id = `pay_${String(maxNum + 1).padStart(4, '0')}`

    const row = [
      id,
      body.입주자ID || '',
      body.지점명 || '',
      body.방코드 || '',
      body.이름 || '',
      body.연월 || '',
      body.청구액 || '',
      body.납부액 || '',
      body.납부일 || '',
      body.상태 || '미납',
      body.납부방법 || '',
      body.메모 || '',
    ]

    await appendRow('수납', row)
    return NextResponse.json({ success: true, id })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// PUT /api/payments — 납부 상태 업데이트
export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, ...data } = body

    const rows = await getSheetData('수납')
    const rowIndex = rows.findIndex(r => r[0] === id)
    if (rowIndex === -1) return NextResponse.json({ error: '없음' }, { status: 404 })

    const e = rows[rowIndex]
    const updated = [
      e[0], e[1], e[2], e[3], e[4], e[5],
      data.청구액 ?? e[6],
      data.납부액 ?? e[7],
      data.납부일 ?? e[8],
      data.상태 ?? e[9],
      data.납부방법 ?? e[10],
      data.메모 ?? (e[11] || ''),
    ]

    await updateRow('수납', rowIndex, updated)
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
