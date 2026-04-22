import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { listOrEmpty } from '@/lib/supabase/helpers'

// Supabase issues -> 프론트 기대 필드 매핑
function sbToIssue(i: any, idx: number) {
  const statusMap: Record<string, string> = { pending: '접수', in_progress: '진행중', done: '완료', cancelled: '취소' }
  return {
    rowIndex: idx, id: i.id || '', houseName: i.branches?.name || '', roomCode: i.rooms?.room_code || '',
    title: i.title || '', content: i.description || '', category: i.category || '기타',
    status: statusMap[i.status] || i.status || '접수', assignee: i.workers?.name || '',
    createdAt: i.created_at ? i.created_at.slice(0, 10) : '', completedAt: i.completed_date || '',
    cost: i.cost || 0, memo: i.memo || '',
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const house = searchParams.get('house')
    const room = searchParams.get('room')

    const supabase = createAdminClient()
    let query = supabase.from('issues').select('*, branches(name), rooms(room_code), workers(name)')

    const rows = await listOrEmpty<any>(query)
    let issues = rows.map((r, i) => sbToIssue(r, i)).filter(i => i.id)

    if (house) issues = issues.filter(i => i.houseName === house)
    if (room) issues = issues.filter(i => i.roomCode === room)
    issues.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1))

    return NextResponse.json({ issues })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const supabase = createAdminClient()
    const id = `issue_${Date.now()}`

    let branchId: string | null = null
    if (body.houseName) {
      const { data: b } = await supabase.from('branches').select('id').eq('name', body.houseName).limit(1).single()
      branchId = b?.id || null
    }
    let workerId: string | null = null
    if (body.assignee) {
      const { data: w } = await supabase.from('workers').select('id').eq('name', body.assignee).limit(1).single()
      workerId = w?.id || null
    }

    const { error } = await supabase.from('issues').insert({
      id, branch_id: branchId, title: body.title || '', description: body.content || '',
      category: body.category || '기타', status: 'pending',
      worker_id: workerId, cost: Number(body.cost) || null, memo: body.memo || null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, id })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
