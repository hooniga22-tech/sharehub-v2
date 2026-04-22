import { NextResponse } from 'next/server'
import { getSheetData, appendRow, updateRow, getSheetWithHeaders, colIdx } from '@/lib/sheets'
import { createAdminClient } from '@/lib/supabase/server'
import { listOrEmpty } from '@/lib/supabase/helpers'

// issues 테이블 -> 용역(work) 응답 매핑
function issueToWork(i: any, idx: number) {
  const statusMap: Record<string, string> = { done: 'Y', cancelled: 'N', pending: 'N', in_progress: 'N' }
  return {
    _rowIndex: idx,
    용역ID: i.id || '', 예정일: i.scheduled_date || '', 지점명: i.branches?.name || '',
    담당자명: i.workers?.name || '', 작업종류: i.category || '',
    정산금액: String(i.cost || 0), 메모: i.memo || '', 요청사항: i.description || '',
    완료여부: statusMap[i.status] || 'N', 완료일: i.completed_date || '',
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')
    const year = searchParams.get('year')
    const month = searchParams.get('month')
    const staff = searchParams.get('staff')

    const supabase = createAdminClient()

    // 토큰 조회: 담당자 정보 + 해당 담당자 일정
    if (token) {
      const { data: w, error } = await supabase.from('workers').select('*').eq('access_token', token).single()
      if (error || !w) return NextResponse.json({ error: '없음' }, { status: 404 })
      const staffInfo = {
        담당자ID: w.id, 이름: w.name, 연락처: w.phone || '', 분야: w.category || '',
        구분: '', 링크토큰: w.access_token || '', 기본금액: String(w.default_rate || ''),
      }
      const issues = await listOrEmpty<any>(
        supabase.from('issues').select('*, branches(name), workers(name)').eq('worker_id', w.id)
      )
      return NextResponse.json({ staff: staffInfo, schedules: issues.map((i, idx) => issueToWork(i, idx)) })
    }

    // 전체 조회
    let query = supabase.from('issues').select('*, branches(name), workers(name)')
    const rows = await listOrEmpty<any>(query)
    let works = rows.map((r, i) => issueToWork(r, i))

    if (year && month) {
      const prefix = `${year}-${String(month).padStart(2, '0')}`
      works = works.filter(w => w.예정일.startsWith(prefix))
    }
    if (staff) works = works.filter(w => w.담당자명 === staff)

    return NextResponse.json(works)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// POST/PUT는 Step 4.5에서 전환 - Sheets 유지
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const id = `work_${Date.now()}`
    await appendRow('용역', [id, body.예정일 || '', body.지점명 || '', body.담당자명 || '', body.작업종류 || '', body.정산금액 || '0', body.메모 || '', body.완료여부 || 'N'])
    return NextResponse.json({ success: true, id })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, ...data } = body
    const rows = await getSheetData('용역')
    const rowIndex = rows.findIndex(r => r[0] === id)
    if (rowIndex === -1) return NextResponse.json({ error: '없음' }, { status: 404 })
    const e = rows[rowIndex]
    await updateRow('용역', rowIndex, [e[0], data.예정일 ?? e[1], data.지점명 ?? e[2], data.담당자명 ?? e[3], data.작업종류 ?? e[4], data.정산금액 ?? e[5], data.메모 ?? (e[6] || ''), data.완료여부 ?? (e[7] || 'N')])
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
