import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { listOrEmpty } from '@/lib/supabase/helpers'

interface ConfirmItem {
  tenantId: string
  tenantName: string
  houseName: string
  roomCode: string
  amount: number
  date: string
  type: string
  method: string
}

export async function POST(req: Request) {
  try {
    const { items, month } = await req.json() as { items: ConfirmItem[]; month: string }
    if (!items || items.length === 0) return NextResponse.json({ error: 'no items' }, { status: 400 })

    const supabase = createAdminClient()
    const existing = await listOrEmpty<any>(
      supabase.from('monthly_payments').select('id, tenant_id').eq('year_month', month)
    )
    const existingMap = new Map<string, string>()
    for (const e of existing) existingMap.set(e.tenant_id, e.id)

    let confirmed = 0
    for (const item of items) {
      const payId = existingMap.get(item.tenantId)
      if (payId) {
        await supabase.from('monthly_payments').update({
          rent_paid: item.amount, rent_paid_date: item.date,
          memo: `${item.method} · ${item.date}`,
        }).eq('id', payId)
      } else {
        await supabase.from('monthly_payments').insert({
          id: `pay_${Date.now()}_${confirmed}`,
          tenant_id: item.tenantId, year_month: month,
          rent_billed: item.amount, rent_paid: item.amount,
          rent_paid_date: item.date,
          memo: `${item.method} · ${item.date}`,
        })
      }
      confirmed++
    }

    return NextResponse.json({ ok: true, confirmed })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
