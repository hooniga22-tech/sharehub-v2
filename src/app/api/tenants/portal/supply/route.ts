import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const supabase = createAdminClient()
    const id = `sup_${Date.now()}`
    const { error } = await supabase.from('supplies_applications').insert({
      id,
      tenant_name: body.tenantName || '',
      phone: '',
      item_list: Array.isArray(body.items) ? body.items.join(', ') : (body.items || ''),
      memo: body.note || '',
      status: '접수',
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
