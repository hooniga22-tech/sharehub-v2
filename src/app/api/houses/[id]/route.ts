import { NextResponse } from 'next/server'
import { getSheetData, updateRow } from '@/lib/sheets'
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

// PUT은 Step 4.4에서 전환 예정 - Sheets 유지
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const rows = await getSheetData('지점')
    const rowIndex = rows.findIndex(r => r[0] === id)
    if (rowIndex === -1) return NextResponse.json({ error: 'not found' }, { status: 404 })
    const existing = rows[rowIndex]
    await updateRow('지점', rowIndex, [
      id,
      body.name ?? existing[1], body.district ?? existing[2], body.address ?? existing[3],
      body.doorPassword ?? existing[4], body.wifiSsid ?? existing[5], body.wifiPassword ?? existing[6],
      body.buildingRent ?? existing[7], body.investorRatio ?? existing[8], body.operatorRatio ?? existing[9],
      body.landlordName ?? existing[10], body.landlordPhone ?? existing[11], body.memo ?? existing[12],
    ])
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
