import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { listOrEmpty } from '@/lib/supabase/helpers'

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params
    const supabase = createAdminClient()

    // 입주자 + 방 + 지점 조인
    const { data: t, error } = await supabase
      .from('tenants').select('*, rooms(room_code, room_type, branch_id, branches(id, name, district, address, door_code, wifi_ssid, wifi_password, landlord_name, memo))')
      .eq('access_token', token).single()
    if (error || !t) return NextResponse.json({ error: 'not found' }, { status: 404 })

    const branch = t.rooms?.branches
    const branchId = t.rooms?.branch_id

    // 이슈 (해당 지점+방)
    let issueQuery = supabase.from('issues').select('id, title, category, status, created_at')
    if (branchId) issueQuery = issueQuery.eq('branch_id', branchId)
    if (t.room_id) issueQuery = issueQuery.eq('room_id', t.room_id)
    const myIssues = await listOrEmpty<any>(issueQuery)

    const endDate = t.contract_end
    const dDay = endDate ? Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null

    return NextResponse.json({
      tenant: {
        id: t.id, houseName: branch?.name || '', roomCode: t.rooms?.room_code || '',
        name: t.name, phone: t.phone || '',
        rent: t.monthly_rent || 0, managementFee: t.maintenance_fee || 0, deposit: t.deposit || 0,
        startDate: t.contract_start || '', endDate: t.contract_end || '',
        status: t.status || 'pending',
        nationality: '', memo: t.memo || '', dDay,
      },
      house: branch ? {
        name: branch.name, district: branch.district, address: branch.address,
        doorPassword: branch.door_code, wifiSsid: branch.wifi_ssid,
        wifiPassword: branch.wifi_password, landlordName: branch.landlord_name, memo: branch.memo,
      } : null,
      myIssues: myIssues.map(i => ({
        id: i.id, title: i.title, category: i.category,
        status: i.status, createdAt: i.created_at,
      })),
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
