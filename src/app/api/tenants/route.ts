import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { listOrEmpty } from '@/lib/supabase/helpers'
import { requireAdmin } from '@/lib/auth-helpers'
import { TENANT_STATUS_REVERSE } from '@/lib/status'
import { generateMonthlyPayments, kstYearMonth } from '@/lib/generatePayments'

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
    status: t.status || 'pending',
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
    const auth = await requireAdmin(); if (auth.error) return auth.error
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

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin(); if (auth.error) return auth.error
    const body = await req.json()
    const supabase = createAdminClient()
    const id = body.입주자ID || `tenant_${Date.now()}`
    const token = `t_${Math.random().toString(36).slice(2, 10)}`

    // 방 ID 조회 (지점명+방코드로)
    let roomId: string | null = null
    if (body.지점명 && body.방코드) {
      const { data: rooms } = await supabase.from('rooms').select('id, branches!inner(name)')
        .eq('room_code', body.방코드).eq('branches.name', body.지점명).limit(1)
      roomId = rooms?.[0]?.id || null
    }

    // 플랫폼 ID 조회
    let platformId: string | null = null
    if (body.플랫폼) {
      const { data: plat } = await supabase.from('platforms').select('id').eq('name', body.플랫폼).limit(1).single()
      platformId = plat?.id || null
    }

    const { error } = await supabase.from('tenants').insert({
      id, room_id: roomId, name: body.이름 || '', phone: body.연락처 || '',
      birth_date: body.생년월일 || null, home_address: body.주소 || '',
      platform_id: platformId,
      contract_start: body.입주일 || null, contract_end: body.퇴실일 || null,
      status: TENANT_STATUS_REVERSE[body.상태] || body.status || 'active',
      deposit: Number(body.보증금) || null, monthly_rent: Number(body.월세) || null,
      maintenance_fee: Number(body.관리비) || null, memo: body.메모 || null,
      access_token: token,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Auto-generate current month payment for new active tenant
    const resolvedStatus = TENANT_STATUS_REVERSE[body.상태] || body.status || 'active'
    if (resolvedStatus === 'active') {
      try {
        await generateMonthlyPayments(kstYearMonth(), 'tenant_create', auth.user.email, [id])
      } catch (e) {
        console.error('Auto payment generation failed for new tenant:', e)
      }
    }

    return NextResponse.json({ success: true, id, token })
  } catch (e) {
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

    if (data.이름 !== undefined) update.name = data.이름
    if (data.연락처 !== undefined) update.phone = data.연락처
    if (data.입주일 !== undefined) update.contract_start = data.입주일 || null
    if (data.퇴실일 !== undefined) update.contract_end = data.퇴실일 || null
    if (data.상태 !== undefined) update.status = TENANT_STATUS_REVERSE[data.상태] || data.status || 'active'
    if (data.보증금 !== undefined) update.deposit = Number(data.보증금) || null
    if (data.월세 !== undefined) update.monthly_rent = Number(data.월세) || null
    if (data.관리비 !== undefined) update.maintenance_fee = Number(data.관리비) || null
    if (data.메모 !== undefined) update.memo = data.메모
    if (data.생년월일 !== undefined) update.birth_date = data.생년월일 || null
    if (data.주소 !== undefined) update.home_address = data.주소

    const { error } = await supabase.from('tenants').update(update).eq('id', id)
    if (error) return NextResponse.json({ error: '없음' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
