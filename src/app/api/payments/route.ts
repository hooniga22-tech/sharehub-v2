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

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const supabase = createAdminClient()

    // generate 모드: 활성 입주자 전원에 대해 미납 기록 일괄 생성
    if (body.action === 'generate') {
      const { year, month } = body
      if (!year || !month) return NextResponse.json({ error: 'missing year/month' }, { status: 400 })
      const ym = `${year}-${String(month).padStart(2, '0')}`

      const [tenants, existing] = await Promise.all([
        listOrEmpty<any>(supabase.from('tenants').select('id, monthly_rent').eq('status', 'active')),
        listOrEmpty<any>(supabase.from('monthly_payments').select('tenant_id').eq('year_month', ym)),
      ])
      const existingSet = new Set(existing.map(e => e.tenant_id))
      const inserts = []
      let count = 0
      for (const t of tenants) {
        if (existingSet.has(t.id)) continue
        inserts.push({
          id: `pay_${Date.now()}_${count}`,
          tenant_id: t.id, year_month: ym,
          rent_billed: t.monthly_rent || 0, rent_paid: 0,
          maintenance_billed: 0, maintenance_paid: 0,
        })
        count++
      }
      if (inserts.length > 0) {
        const { error } = await supabase.from('monthly_payments').insert(inserts)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ success: true, generated: count })
    }

    // 단건 생성
    const id = body.id || `pay_${Date.now()}`
    const rentBilled = Number(body.청구액) || 0
    const rentPaid = Number(body.납부액) || 0
    const { error } = await supabase.from('monthly_payments').insert({
      id, tenant_id: body.입주자ID || '', year_month: body.연월 || '',
      rent_billed: rentBilled, rent_paid: rentPaid,
      rent_paid_date: body.납부일 || null, memo: body.메모 || null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, id })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    const supabase = createAdminClient()
    const update: Record<string, any> = {}
    if (data.청구액 !== undefined) update.rent_billed = Number(data.청구액) || 0
    if (data.납부액 !== undefined) update.rent_paid = Number(data.납부액) || 0
    if (data.납부일 !== undefined) update.rent_paid_date = data.납부일 || null
    if (data.메모 !== undefined) update.memo = data.메모
    // 상태는 금액 기반으로 자동 계산되므로 별도 저장 안 함
    const { error } = await supabase.from('monthly_payments').update(update).eq('id', id)
    if (error) return NextResponse.json({ error: '없음' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
