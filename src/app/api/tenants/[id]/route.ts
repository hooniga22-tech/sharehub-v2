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

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const supabase = createAdminClient()

    const statusMap: Record<string, string> = { '입주중': 'active', '퇴실완료': 'moved_out', '계약취소': 'cancelled', '대기': 'pending' }
    const update: Record<string, any> = {}
    if (body.name !== undefined) update.name = body.name
    if (body.phone !== undefined) update.phone = body.phone
    if (body.startDate !== undefined) update.contract_start = body.startDate || null
    if (body.endDate !== undefined) update.contract_end = body.endDate || null
    if (body.status !== undefined) update.status = statusMap[body.status] || body.status
    if (body.deposit !== undefined) update.deposit = Number(body.deposit) || null
    if (body.rent !== undefined) update.monthly_rent = Number(body.rent) || null
    if (body.managementFee !== undefined) update.maintenance_fee = Number(body.managementFee) || null
    if (body.memo !== undefined) update.memo = body.memo
    if (body.birthDate !== undefined) update.birth_date = body.birthDate || null
    if (body.address !== undefined) update.home_address = body.address

    const { error } = await supabase.from('tenants').update(update).eq('id', id)
    if (error) return NextResponse.json({ error: 'not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
