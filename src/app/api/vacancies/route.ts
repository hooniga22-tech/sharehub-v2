import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { listOrEmpty } from '@/lib/supabase/helpers'
import { requireAdmin } from '@/lib/auth-helpers'
import { VACANCY_STATUS_REVERSE } from '@/lib/status'

// vacancies 테이블 없음 -> rooms+tenants 조인으로 공실 계산
export async function GET() {
  try {
    const auth = await requireAdmin(); if (auth.error) return auth.error
    const supabase = createAdminClient()
    const [rooms, tenants] = await Promise.all([
      listOrEmpty<any>(supabase.from('rooms').select('id, room_code, branch_id, vacancy_status, branches(name)')),
      listOrEmpty<any>(supabase.from('tenants').select('id, room_id, name, phone, contract_end, status').eq('status', 'active')),
    ])

    const tenantByRoom = new Map<string, any>()
    for (const t of tenants) { if (t.room_id) tenantByRoom.set(t.room_id, t) }

    const vacancies = rooms
      .filter(r => !tenantByRoom.has(r.id) || r.vacancy_status === 'vacant')
      .map((r, i) => {
        const tenant = tenantByRoom.get(r.id)
        return {
          _rowIndex: i,
          공실ID: `vac_${r.id}`,
          지점명: r.branches?.name || '',
          방코드: r.room_code || '',
          공실유형: tenant ? 'vacating_soon' : 'vacant',
          공실시작일: '',
          퇴실예정일: tenant?.contract_end || '',
          예정자명: '',
          예정자연락처: '',
          예정입주일: '',
          보증금상태: '',
          메모: '',
          status: 'vacating_soon',
        }
      })
      .sort((a, b) => {
        const ad = a.퇴실예정일 || a.공실시작일 || ''
        const bd = b.퇴실예정일 || b.공실시작일 || ''
        return ad > bd ? 1 : -1
      })

    return NextResponse.json(vacancies)
  } catch (e) {
    console.error(e); return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin(); if (auth.error) return auth.error
    const body = await req.json()
    const supabase = createAdminClient()
    if (body.지점명 && body.방코드) {
      const { data: rooms } = await supabase.from('rooms').select('id, branches!inner(name)')
        .eq('room_code', body.방코드).eq('branches.name', body.지점명).limit(1)
      if (rooms && rooms[0]) {
        await supabase.from('rooms').update({
          vacancy_status: VACANCY_STATUS_REVERSE[body.공실유형] || body.공실유형 || 'vacant',
          memo: body.메모 || null,
        }).eq('id', rooms[0].id)
      }
    }
    return NextResponse.json({ success: true, id: `vac_${Date.now()}` })
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }) }
}

export async function PUT(req: Request) {
  try {
    const auth = await requireAdmin(); if (auth.error) return auth.error
    const body = await req.json()
    const { id, ...data } = body
    const supabase = createAdminClient()
    const roomId = id?.startsWith('vac_') ? id.replace('vac_', '') : id
    const update: Record<string, any> = {}
    if (data.status === 'occupied' || data.상태 === '완료') update.vacancy_status = 'occupied'
    else if (data.공실유형) update.vacancy_status = VACANCY_STATUS_REVERSE[data.공실유형] || data.공실유형
    if (data.메모 !== undefined) update.memo = data.메모
    const { error } = await supabase.from('rooms').update(update).eq('id', roomId)
    if (error) return NextResponse.json({ error: '없음' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }) }
}
