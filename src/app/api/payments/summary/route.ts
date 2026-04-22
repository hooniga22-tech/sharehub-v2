import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { listOrEmpty } from '@/lib/supabase/helpers'
import { requireAdmin } from '@/lib/auth-helpers'

export async function GET(req: Request) {
  try {
    const auth = await requireAdmin(); if (auth.error) return auth.error
    const { searchParams } = new URL(req.url)
    const month = searchParams.get('month') || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
    const targetMonth = month

    const supabase = createAdminClient()

    // 활성 입주자
    const tenants = await listOrEmpty<any>(
      supabase.from('tenants').select('*, rooms(room_code, branches(name, district))')
        .in('status', ['active'])
    )

    // 해당 월 납부 기록
    const payments = await listOrEmpty<any>(
      supabase.from('monthly_payments').select('*').eq('year_month', targetMonth)
    )
    const paymentByTenant = new Map<string, any>()
    for (const p of payments) paymentByTenant.set(p.tenant_id, p)

    const tenantPayments = tenants.map(t => {
      const p = paymentByTenant.get(t.id)
      const hasPaid = p ? (p.rent_paid >= p.rent_billed && p.rent_billed > 0) : false
      const dueDate = `${targetMonth}-01`
      const lateDays = !hasPaid ? Math.max(0, Math.floor((Date.now() - new Date(dueDate).getTime()) / 86400000)) : 0

      return {
        id: t.id,
        district: t.rooms?.branches?.district || '',
        house: t.rooms?.branches?.name || '',
        roomCode: t.rooms?.room_code || '',
        name: t.name || '',
        rent: t.deposit || 0,
        deposit: t.deposit || 0,
        phone: t.phone || '',
        paymentDay: 1,
        status: hasPaid ? 'paid' as const : 'unpaid' as const,
        lateDays,
        monthlyRent: t.monthly_rent || 0,
      }
    })

    const unpaid = tenantPayments.filter(t => t.status === 'unpaid')
    const paid = tenantPayments.filter(t => t.status === 'paid')

    return NextResponse.json({
      month: targetMonth,
      total: tenantPayments.length,
      unpaidCount: unpaid.length,
      paidCount: paid.length,
      unpaidAmount: unpaid.reduce((s, t) => s + t.monthlyRent, 0),
      paidAmount: paid.reduce((s, t) => s + t.monthlyRent, 0),
      rate: tenantPayments.length > 0 ? Math.round((paid.length / tenantPayments.length) * 100) : 0,
      tenants: tenantPayments,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
