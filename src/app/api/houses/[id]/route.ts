import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getOrThrow } from '@/lib/supabase/helpers'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = createAdminClient()
    const b = await getOrThrow<any>(supabase.from('branches').select('*').eq('id', id).single())
    return NextResponse.json({
      id: b.id, name: b.name, district: b.district, address: b.address,
      doorPassword: b.door_code, wifiSsid: b.wifi_ssid, wifiPassword: b.wifi_password,
      buildingRent: b.contract_rent || 0,
      investorRatio: b.investor_share_pct || 0,
      operatorRatio: 100 - (b.investor_share_pct || 0),
      landlordName: b.landlord_name, landlordPhone: b.landlord_phone, memo: b.memo,
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
    const update: Record<string, any> = {}
    if (body.name !== undefined) update.name = body.name
    if (body.district !== undefined) update.district = body.district
    if (body.address !== undefined) update.address = body.address
    if (body.doorPassword !== undefined) update.door_code = body.doorPassword
    if (body.wifiSsid !== undefined) update.wifi_ssid = body.wifiSsid
    if (body.wifiPassword !== undefined) update.wifi_password = body.wifiPassword
    if (body.buildingRent !== undefined) update.contract_rent = Number(body.buildingRent) || null
    if (body.investorRatio !== undefined) update.investor_share_pct = Number(body.investorRatio) || 0
    if (body.landlordName !== undefined) update.landlord_name = body.landlordName
    if (body.landlordPhone !== undefined) update.landlord_phone = body.landlordPhone
    if (body.memo !== undefined) update.memo = body.memo
    const { error } = await supabase.from('branches').update(update).eq('id', id)
    if (error) return NextResponse.json({ error: 'not found' }, { status: 404 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
