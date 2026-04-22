import { NextResponse } from 'next/server'
import { getSheetData, updateRow } from '@/lib/sheets'
import { createAdminClient } from '@/lib/supabase/server'
import { listOrEmpty } from '@/lib/supabase/helpers'

function kstMonth(): string {
  const d = new Date()
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000)
  return `${kst.getUTCFullYear()}-${String(kst.getUTCMonth() + 1).padStart(2, '0')}`
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const month = searchParams.get('month') || kstMonth()

    const supabase = createAdminClient()

    // 플랫폼이 설정된 입주자 (platform_id NOT NULL)
    const tenants = await listOrEmpty<any>(
      supabase.from('tenants').select('*, platforms(name), rooms(room_code, branches(name))')
        .not('platform_id', 'is', null).eq('status', 'active')
    )

    // 해당 월 납부 기록
    const payments = await listOrEmpty<any>(
      supabase.from('monthly_payments').select('*').eq('year_month', month)
    )
    const paymentMap = new Map<string, any>()
    for (const p of payments) paymentMap.set(p.tenant_id, p)

    // 플랫폼별 그룹핑
    const platforms: Record<string, { account: string; tenants: any[] }> = {}

    for (const t of tenants) {
      const platformName = t.platforms?.name || '기타'
      if (!platforms[platformName]) platforms[platformName] = { account: '', tenants: [] }

      const payment = paymentMap.get(t.id)
      const rentBilled = payment ? (payment.rent_billed + payment.maintenance_billed) : 0
      const rentPaid = payment ? (payment.rent_paid + payment.maintenance_paid) : 0
      let status = '미납'
      if (rentPaid >= rentBilled && rentBilled > 0) status = '납부완료'
      else if (rentPaid > 0) status = '부분납부'

      platforms[platformName].tenants.push({
        tenantId: t.id,
        name: t.name || '',
        house: t.rooms?.branches?.name || '',
        room: t.rooms?.room_code || '',
        rent: t.monthly_rent || 0,
        paymentId: payment?.id || '',
        paid: rentPaid,
        transferred: false,
        status,
      })
    }

    return NextResponse.json({ month, platforms })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// PATCH는 Step 4.4에서 전환 예정 - Sheets 유지
export async function PATCH(req: Request) {
  try {
    const { paymentId, transferred } = await req.json()
    if (!paymentId) return NextResponse.json({ error: 'paymentId required' }, { status: 400 })
    const rows = await getSheetData('수납')
    const idx = rows.findIndex(r => r[0] === paymentId)
    if (idx < 0) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    const row = [...rows[idx]]
    while (row.length < 13) row.push('')
    row[12] = transferred ? 'Y' : ''
    await updateRow('수납', idx, row)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
