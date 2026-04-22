import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { listOrEmpty } from '@/lib/supabase/helpers'
import { requireAdmin } from '@/lib/auth-helpers'

// Supabase branches -> 프론트엔드 기대 필드명 매핑
function branchToHouse(b: any, idx: number) {
  return {
    _rowIndex: idx,
    지점ID: b.id || '',
    지점명: b.name || '',
    구: b.district || '',
    주소: b.address || '',
    현관비번: b.door_code || '',
    와이파이SSID: b.wifi_ssid || '',
    와이파이PW: b.wifi_password || '',
    집월세: b.contract_rent != null ? String(b.contract_rent) : '',
    투자자토큰: b.investor_id || '',
    총방수: '',
    건물주명: b.landlord_name || '',
    건물주연락처: b.landlord_phone || '',
    메모: b.memo || '',
  }
}

export async function GET(req: Request) {
  try {
    const auth = await requireAdmin(); if (auth.error) return auth.error
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const gu = searchParams.get('gu')

    const supabase = createAdminClient()
    let query = supabase.from('branches').select('*').order('name')
    if (gu) query = query.eq('district', gu)

    const rows = await listOrEmpty<any>(query)
    let houses = rows.map((r, i) => branchToHouse(r, i))

    if (id) {
      const found = houses.find(h => h.지점ID === id)
      if (!found) return NextResponse.json({ error: '없음' }, { status: 404 })
      return NextResponse.json(found)
    }

    return NextResponse.json(houses)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await requireAdmin(); if (auth.error) return auth.error
    const body = await req.json()
    const { id, ...data } = body
    const supabase = createAdminClient()

    const update: Record<string, any> = {}
    if (data.지점명 !== undefined) update.name = data.지점명
    if (data.구 !== undefined) update.district = data.구
    if (data.주소 !== undefined) update.address = data.주소
    if (data.현관비번 !== undefined) update.door_code = data.현관비번
    if (data.와이파이SSID !== undefined) update.wifi_ssid = data.와이파이SSID
    if (data.와이파이PW !== undefined) update.wifi_password = data.와이파이PW
    if (data.집월세 !== undefined) update.contract_rent = Number(data.집월세) || null
    if (data.건물주명 !== undefined) update.landlord_name = data.건물주명
    if (data.건물주연락처 !== undefined) update.landlord_phone = data.건물주연락처
    if (data.메모 !== undefined) update.memo = data.메모

    const { error } = await supabase.from('branches').update(update).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
