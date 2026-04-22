import { NextResponse } from 'next/server'
import { getSheetData, updateRow } from '@/lib/sheets'
import { createAdminClient } from '@/lib/supabase/server'
import { listOrEmpty } from '@/lib/supabase/helpers'

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

// PUT은 Step 4.4에서 전환 예정 - Sheets 유지
export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, ...data } = body

    const rows = await getSheetData('지점')
    const rowIndex = rows.findIndex(r => r[0] === id)
    if (rowIndex === -1) return NextResponse.json({ error: '없음' }, { status: 404 })

    const e = rows[rowIndex]
    await updateRow('지점', rowIndex, [
      e[0], data.지점명 ?? e[1], data.구 ?? e[2], data.주소 ?? e[3],
      data.현관비번 ?? e[4], data.와이파이SSID ?? e[5], data.와이파이PW ?? e[6],
      data.집월세 ?? (e[7] || ''), data.투자자토큰 ?? (e[8] || ''), data.총방수 ?? (e[9] || ''),
      data.건물주명 ?? (e[10] || ''), data.건물주연락처 ?? (e[11] || ''), data.메모 ?? (e[12] || ''),
    ])
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
