import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { listOrEmpty } from '@/lib/supabase/helpers'
import { requireAdmin } from '@/lib/auth-helpers'

export async function GET() {
  try {
    const auth = await requireAdmin(); if (auth.error) return auth.error
    const supabase = createAdminClient()
    // workers 테이���에서 활성 담당자 이름 목록
    const workers = await listOrEmpty<any>(supabase.from('workers').select('name').eq('is_active', true))
    const workerNames = workers.map(w => w.name).filter(Boolean)
    // issues 테이블에서 담당자 이름 (workers 조인)
    const issues = await listOrEmpty<any>(supabase.from('issues').select('workers(name)').not('worker_id', 'is', null))
    const issueNames = [...new Set(issues.map(i => i.workers?.name).filter(Boolean))]
    // 합치기: 내부 인원 + workers + issues에서 발견된 이름
    const internal = ['유재훈', '운영팀']
    const allNames = new Set([...internal, ...workerNames, ...issueNames])
    const result = [...internal, ...[...allNames].filter(n => !internal.includes(n))]
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
