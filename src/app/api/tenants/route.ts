import { NextResponse } from 'next/server'
import { getSheetData, appendRow, updateRow } from '@/lib/sheets'
import { createAdminClient } from '@/lib/supabase/server'
import { listOrEmpty } from '@/lib/supabase/helpers'

// Supabase tenants+rooms+branches -> 프론트엔드 기대 필드 매핑
function sbToTenant(t: any, idx: number) {
  return {
    _rowIndex: idx,
    입주자ID: t.id || '',
    구: t.rooms?.branches?.district || '',
    지점명: t.rooms?.branches?.name || '',
    방코드: t.rooms?.room_code || '',
    방타입: t.rooms?.room_type || '',
    이름: t.name || '',
    입주일: t.contract_start || '',
    퇴실일: t.contract_end || '',
    상태: t.status === 'active' ? '입주중' : t.status === 'moved_out' ? '퇴실완료' : t.status === 'cancelled' ? '계약취소' : '대기',
    보증금: t.deposit != null ? String(t.deposit) : '',
    월세: t.monthly_rent != null ? String(t.monthly_rent) : '',
    관리비: t.maintenance_fee != null ? String(t.maintenance_fee) : '',
    메모: t.memo || '',
    연락처: t.phone || '',
    생년월일: t.birth_date || '',
    주소: t.home_address || '',
    투자자: '', 투자자계좌: '', 투자자연락처: '',
    링크토큰: t.access_token || '',
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const token = searchParams.get('token')

    const supabase = createAdminClient()
    const query = supabase.from('tenants').select('*, rooms(room_code, room_type, branches(name, district))')

    if (id) {
      const { data, error } = await query.eq('id', id).single()
      if (error || !data) return NextResponse.json({ error: '없음' }, { status: 404 })
      return NextResponse.json(sbToTenant(data, 0))
    }
    if (token) {
      const { data, error } = await query.eq('access_token', token).single()
      if (error || !data) return NextResponse.json({ error: '없음' }, { status: 404 })
      return NextResponse.json(sbToTenant(data, 0))
    }

    const rows = await listOrEmpty<any>(query)
    return NextResponse.json(rows.map((r, i) => sbToTenant(r, i)))
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// POST/PUT는 Step 4.4에서 전환 예정 - Sheets 유지
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const id = body.입주자ID || `tenant_${Date.now()}`
    const token = `t_${Math.random().toString(36).slice(2, 10)}`
    await appendRow('입주자', [
      id, body.구 || '', body.지점명 || '', body.방코드 || '', body.방타입 || '',
      body.이름 || '', body.입주일 || '', body.퇴실일 || '', body.상태 || '입주중',
      body.보증금 || '', body.월세 || '', body.관리비 || '', body.메모 || '',
      body.연락처 || '', body.생년월일 || '', body.주소 || '', '', '', '', token, body.플랫폼 || '', body.이체계좌 || '',
    ])
    return NextResponse.json({ success: true, id, token })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    const rows = await getSheetData('입주자')
    const rowIndex = rows.findIndex(r => r[0] === id)
    if (rowIndex === -1) return NextResponse.json({ error: '없음' }, { status: 404 })
    const e = rows[rowIndex]
    const updated = new Array(22).fill('')
    for (let i = 0; i < 22; i++) updated[i] = e[i] || ''
    const fieldMap: Record<string, number> = {
      구: 1, 지점명: 2, 방코드: 3, 방타입: 4, 이름: 5, 입주일: 6, 퇴실일: 7, 상태: 8,
      보증금: 9, 월세: 10, 관리비: 11, 메모: 12, 연락처: 13, 생년월일: 14, 주소: 15,
    }
    for (const [key, idx] of Object.entries(fieldMap)) {
      if (data[key] !== undefined) updated[idx] = data[key]
    }
    await updateRow('입주자', rowIndex, updated)
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
