import { NextResponse } from 'next/server'
import { getSheetData, appendRow, updateRow } from '@/lib/sheets'
import { createAdminClient } from '@/lib/supabase/server'
import { listOrEmpty } from '@/lib/supabase/helpers'

// Supabase monthly_payments+tenants -> 프론트 기대 필드 매핑
function sbToPayment(p: any) {
  const rentBilled = p.rent_billed || 0
  const mgmtBilled = p.maintenance_billed || 0
  const rentPaid = p.rent_paid || 0
  const mgmtPaid = p.maintenance_paid || 0
  const totalBilled = rentBilled + mgmtBilled
  const totalPaid = rentPaid + mgmtPaid
  let status = '미납'
  if (totalPaid >= totalBilled && totalBilled > 0) status = '납부완료'
  else if (totalPaid > 0) status = '부분납부'
  return {
    수납ID: p.id || '',
    입주자ID: p.tenant_id || '',
    지점명: p.tenants?.rooms?.branches?.name || '',
    방코드: p.tenants?.rooms?.room_code || '',
    이름: p.tenants?.name || '',
    연월: p.year_month || '',
    청구액: String(totalBilled),
    납부액: String(totalPaid),
    납부일: p.rent_paid_date || p.maintenance_paid_date || '',
    상태: status,
    납부방법: '',
    메모: p.memo || '',
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const tenantId = searchParams.get('tenantId')
    const year = searchParams.get('year')
    const month = searchParams.get('month')

    const supabase = createAdminClient()
    let query = supabase.from('monthly_payments').select('*, tenants(name, rooms(room_code, branches(name)))')

    if (tenantId) query = query.eq('tenant_id', tenantId)
    if (year && month) {
      const ym = `${year}-${month.padStart(2, '0')}`
      query = query.eq('year_month', ym)
    } else if (year) {
      query = query.like('year_month', `${year}%`)
    }

    const rows = await listOrEmpty<any>(query)
    const payments = rows.map(sbToPayment)

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

// POST/PUT는 Step 4.4에서 전환 예정 - Sheets 유지
export async function POST(req: Request) {
  try {
    const body = await req.json()
    if (body.action === 'generate') {
      const { year, month } = body
      if (!year || !month) return NextResponse.json({ error: 'missing year/month' }, { status: 400 })
      const ym = `${year}-${String(month).padStart(2, '0')}`
      const [tenantRows, paymentRows] = await Promise.all([getSheetData('입주자'), getSheetData('수납')])
      const active = tenantRows.filter(r => r[8] === '입주중')
      const existing = new Set(paymentRows.filter(r => r[5] === ym).map(r => r[1]))
      let count = 0
      for (const t of active) {
        if (existing.has(t[0])) continue
        const id = `pay_${Date.now()}_${count}`
        const charge = Number(t[10]) || 0
        await appendRow('수납', [id, t[0], t[2], t[3], t[5], ym, String(charge), '0', '', '미납', '', ''])
        count++
      }
      return NextResponse.json({ success: true, generated: count })
    }
    const id = body.id || `pay_${Date.now()}`
    await appendRow('수납', [id, body.입주자ID || '', body.지점명 || '', body.방코드 || '', body.이름 || '', body.연월 || '', body.청구액 || '0', body.납부액 || '0', body.납부일 || '', body.상태 || '미납', body.납부방법 || '', body.메모 || ''])
    return NextResponse.json({ success: true, id })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    const rows = await getSheetData('수납')
    const rowIndex = rows.findIndex(r => r[0] === id)
    if (rowIndex === -1) return NextResponse.json({ error: '없음' }, { status: 404 })
    const e = rows[rowIndex]
    await updateRow('수납', rowIndex, [
      e[0], e[1], e[2], e[3], e[4], e[5],
      data.청구액 ?? e[6], data.납부액 ?? e[7], data.납부일 ?? e[8],
      data.상태 ?? e[9], data.납부방법 ?? (e[10] || ''), data.메모 ?? (e[11] || ''),
    ])
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
