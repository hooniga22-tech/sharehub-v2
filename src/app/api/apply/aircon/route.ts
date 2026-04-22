import { NextResponse } from 'next/server'
import { appendRow } from '@/lib/sheets'
import { createAdminClient } from '@/lib/supabase/server'
import { listOrEmpty } from '@/lib/supabase/helpers'

export async function GET() {
  try {
    const supabase = createAdminClient()
    const rows = await listOrEmpty<any>(supabase.from('aircon_applications').select('*'))
    return NextResponse.json(rows.map((r, i) => ({
      _rowIndex: i, id: r.id || '', name: r.tenant_name || '', phone: r.phone || '',
      houseName: '', roomCode: '', roomType: '', acLocation: r.issue_type || '',
      request: r.memo || '', feePaid: false,
      status: r.status || '신청접수', createdAt: r.created_at ? r.created_at.slice(0, 10) : '',
    })))
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }) }
}

export async function POST(req: Request) {
  try {
    const b = await req.json()
    const id = `aircon_${Date.now()}`
    await appendRow('에어컨신청', [id, b.name, b.phone, b.houseName, b.roomCode || '', b.roomType, b.acLocation || '방 안', b.request || '', 'N', '신청접수', new Date().toISOString().split('T')[0]])
    return NextResponse.json({ ok: true, id })
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }) }
}
