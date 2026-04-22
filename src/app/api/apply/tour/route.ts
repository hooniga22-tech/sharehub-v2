import { NextResponse } from 'next/server'
import { getSheetData, appendRow } from '@/lib/sheets'
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

// POST는 Step 4.5에서 전환 - Sheets 유지
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const id = `tour_${Date.now()}`
    const today = new Date().toISOString().split('T')[0]
    await appendRow('투어신청', [
      id, body.name || '', body.phone || '', body.gender || '',
      body.region || '', body.houseName || '', body.roomType || '',
      body.moveInDate || '', body.contractPeriod || '',
      body.tourDate || '', body.tourTime || '', body.inquiry || '',
      'N', '신청접수', today,
    ])
    return NextResponse.json({ ok: true, id })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
