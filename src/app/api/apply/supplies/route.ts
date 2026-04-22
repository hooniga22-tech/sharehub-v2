import { NextResponse } from 'next/server'
import { appendRow } from '@/lib/sheets'
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
    const id = `supply_${Date.now()}`
    const today = new Date().toISOString().split('T')[0]
    await appendRow('비품신청', [id, b.tenantId || '', b.tenantName || '', b.houseName || '', b.roomCode || '', Array.isArray(b.items) ? b.items.join(', ') : (b.items || ''), b.detail || '', '신청접수', today, ''])
    return NextResponse.json({ ok: true, id })
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }) }
}
