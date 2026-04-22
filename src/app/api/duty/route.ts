import { NextResponse } from 'next/server'
import { getSheetData, appendRow, updateRow } from '@/lib/sheets'
import { createAdminClient } from '@/lib/supabase/server'
import { listOrEmpty } from '@/lib/supabase/helpers'

function getMonday(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? 6 : day - 1
  const mon = new Date(now)
  mon.setDate(now.getDate() - diff)
  return mon.toISOString().slice(0, 10)
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const house = searchParams.get('house')
    if (!house) return NextResponse.json({ error: 'house 필수' }, { status: 400 })

    const supabase = createAdminClient()
    // duty_schedules: id, branch_id, tenant_id, duty_week_start, memo
    // branches 조인으로 지점명 확인, tenants 조인으로 입주자 정보
    const branches = await listOrEmpty<any>(supabase.from('branches').select('id, name').eq('name', house))
    const branchId = branches[0]?.id
    if (!branchId) {
      return NextResponse.json({ duties: [], thisWeek: getMonday() })
    }

    const rows = await listOrEmpty<any>(
      supabase.from('duty_schedules').select('*, tenants(name, rooms(room_code))').eq('branch_id', branchId).order('duty_week_start')
    )

    const duties = rows.map((r, i) => ({
      _rowIndex: i, 당번ID: r.id || '', 지점명: house,
      주차시작일: r.duty_week_start || '', 방코드: r.tenants?.rooms?.room_code || '',
      입주자명: r.tenants?.name || '', 당번유형: '당번',
      완료여부: '예정', 완료일시: '', 완료처리자: '',
      면제여부: 'N', 면제사유: '', 메모: r.memo || '',
    }))

    return NextResponse.json({ duties, thisWeek: getMonday() })
  } catch (e) {
    console.error(e); return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// POST/PUT는 Step 4.5 - Sheets 유지
export async function POST(req: Request) {
  try {
    const body = await req.json()
    if (body.batch && Array.isArray(body.duties)) {
      for (const d of body.duties) {
        await appendRow('당번', [d.당번ID || `duty_${Date.now()}`, d.지점명 || '', d.주차시작일 || '', d.방코드 || '', d.입주자명 || '', d.당번유형 || '당번', '예정', '', '', 'N', '', ''])
        await new Promise(r => setTimeout(r, 150))
      }
      return NextResponse.json({ success: true, count: body.duties.length })
    }
    const id = body.당번ID || `duty_${Date.now()}`
    await appendRow('당번', [id, body.지점명 || '', body.주차시작일 || '', body.방코드 || '', body.입주자명 || '', body.당번유형 || '당번', '예정', '', '', 'N', '', ''])
    return NextResponse.json({ success: true, id })
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }) }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    const rows = await getSheetData('당번')
    const idx = rows.findIndex(r => r[0] === id)
    if (idx === -1) return NextResponse.json({ error: '없음' }, { status: 404 })
    const e = rows[idx]
    const done = data.완료여부 ?? e[6]
    const doneAt = done === '완료' ? (data.완료일시 ?? new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })) : (data.완료일시 ?? e[7])
    await updateRow('당번', idx, [e[0], e[1], e[2], e[3], e[4], e[5], done, doneAt, data.완료처리자 ?? e[8], data.면제여부 ?? (e[9] || 'N'), data.면제사유 ?? (e[10] || ''), data.메모 ?? (e[11] || '')])
    return NextResponse.json({ success: true })
  } catch (e) { return NextResponse.json({ error: String(e) }, { status: 500 }) }
}
