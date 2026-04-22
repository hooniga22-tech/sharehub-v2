import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth-helpers'

export const runtime = 'nodejs'

function ymdKst(): string {
  const d = new Date()
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000)
  const y = kst.getUTCFullYear()
  const m = String(kst.getUTCMonth() + 1).padStart(2, '0')
  const day = String(kst.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

type Body = {
  지점명?: string; 방코드?: string; 제목?: string; 태그?: string[]
  담당자명?: string; 시작일?: string; 마감일?: string; 금액?: number | string; 메모?: string
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin(); if (auth.error) return auth.error
    const body = (await req.json()) as Body
    if (!body.지점명 || !String(body.지점명).trim()) {
      return NextResponse.json({ error: '지점명 누락' }, { status: 400 })
    }
    const tags = Array.isArray(body.태그) ? body.태그.filter(Boolean) : []
    if (tags.length === 0) return NextResponse.json({ error: '태그 누락' }, { status: 400 })

    const supabase = createAdminClient()
    const id = `task_${Date.now()}`
    const autoTitle = `${tags[0]} · ${body.지점명}`
    const title = body.제목 && body.제목.trim() ? body.제목.trim() : autoTitle
    const amount = body.금액 !== undefined && body.금액 !== '' ? Number(body.금액) : 0

    // 지점 ID 조회
    let branchId: string | null = null
    const { data: branches } = await supabase.from('branches').select('id').eq('name', body.지점명).limit(1)
    branchId = branches?.[0]?.id || null

    // 담당자 ID 조회
    let workerId: string | null = null
    if (body.담당자명) {
      const { data: workers } = await supabase.from('workers').select('id').eq('name', body.담당자명).limit(1)
      workerId = workers?.[0]?.id || null
    }

    const { error } = await supabase.from('issues').insert({
      id, branch_id: branchId, title, category: tags[0] || '기타',
      description: body.메모 || null,
      status: body.마감일 ? 'pending' : 'pending',
      scheduled_date: body.시작일 || body.마감일 || null,
      worker_id: workerId, cost: amount || null, memo: tags.join(','),
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, id, 제목: title, 지점명: body.지점명, 태그: tags })
  } catch (e) {
    console.error('[register] 처리 중 오류', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
