import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth-helpers'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(); if (auth.error) return auth.error
    const { id } = await params
    const body = await req.json()
    const supabase = createAdminClient()

    // 기존 레코드 조회
    const { data: existing, error: fetchErr } = await supabase
      .from('monthly_payments').select('*').eq('id', id).single()
    if (fetchErr || !existing) return NextResponse.json({ error: 'not found' }, { status: 404 })

    const update: Record<string, any> = {}

    // rentPaid boolean → rent_paid 금액 (billed 전액 or 0)
    if (body.rentPaid !== undefined) {
      update.rent_paid = body.rentPaid ? existing.rent_billed : 0
      if (body.rentPaid) update.rent_paid_date = new Date().toISOString().slice(0, 10)
    }
    // mgmtPaid boolean → maintenance_paid 금액
    if (body.mgmtPaid !== undefined) {
      update.maintenance_paid = body.mgmtPaid ? existing.maintenance_billed : 0
      if (body.mgmtPaid) update.maintenance_paid_date = new Date().toISOString().slice(0, 10)
    }
    if (body.memo !== undefined) update.memo = body.memo

    const { error } = await supabase.from('monthly_payments').update(update).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
