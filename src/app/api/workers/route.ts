import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { listOrEmpty } from '@/lib/supabase/helpers'
import { requireAdmin } from '@/lib/auth-helpers'

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
    const auth = await requireAdmin(); if (auth.error) return auth.error
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

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin(); if (auth.error) return auth.error
    const body = await req.json()
    const supabase = createAdminClient()
    const id = `work_${Date.now()}`

    // 지점명 → branch_id, 담당자명 → worker_id 조회
    let branchId: string | null = null
    let workerId: string | null = null
    if (body.지점명) {
      const { data: b } = await supabase.from('branches').select('id').eq('name', body.지점명).limit(1).single()
      branchId = b?.id || null
    }
    if (body.담당자명) {
      const { data: w } = await supabase.from('workers').select('id').eq('name', body.담당자명).limit(1).single()
      workerId = w?.id || null
    }

    const statusMap: Record<string, string> = { Y: 'done', N: 'pending' }
    const { error } = await supabase.from('issues').insert({
      id, branch_id: branchId, title: `${body.작업종류 || ''} - ${body.지점명 || ''}`,
      category: body.작업종류 || '', status: statusMap[body.완료여부] || 'pending',
      scheduled_date: body.예정일 || null, worker_id: workerId,
      cost: Number(body.정산금액) || null, memo: body.메모 || null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, id })
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
    if (data.예정일 !== undefined) update.scheduled_date = data.예정일 || null
    if (data.작업종류 !== undefined) update.category = data.작업종류
    if (data.정산금액 !== undefined) update.cost = Number(data.정산금액) || null
    if (data.메모 !== undefined) update.memo = data.메모
    if (data.완료여부 !== undefined) {
      update.status = data.완료여부 === 'Y' ? 'done' : 'pending'
      if (data.완료여부 === 'Y') update.completed_date = new Date().toISOString().slice(0, 10)
    }
    const { error } = await supabase.from('issues').update(update).eq('id', id)
    if (error) return NextResponse.json({ error: '없음' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
