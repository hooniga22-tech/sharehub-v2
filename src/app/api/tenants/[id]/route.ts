import { NextResponse } from 'next/server'
import { getSheetData, updateRow } from '@/lib/sheets'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = createAdminClient()
    const { data: t, error } = await supabase
      .from('tenants').select('*, rooms(room_code, room_type, branches(name, district))').eq('id', id).single()
    if (error || !t) return NextResponse.json({ error: 'not found' }, { status: 404 })

    const statusMap: Record<string, string> = { active: '입주중', moved_out: '퇴실완료', cancelled: '계약취소', pending: '대기' }
    return NextResponse.json({
      id: t.id, district: t.rooms?.branches?.district || '', houseName: t.rooms?.branches?.name || '',
      roomCode: t.rooms?.room_code || '', roomType: t.rooms?.room_type || '', name: t.name,
      startDate: t.contract_start || '', endDate: t.contract_end || '',
      status: statusMap[t.status] || t.status,
      deposit: t.deposit || 0, rent: t.monthly_rent || 0, managementFee: t.maintenance_fee || 0,
      memo: t.memo || '', phone: t.phone || '', birthDate: t.birth_date || '', address: t.home_address || '',
      investor: '', investorAccount: '', investorPhone: '',
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// PUT는 Step 4.4에서 전환 예정 - Sheets 유지
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const rows = await getSheetData('입주자')
    const rowIndex = rows.findIndex(r => r[0] === id)
    if (rowIndex === -1) return NextResponse.json({ error: 'not found' }, { status: 404 })
    const existing = rows[rowIndex]
    await updateRow('입주자', rowIndex, [
      id, body.district ?? existing[1], body.houseName ?? existing[2], body.roomCode ?? existing[3],
      body.roomType ?? existing[4], body.name ?? existing[5], body.startDate ?? existing[6],
      body.endDate ?? existing[7], body.status ?? existing[8], body.deposit ?? existing[9],
      body.rent ?? existing[10], body.managementFee ?? existing[11], body.memo ?? existing[12],
      body.phone ?? existing[13], body.birthDate ?? existing[14], body.address ?? existing[15],
      body.investor ?? existing[16], body.investorAccount ?? existing[17], body.investorPhone ?? existing[18],
    ])
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
