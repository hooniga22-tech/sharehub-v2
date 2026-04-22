import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { listOrEmpty } from '@/lib/supabase/helpers'

export async function POST(req: Request) {
  try {
    const { year, month } = await req.json()
    if (!year || !month) return NextResponse.json({ error: 'year/month required' }, { status: 400 })

    const ym = `${year}-${String(month).padStart(2, '0')}`
    const supabase = createAdminClient()

    const [tenants, existing] = await Promise.all([
      listOrEmpty<any>(supabase.from('tenants').select('id, monthly_rent, maintenance_fee').eq('status', 'active')),
      listOrEmpty<any>(supabase.from('monthly_payments').select('tenant_id').eq('year_month', ym)),
    ])

    const existingSet = new Set(existing.map(e => e.tenant_id))
    const inserts = []
    for (const t of tenants) {
      if (existingSet.has(t.id)) continue
      inserts.push({
        id: `pay_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        tenant_id: t.id, year_month: ym,
        rent_billed: t.monthly_rent || 0, rent_paid: 0,
        maintenance_billed: t.maintenance_fee || 0, maintenance_paid: 0,
      })
    }

    if (inserts.length > 0) {
      const { error } = await supabase.from('monthly_payments').insert(inserts)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, created: inserts.length })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
