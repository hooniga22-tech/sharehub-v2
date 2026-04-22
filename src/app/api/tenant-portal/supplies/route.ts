import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { token, items, memo } = body
    const supabase = createAdminClient()

    const { data: tenant, error } = await supabase
      .from('tenants').select('id, name, branch_id, branches(name), rooms(room_code)')
      .eq('link_token', token).limit(1).single()
    if (error || !tenant) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const id = `supply_${Date.now()}`
    await supabase.from('supplies_applications').insert({
      id, tenant_id: tenant.id, branch_id: tenant.branch_id,
      house_name: (tenant.branches as any)?.name || '',
      room_code: (tenant.rooms as any)?.room_code || '',
      tenant_name: tenant.name, items: items || '',
      quantity: 1, memo: memo || null, status: '접수',
    })
    return NextResponse.json({ ok: true, id })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
