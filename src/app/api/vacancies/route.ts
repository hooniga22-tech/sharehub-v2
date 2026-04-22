import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { listOrEmpty } from '@/lib/supabase/helpers'

// vacancies 테이블 없음 -> rooms+tenants 조인으로 공실 계산
export async function GET() {
  try {
    const supabase = createAdminClient()
    const [rooms, tenants] = await Promise.all([
      listOrEmpty<any>(supabase.from('rooms').select('id, room_code, branch_id, vacancy_status, branches(name)')),
      listOrEmpty<any>(supabase.from('tenants').select('id, room_id, name, phone, contract_end, status').eq('status', 'active')),
    ])

    // 방별 활성 입주자 맵
    const tenantByRoom = new Map<string, any>()
    for (const t of tenants) { if (t.room_id) tenantByRoom.set(t.room_id, t) }

    // 공실인 방 또는 vacancy_status가 명시적으로 '공실'인 방
    const vacancies = rooms
      .filter(r => !tenantByRoom.has(r.id) || r.vacancy_status === '공실')
      .map((r, i) => {
        const tenant = tenantByRoom.get(r.id)
        return {
          _rowIndex: i,
          공실ID: `vac_${r.id}`,
          지점명: r.branches?.name || '',
          방코드: r.room_code || '',
          공실유형: tenant ? '퇴실예정' : '현재공실',
          공실시작일: '',
          퇴실예정일: tenant?.contract_end || '',
          예정자명: '',
          예정자연락처: '',
          예정입주일: '',
          보증금상태: '',
          메모: '',
          상태: '진행중',
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
    const body = await req.json()
    const supabase = createAdminClient()
    // 공실 등록 = 해당 방의 vacancy_status를 업데이트
    if (body.지점명 && body.방코드) {
      const { data: rooms } = await supabase.from('rooms').select('id, branches!inner(name)')
        .eq('room_code', body.방코드).eq('branches.name', body.지점명).limit(1)
      if (rooms && rooms[0]) {
        await supabase.from('rooms').update({
          vacancy_status: body.공실유형 || '공실', memo: body.메모 || null,
        }).eq('id', rooms[0].id)
      }
    }
    return NextResponse.json({ success: true, id: `vac_${Date.now()}` })
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }) }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    const supabase = createAdminClient()
    // id가 vac_room_xxx 형식이면 room ID 추출
    const roomId = id?.startsWith('vac_') ? id.replace('vac_', '') : id
    const update: Record<string, any> = {}
    if (data.상태 === '완료') update.vacancy_status = '입주중'
    else if (data.공실유형) update.vacancy_status = data.공실유형
    if (data.메모 !== undefined) update.memo = data.메모
    const { error } = await supabase.from('rooms').update(update).eq('id', roomId)
    if (error) return NextResponse.json({ error: '없음' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }) }
}
