import { NextResponse } from 'next/server'
import { getSheetData, appendRow, updateRow } from '@/lib/sheets'
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

// POST/PUT는 Step 4.5 - Sheets 유지
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const id = `vac_${Date.now()}`
    await appendRow('공실', [id, body.지점명 || '', body.방코드 || '', body.공실유형 || '현재공실', body.공실시작일 || '', body.퇴실예정일 || '', body.예정자명 || '', body.예정자연락처 || '', body.예정입주일 || '', body.보증금상태 || '', body.메모 || '', body.상태 || '진행중'])
    return NextResponse.json({ success: true, id })
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }) }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    const rows = await getSheetData('공실')
    const idx = rows.findIndex(r => r[0] === id)
    if (idx === -1) return NextResponse.json({ error: '없음' }, { status: 404 })
    const e = rows[idx]
    await updateRow('공실', idx, [e[0], e[1], e[2], data.공실유형 ?? e[3], data.공실시작일 ?? e[4], data.퇴실예정일 ?? e[5], data.예정자명 ?? e[6], data.예정자연락처 ?? e[7], data.예정입주일 ?? e[8], data.보증금상태 ?? e[9], data.메모 ?? (e[10] || ''), data.상태 ?? (e[11] || '진행중')])
    return NextResponse.json({ success: true })
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }) }
}
