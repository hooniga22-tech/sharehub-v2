import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { listOrEmpty } from '@/lib/supabase/helpers'

export async function GET() {
  try {
    const supabase = createAdminClient()
    const rows = await listOrEmpty<any>(supabase.from('tour_applications').select('*'))
    return NextResponse.json(rows.map((r, i) => ({
      _rowIndex: i, id: r.id || '', name: r.tenant_name || '', phone: r.phone || '',
      gender: '', region: '', houseName: '', roomType: '', moveInDate: '',
      contractPeriod: '', tourDate: r.requested_date || '', tourTime: '',
      inquiry: r.visit_purpose || '', feePaid: false,
      status: r.status || '신청접수', createdAt: r.created_at ? r.created_at.slice(0, 10) : '',
    })))
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const supabase = createAdminClient()
    const id = `tour_${Date.now()}`
    const { error } = await supabase.from('tour_applications').insert({
      id, tenant_name: body.name || '', phone: body.phone || '',
      requested_date: body.tourDate || null,
      visit_purpose: body.inquiry || '', status: '신청접수',
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, id })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
