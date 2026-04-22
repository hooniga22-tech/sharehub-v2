import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { listOrEmpty } from '@/lib/supabase/helpers'

export async function GET() {
  try {
    const supabase = createAdminClient()
    const rows = await listOrEmpty<any>(supabase.from('supplies_applications').select('*'))
    return NextResponse.json(rows.map((r, i) => ({
      _rowIndex: i, id: r.id || '', tenantId: '', tenantName: r.tenant_name || '',
      houseName: '', roomCode: '', items: r.item_list || '', detail: r.memo || '',
      status: r.status || '신청접수', createdAt: r.created_at ? r.created_at.slice(0, 10) : '',
      processedAt: r.delivery_date || '',
    })))
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }) }
}

export async function POST(req: Request) {
  try {
    const b = await req.json()
    const supabase = createAdminClient()
    const id = `supply_${Date.now()}`
    const { error } = await supabase.from('supplies_applications').insert({
      id, tenant_name: b.tenantName || b.tenantId || '',
      item_list: Array.isArray(b.items) ? b.items.join(', ') : (b.items || ''),
      memo: b.detail || '', status: '신청접수',
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, id })
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }) }
}
