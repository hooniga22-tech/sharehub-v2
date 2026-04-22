import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const supabase = createAdminClient()

    // 기존 issue 조회
    const { data: issue, error: fetchErr } = await supabase.from('issues').select('*').eq('id', id).single()
    if (fetchErr || !issue) return NextResponse.json({ error: 'not found' }, { status: 404 })

    const isDone = body.isDone !== undefined ? body.isDone : issue.status === 'done'
    const amount = body.amount !== undefined ? Number(body.amount) : (issue.cost || 0)

    // issues 테이블 업데이트
    const update: Record<string, any> = { cost: amount, status: isDone ? 'done' : 'pending' }
    if (isDone) update.completed_date = new Date().toISOString().slice(0, 10)
    else update.completed_date = null

    await supabase.from('issues').update(update).eq('id', id)

    // 완료 → expenses 자동 추가 (청소 카테고리)
    if (isDone && body.isDone === true) {
      const opexId = `opex_wk_${id}_${Date.now()}`
      const date = issue.scheduled_date || new Date().toISOString().slice(0, 10)
      const ym = date.slice(0, 7)

      // expense_categories에서 cleaning 카테고리 ID 찾기
      const { data: cat } = await supabase.from('expense_categories').select('id').eq('code', 'cleaning').single()

      await supabase.from('expenses').insert({
        id: opexId, branch_id: issue.branch_id, category_id: cat?.id || 'exp_cleaning',
        year_month: ym, amount, paid_date: date,
        memo: `용역 자동연동: ${id}`,
      })
    }

    // 완료 취소 → expenses 제거 (해당 issue ID가 memo에 포함된 항목)
    if (!isDone && body.isDone === false) {
      const { data: opexRows } = await supabase.from('expenses').select('id, memo').like('memo', `%${id}%`)
      if (opexRows && opexRows.length > 0) {
        for (const row of opexRows) {
          await supabase.from('expenses').update({ amount: 0, memo: `취소됨: ${row.memo}` }).eq('id', row.id)
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
