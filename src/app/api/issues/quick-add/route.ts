import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { listOrEmpty } from '@/lib/supabase/helpers'

// CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' },
  })
}

// GET - 이슈 빠른 생성 (쿼리 파라미터로 생성)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const title = searchParams.get('title')
    if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 })

    const houseName = searchParams.get('houseName') || ''
    const category = searchParams.get('category') || '기타'
    const assignee = searchParams.get('assignee') || ''
    const dueDate = searchParams.get('dueDate') || ''
    const priority = searchParams.get('priority') || ''

    const supabase = createAdminClient()

    // 지점 ID 조회 (있으면)
    let branchId: string | null = null
    if (houseName) {
      const branches = await listOrEmpty<any>(supabase.from('branches').select('id').eq('name', houseName).limit(1))
      branchId = branches[0]?.id || null
    }

    // 워커 ID 조회 (있으면)
    let workerId: string | null = null
    if (assignee) {
      const workers = await listOrEmpty<any>(supabase.from('workers').select('id').eq('name', assignee).limit(1))
      workerId = workers[0]?.id || null
    }

    const memo = [priority ? `우선순위:${priority}` : '', dueDate ? `기한:${dueDate}` : ''].filter(Boolean).join(' / ')
    const id = `issue_${Date.now()}`

    const { error } = await supabase.from('issues').insert({
      id, branch_id: branchId, title, category, status: 'pending',
      scheduled_date: dueDate || null, worker_id: workerId, memo: memo || null,
    })
    if (error) throw error

    const res = NextResponse.json({ success: true, id, title, houseName, category })
    res.headers.set('Access-Control-Allow-Origin', '*')
    return res
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
