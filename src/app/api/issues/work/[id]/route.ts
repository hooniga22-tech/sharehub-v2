import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth-helpers'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(); if (auth.error) return auth.error
    const { id } = await params
    const supabase = createAdminClient()
    const { data: issue, error } = await supabase
      .from('issues').select('*, branches(name), workers(name)').eq('id', id).single()
    if (error || !issue) return NextResponse.json({ error: 'not found' }, { status: 404 })

    const statusMap: Record<string, string> = { done: 'Y', pending: 'N', in_progress: 'N', cancelled: 'N' }
    return NextResponse.json({
      rowIndex: 0,
      용역ID: issue.id, 예정일: issue.scheduled_date || '', 지점명: issue.branches?.name || '',
      담당자명: issue.workers?.name || '', 작업종류: issue.category || '',
      정산금액: issue.cost || 0, 메모: issue.memo || '', 요청사항: issue.description || '',
      완료여부: statusMap[issue.status] || 'N', 완료일: issue.completed_date || '',
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(); if (auth.error) return auth.error
    const { id } = await params
    const body = await req.json()
    const supabase = createAdminClient()
    const update: Record<string, any> = {}

    if (body.예정일 !== undefined) update.scheduled_date = body.예정일 || null
    if (body.작업종류 !== undefined) update.category = body.작업종류
    if (body.메모 !== undefined) update.memo = body.메모
    if (body.요청사항 !== undefined) update.description = body.요청사항
    if (body.정산금액 !== undefined) update.cost = Number(body.정산금액) || null
    if (body.완료여부 !== undefined) {
      const isDone = body.완료여부 === true || body.완료여부 === 'Y'
      update.status = isDone ? 'done' : 'pending'
      if (isDone && !body.완료일) update.completed_date = new Date().toISOString().slice(0, 10)
    }
    if (body.완료일 !== undefined) update.completed_date = body.완료일 || null
    if (body.지점명 !== undefined) {
      const { data: b } = await supabase.from('branches').select('id').eq('name', body.지점명).limit(1).single()
      if (b) update.branch_id = b.id
    }
    if (body.담당자명 !== undefined) {
      const { data: w } = await supabase.from('workers').select('id').eq('name', body.담당자명).limit(1).single()
      if (w) update.worker_id = w.id
    }

    const { error } = await supabase.from('issues').update(update).eq('id', id)
    if (error) return NextResponse.json({ error: 'not found' }, { status: 404 })

    // 업데이트된 데이터 반환
    const { data: updated } = await supabase.from('issues').select('*, branches(name), workers(name)').eq('id', id).single()
    const sm: Record<string, string> = { done: 'Y', pending: 'N', in_progress: 'N', cancelled: 'N' }
    return NextResponse.json({
      rowIndex: 0, 용역ID: id, 예정일: updated?.scheduled_date || '', 지점명: updated?.branches?.name || '',
      담당자명: updated?.workers?.name || '', 작업종류: updated?.category || '',
      정산금액: updated?.cost || 0, 메모: updated?.memo || '', 요청사항: updated?.description || '',
      완료여부: sm[updated?.status] || 'N', 완료일: updated?.completed_date || '',
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin(); if (auth.error) return auth.error
    const { id } = await params
    const supabase = createAdminClient()
    const { error } = await supabase.from('issues').delete().eq('id', id)
    if (error) return NextResponse.json({ error: 'not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
